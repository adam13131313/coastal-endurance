import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  sb, fmtDate, fmtDateTime, fmtGrams, BATCH_STATUS_LABEL, qcPayload, allGatingPassed,
  type ProductionBatch, type BatchComponent, type QcCheck, type RawMaterialLot, type QcTemplate, type QcTemplateItem, type QcState,
} from "@/lib/production";
import QcChecklist from "@/components/production/QcChecklist";

const todayISO = () => new Date().toISOString().slice(0, 10);
const sortItems = (t?: QcTemplate) => [...(t?.qc_template_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);

const Batches = () => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [releasedLots, setReleasedLots] = useState<RawMaterialLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [batch, setBatch] = useState<ProductionBatch | null>(null);
  const [components, setComponents] = useState<BatchComponent[]>([]);
  const [checks, setChecks] = useState<QcCheck[]>([]);

  // New-batch + editing state.
  const [newMass, setNewMass] = useState("21000");
  const [newNumber, setNewNumber] = useState("");
  const [blend, setBlend] = useState<Record<string, { actualG: string; lotId: string }>>({});
  const [yieldUnits, setYieldUnits] = useState("");
  const [inProcess, setInProcess] = useState<QcState>({});
  const [finished, setFinished] = useState<QcState>({});
  const [bestBefore, setBestBefore] = useState("");

  const inProcessItems = useMemo<QcTemplateItem[]>(() => sortItems(templates.find((t) => t.type === "in_process")), [templates]);
  const finishedItems = useMemo<QcTemplateItem[]>(() => sortItems(templates.find((t) => t.type === "finished")), [templates]);

  const loadBatches = useCallback(async () => {
    const { data } = await sb.from("production_batches").select("*").order("created_at", { ascending: false });
    setBatches((data as ProductionBatch[]) ?? []);
  }, []);

  const loadRefs = useCallback(async () => {
    const [t, l] = await Promise.all([
      sb.from("qc_templates").select("*, qc_template_items ( * )").in("type", ["in_process", "finished"]),
      sb.from("raw_material_lots").select("*, raw_materials ( name )").eq("status", "released").gt("qty_remaining", 0),
    ]);
    setTemplates((t.data as QcTemplate[]) ?? []);
    setReleasedLots((l.data as RawMaterialLot[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([loadBatches(), loadRefs()]); setLoading(false); })();
  }, [loadBatches, loadRefs]);

  const openDetail = useCallback(async (batchId: string) => {
    setSelected(batchId);
    const [b, c, q] = await Promise.all([
      sb.from("production_batches").select("*").eq("id", batchId).maybeSingle(),
      sb.from("batch_components").select("*, raw_materials ( name ), raw_material_lots ( supplier_lot_number, supplier )").eq("batch_id", batchId),
      sb.from("qc_checks").select("*, qc_check_items ( * )").eq("subject_type", "batch").eq("subject_id", batchId).order("performed_at", { ascending: false }),
    ]);
    const bt = (b.data as ProductionBatch) ?? null;
    const comps = (c.data as BatchComponent[]) ?? [];
    setBatch(bt);
    setComponents(comps);
    setChecks((q.data as QcCheck[]) ?? []);
    setBlend(Object.fromEntries(comps.map((cc) => [cc.id, { actualG: cc.actual_g != null ? String(cc.actual_g) : "", lotId: cc.raw_material_lot_id ?? "" }])));
    setYieldUnits(bt?.yield_units != null ? String(bt.yield_units) : "");
    setBestBefore(bt?.best_before ?? "");
    setInProcess({}); setFinished({});
  }, []);

  const refreshDetail = useCallback(async () => {
    if (selected) { await Promise.all([loadBatches(), loadRefs()]); await openDetail(selected); }
  }, [selected, loadBatches, loadRefs, openDetail]);

  const locked = batch?.status === "released" || batch?.status === "rejected";

  const createBatch = async () => {
    if (!Number(newMass)) { toast.error("Enter a planned mass."); return; }
    setBusy("create");
    const { data, error } = await supabase.functions.invoke("record-batch", {
      body: { action: "create", plannedMassG: Number(newMass), batchNumber: newNumber || undefined },
    });
    setBusy(null);
    if (error || (data as { error?: string })?.error) { toast.error((data as { error?: string })?.error || "Could not create the batch."); return; }
    toast.success("Batch opened.");
    setNewNumber("");
    await loadBatches();
    const created = (data as { batch?: ProductionBatch })?.batch;
    if (created) openDetail(created.id);
  };

  const saveBlend = async () => {
    const updates = components
      .filter((c) => blend[c.id]?.lotId && blend[c.id]?.actualG !== "")
      .map((c) => ({ batchComponentId: c.id, actualG: Number(blend[c.id].actualG), rawMaterialLotId: blend[c.id].lotId }));
    if (!updates.length) { toast.error("Enter actual grams and pick a lot for at least one ingredient."); return; }
    setBusy("blend");
    const { data, error } = await supabase.functions.invoke("record-batch", { body: { action: "blend", batchId: selected, components: updates } });
    setBusy(null);
    if (error || (data as { error?: string })?.error) { toast.error((data as { error?: string })?.error || "Could not save the blend."); return; }
    toast.success("Blend recorded; lot quantities decremented.");
    refreshDetail();
  };

  const recordFill = async () => {
    if (yieldUnits === "" || !Number.isFinite(Number(yieldUnits))) { toast.error("Enter the units filled."); return; }
    setBusy("fill");
    const { data, error } = await supabase.functions.invoke("record-batch", { body: { action: "fill", batchId: selected, yieldUnits: Number(yieldUnits) } });
    setBusy(null);
    if (error || (data as { error?: string })?.error) { toast.error((data as { error?: string })?.error || "Could not record the fill."); return; }
    toast.success("Fill recorded.");
    refreshDetail();
  };

  const submitQc = async (qcType: "in_process" | "finished") => {
    const items = qcType === "in_process" ? inProcessItems : finishedItems;
    const state = qcType === "in_process" ? inProcess : finished;
    setBusy(qcType);
    const { data, error } = await supabase.functions.invoke("submit-batch-qc", { body: { batchId: selected, qcType, items: qcPayload(items, state) } });
    setBusy(null);
    if (error || (data as { error?: string })?.error) { toast.error((data as { error?: string })?.error || "Could not record QC."); return; }
    toast.success(`${qcType === "in_process" ? "In-process" : "Finished"} QC recorded (${(data as { result?: string })?.result}).`);
    refreshDetail();
  };

  const release = async (decision: "release" | "reject") => {
    setBusy("release");
    const { data, error } = await supabase.functions.invoke("release-batch", { body: { batchId: selected, decision, bestBefore: bestBefore || null } });
    setBusy(null);
    if (error || (data as { error?: string })?.error) { toast.error((data as { error?: string })?.error || "Could not update the batch."); return; }
    toast.success(decision === "release" ? "Batch released." : "Batch rejected.");
    refreshDetail();
  };

  const exportBmr = () => {
    if (!batch) return;
    const lines: string[] = [];
    lines.push(`BATCH MANUFACTURING RECORD — ${batch.batch_number}`, "Coastal Endurance · Field Oil", "");
    lines.push(`Status: ${BATCH_STATUS_LABEL[batch.status]}`, `Operator: ${batch.operator ?? "—"}`, `Planned mass: ${fmtGrams(batch.planned_mass_g)}`);
    lines.push(`Started: ${fmtDateTime(batch.started_at)}`, `Filled: ${fmtDateTime(batch.filled_at)}`, `Yield: ${batch.yield_units ?? "—"} units (theoretical ${batch.theoretical_units ?? "—"})`);
    lines.push(`Released: ${fmtDateTime(batch.released_at)} by ${batch.released_by ?? "—"}`, `Best before: ${fmtDate(batch.best_before)}`, "");
    lines.push("INGREDIENTS (target / actual / lot)");
    for (const c of components) lines.push(`  ${c.raw_materials?.name ?? "—"}: ${fmtGrams(c.target_g)} / ${fmtGrams(c.actual_g)} / lot ${c.raw_material_lots?.supplier_lot_number ?? "—"}`);
    lines.push("", "QC CHECKS");
    for (const q of checks) {
      lines.push(`  [${q.type}] ${q.result?.toUpperCase()} — ${fmtDateTime(q.performed_at)} by ${q.performed_by ?? "—"}`);
      for (const it of q.qc_check_items ?? []) lines.push(`     ${it.parameter}: ${it.value ?? ""}${it.passed == null ? "" : it.passed ? " ✓" : " ✗"}`);
    }
    const blobUrl = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = blobUrl; a.download = `BMR_${batch.batch_number}.txt`; a.click();
    URL.revokeObjectURL(blobUrl);
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading batches…</p>;

  // ---- Detail (BMR) view ---------------------------------------------------
  if (selected && batch) {
    const actualTotal = components.reduce((s, c) => s + (Number(c.actual_g) || 0), 0);
    const variancePct = batch.planned_mass_g ? ((actualTotal - batch.planned_mass_g) / batch.planned_mass_g) * 100 : 0;
    const varianceFlag = Math.abs(variancePct) > 2;
    const latestFinished = checks.find((c) => c.type === "finished");
    const finishedPassed = latestFinished?.result === "pass" && (latestFinished.qc_check_items ?? []).filter((i) => i.gating).every((i) => i.passed === true);

    return (
      <div className="max-w-[900px]" id="bmr-print">
        <button onClick={() => { setSelected(null); setBatch(null); }} className="text-sm font-body text-muted-foreground hover:text-foreground mb-4">← All batches</button>

        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h3 className="font-typewriter text-xl uppercase tracking-wider">{batch.batch_number}</h3>
            <p className="text-sm font-body text-muted-foreground">Operator {batch.operator ?? "—"} · opened {fmtDate(batch.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={batch.status} />
            <button onClick={() => window.print()} className="btn-outline text-xs px-3 py-1">Print</button>
            <button onClick={exportBmr} className="btn-outline text-xs px-3 py-1">Export</button>
          </div>
        </div>

        {locked && (
          <p className="mb-6 text-xs font-body text-muted-foreground border border-border p-3">
            This batch is {BATCH_STATUS_LABEL[batch.status].toLowerCase()} and read-only. Corrections must be made as a new batch, keeping this record intact.
          </p>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 text-sm">
          <Stat label="Planned mass" value={fmtGrams(batch.planned_mass_g)} />
          <Stat label="Theoretical" value={`${batch.theoretical_units ?? "—"} units`} />
          <Stat label="Yield" value={batch.yield_units != null ? `${batch.yield_units} units` : "—"} />
          <Stat label="Best before" value={fmtDate(batch.best_before)} />
        </div>

        {/* Blend */}
        <Section title="Blend — actual weights & lots">
          <div className="border border-border divide-y divide-border">
            {components.map((c) => (
              <div key={c.id} className="p-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-center">
                <span className="font-body text-sm">{c.raw_materials?.name} <span className="text-muted-foreground">· target {fmtGrams(c.target_g)}</span></span>
                <input
                  type="number" placeholder="actual g" disabled={locked}
                  value={blend[c.id]?.actualG ?? ""}
                  onChange={(e) => setBlend((b) => ({ ...b, [c.id]: { ...b[c.id], actualG: e.target.value, lotId: b[c.id]?.lotId ?? "" } }))}
                  className="w-28 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50"
                />
                <select
                  disabled={locked}
                  value={blend[c.id]?.lotId ?? ""}
                  onChange={(e) => setBlend((b) => ({ ...b, [c.id]: { ...b[c.id], lotId: e.target.value, actualG: b[c.id]?.actualG ?? "" } }))}
                  className="w-56 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50"
                >
                  <option value="">Select released lot…</option>
                  {releasedLots.filter((l) => l.raw_material_id === c.raw_material_id).map((l) => (
                    <option key={l.id} value={l.id}>lot {l.supplier_lot_number || "?"} · {l.qty_remaining}{l.unit} left</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <p className={`text-sm font-body ${varianceFlag ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              Recorded total {fmtGrams(actualTotal)} · reconciliation {variancePct >= 0 ? "+" : ""}{variancePct.toFixed(2)}%{varianceFlag ? " (outside ±2% — investigate before fill)" : ""}
            </p>
            {!locked && <button onClick={saveBlend} disabled={busy === "blend"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "blend" ? "…" : "Save blend"}</button>}
          </div>
        </Section>

        {/* Fill */}
        <Section title="Fill">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Units filled</span>
              <input type="number" disabled={locked} value={yieldUnits} onChange={(e) => setYieldUnits(e.target.value)}
                className="w-32 px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground disabled:opacity-50" />
            </label>
            {!locked && <button onClick={recordFill} disabled={busy === "fill"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "fill" ? "…" : "Record fill"}</button>}
          </div>
        </Section>

        {/* In-process QC */}
        {!locked && (
          <Section title="In-process QC">
            <QcChecklist items={inProcessItems} state={inProcess} onChange={(p, patch) => setInProcess((s) => ({ ...s, [p]: { value: "", passed: null, ...s[p], ...patch } }))} />
            <button onClick={() => submitQc("in_process")} disabled={busy === "in_process"} className="btn-outline text-xs px-4 py-2 mt-3 disabled:opacity-50">Record in-process QC</button>
          </Section>
        )}

        {/* Finished QC */}
        {!locked && (
          <Section title="Finished QC">
            <QcChecklist items={finishedItems} state={finished} onChange={(p, patch) => setFinished((s) => ({ ...s, [p]: { value: "", passed: null, ...s[p], ...patch } }))} />
            <button onClick={() => submitQc("finished")} disabled={busy === "finished"} className="btn-outline text-xs px-4 py-2 mt-3 disabled:opacity-50">Record finished QC</button>
            {!allGatingPassed(finishedItems, finished) && <p className="mt-2 text-xs font-body text-muted-foreground">All gating checks (*) must pass for the finished QC to pass.</p>}
          </Section>
        )}

        {/* QC history */}
        <Section title="QC history">
          {checks.length === 0 ? <p className="font-body text-muted-foreground text-sm">No checks recorded yet.</p> : (
            <div className="space-y-3">
              {checks.map((q) => (
                <div key={q.id} className="border border-border p-3">
                  <p className="text-sm font-body">
                    <span className="font-typewriter uppercase tracking-wider text-xs">{q.type.replace("_", "-")}</span>{" · "}
                    <span className={q.result === "pass" ? "text-foreground font-medium" : q.result === "fail" ? "text-destructive font-medium" : "text-muted-foreground"}>{q.result}</span>
                    {" · "}<span className="text-muted-foreground">{fmtDateTime(q.performed_at)} · {q.performed_by}</span>
                  </p>
                  <ul className="mt-2 space-y-0.5 text-xs font-body text-muted-foreground">
                    {(q.qc_check_items ?? []).map((it) => (
                      <li key={it.id}>{it.parameter}: {it.value || "—"}{it.passed == null ? "" : it.passed ? " ✓" : " ✗"}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Release */}
        {!locked && (
          <Section title="Release">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Best before</span>
                <input type="date" value={bestBefore} onChange={(e) => setBestBefore(e.target.value)}
                  className="px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
              </label>
              <button onClick={() => release("release")} disabled={busy === "release" || !finishedPassed} className="btn-primary text-xs px-4 py-2 disabled:opacity-40">
                {busy === "release" ? "…" : "Release batch"}
              </button>
              <button onClick={() => release("reject")} disabled={busy === "release"} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40">Reject</button>
            </div>
            {!finishedPassed && <p className="mt-2 text-xs font-body text-muted-foreground">A passing finished QC check is required before release. Self-release: the signer is recorded even though there's no separate approver yet.</p>}
          </Section>
        )}
      </div>
    );
  }

  // ---- List view -----------------------------------------------------------
  return (
    <div className="max-w-[900px] space-y-10">
      <section className="border border-border p-4">
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-3">New batch</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Planned mass (g)</span>
            <input type="number" value={newMass} onChange={(e) => setNewMass(e.target.value)}
              className="w-32 px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Batch number</span>
            <input placeholder={`FO-${todayISO().replace(/-/g, "")}`} value={newNumber} onChange={(e) => setNewNumber(e.target.value)}
              className="w-44 px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
          <button onClick={createBatch} disabled={busy === "create"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "create" ? "…" : "Open batch"}</button>
        </div>
        <p className="mt-2 text-xs font-body text-muted-foreground">Seeds gram targets from the active formula. Leave the number blank to auto-number FO-YYYYMMDD.</p>
      </section>

      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-4">Batches</h3>
        {batches.length === 0 ? <p className="font-body text-muted-foreground">No batches yet.</p> : (
          <div className="border border-border divide-y divide-border">
            {batches.map((b) => (
              <button key={b.id} onClick={() => openDetail(b.id)} className="w-full text-left p-3 flex flex-wrap items-center gap-x-4 gap-y-1 hover:bg-secondary/40 transition-colors">
                <span className="font-body font-medium w-40 shrink-0">{b.batch_number}</span>
                <span className="text-sm text-muted-foreground w-28 shrink-0">{fmtGrams(b.planned_mass_g)}</span>
                <span className="text-sm text-muted-foreground w-28 shrink-0">{b.yield_units != null ? `${b.yield_units} units` : "—"}</span>
                <span className="text-sm text-muted-foreground w-28 shrink-0">{fmtDate(b.created_at)}</span>
                <StatusPill status={b.status} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h4 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground mb-3">{title}</h4>
    {children}
  </section>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-border p-3">
    <p className="font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-body mt-0.5">{value}</p>
  </div>
);

const StatusPill = ({ status }: { status: ProductionBatch["status"] }) => (
  <span className={`text-xs uppercase tracking-widest px-2 py-0.5 ${status === "released" ? "bg-foreground text-background" : status === "rejected" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
    {BATCH_STATUS_LABEL[status]}
  </span>
);

export default Batches;
