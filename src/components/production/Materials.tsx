import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  sb, fmtDate, LOT_STATUS_LABEL, peroxideCeiling,
  type RawMaterial, type RawMaterialLot, type QcTemplate, type QcTemplateItem,
} from "@/lib/production";

// One rendered QC field's live state.
type FieldState = { value: string; passed: boolean | null };

const todayISO = () => new Date().toISOString().slice(0, 10);

const Materials = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [lots, setLots] = useState<RawMaterialLot[]>([]);
  const [templates, setTemplates] = useState<QcTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Receive-lot form.
  const [form, setForm] = useState({
    rawMaterialId: "", supplier: "", supplierLotNumber: "",
    qtyReceived: "", unit: "g", receivedDate: todayISO(), bestBefore: "",
  });

  // QC panel state, keyed by lotId → parameter → field.
  const [qc, setQc] = useState<Record<string, Record<string, FieldState>>>({});
  const [openLot, setOpenLot] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, l, t] = await Promise.all([
      sb.from("raw_materials").select("*").order("name"),
      sb.from("raw_material_lots").select("*, raw_materials ( name, inci_name, role, qc_spec )").order("created_at", { ascending: false }),
      sb.from("qc_templates").select("*, qc_template_items ( * )").eq("type", "incoming"),
    ]);
    setMaterials((m.data as RawMaterial[]) ?? []);
    setLots((l.data as RawMaterialLot[]) ?? []);
    setTemplates((t.data as QcTemplate[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const materialsById = useMemo(() => Object.fromEntries(materials.map((m) => [m.id, m])), [materials]);
  const allItems = useMemo(() => sortedItems(templates.find((t) => t.applies_to === "all")), [templates]);
  const hempItems = useMemo(() => sortedItems(templates.find((t) => t.applies_to === "hemp")), [templates]);

  const receive = async () => {
    if (!form.rawMaterialId) { toast.error("Pick a material."); return; }
    if (!Number(form.qtyReceived)) { toast.error("Enter a received quantity."); return; }
    setBusy("receive");
    const { data, error } = await supabase.functions.invoke("receive-raw-lot", {
      body: {
        rawMaterialId: form.rawMaterialId, supplier: form.supplier, supplierLotNumber: form.supplierLotNumber,
        qtyReceived: Number(form.qtyReceived), unit: form.unit, receivedDate: form.receivedDate || null, bestBefore: form.bestBefore || null,
      },
    });
    setBusy(null);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error || "Could not receive the lot.");
      return;
    }
    toast.success("Lot received → quarantine. Run incoming QC to release it.");
    setForm((f) => ({ ...f, supplier: "", supplierLotNumber: "", qtyReceived: "", bestBefore: "" }));
    load();
  };

  // Which QC items apply to a lot (all lots get the 'all' items; hemp-style adds PV).
  const itemsForLot = useCallback((lot: RawMaterialLot): QcTemplateItem[] => {
    const mat = materialsById[lot.raw_material_id];
    const extra = peroxideCeiling(mat) != null ? hempItems : [];
    return [...allItems, ...extra];
  }, [allItems, hempItems, materialsById]);

  const setField = (lotId: string, param: string, patch: Partial<FieldState>) =>
    setQc((prev) => ({ ...prev, [lotId]: { ...prev[lotId], [param]: { value: "", passed: null, ...prev[lotId]?.[param], ...patch } } }));

  const decide = async (lot: RawMaterialLot, decision: "release" | "reject") => {
    const items = itemsForLot(lot);
    const state = qc[lot.id] ?? {};
    const pvItem = items.find((i) => /peroxide/i.test(i.parameter));
    const peroxideValue = pvItem ? state[pvItem.parameter]?.value ?? "" : undefined;

    const payloadItems = items.map((i) => ({
      parameter: i.parameter,
      value: state[i.parameter]?.value ?? null,
      expected: i.expected,
      gating: i.gating,
      passed: state[i.parameter]?.passed ?? null,
    }));

    setBusy(lot.id);
    const { data, error } = await supabase.functions.invoke("release-raw-lot", {
      body: { lotId: lot.id, decision, items: payloadItems, peroxideValue },
    });
    setBusy(null);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error || "Could not record QC.");
      return;
    }
    toast.success(decision === "release" ? "Lot released." : "Lot rejected.");
    setOpenLot(null);
    load();
  };

  // Client-side mirror of the server gate, to enable/disable the Release button.
  const canRelease = (lot: RawMaterialLot): boolean => {
    const items = itemsForLot(lot);
    const state = qc[lot.id] ?? {};
    const mat = materialsById[lot.raw_material_id];
    const pvMax = peroxideCeiling(mat);
    for (const it of items) {
      if (/peroxide/i.test(it.parameter) && pvMax != null) {
        const v = Number(state[it.parameter]?.value);
        if (!Number.isFinite(v) || v > pvMax) return false;
        continue;
      }
      if (it.gating && state[it.parameter]?.passed !== true) return false;
    }
    return true;
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading materials…</p>;

  const quarantined = lots.filter((l) => l.status === "quarantine");

  return (
    <div className="space-y-12 max-w-[900px]">
      {/* Master list */}
      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-4">Raw materials</h3>
        <div className="border border-border divide-y divide-border">
          {materials.map((m) => {
            const pv = peroxideCeiling(m);
            return (
              <div key={m.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-body font-medium">{m.name}{" "}
                    <span className="text-xs font-typewriter uppercase tracking-widest text-muted-foreground">{m.role}</span>
                  </p>
                  <p className="text-sm font-body text-muted-foreground italic">{m.inci_name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {m.is_au_grown && <Tag>Australian-grown</Tag>}
                    {m.dg_flag && <Tag>Dangerous good</Tag>}
                    {m.allergen_flags?.map((a) => <Tag key={a}>{a.replace(/_/g, " ")}</Tag>)}
                    {pv != null && <Tag>PV ≤ {pv} meq/kg</Tag>}
                    {(m.qc_spec as { labelling_only?: boolean })?.labelling_only && <Tag>labelling only</Tag>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Receive a lot */}
      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-4">Receive a lot</h3>
        <div className="border border-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Material</span>
            <select
              value={form.rawMaterialId}
              onChange={(e) => {
                const mat = materialsById[e.target.value];
                setForm((f) => ({ ...f, rawMaterialId: e.target.value, supplier: mat?.default_supplier ?? f.supplier }));
              }}
              className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              <option value="">Select…</option>
              {materials.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <Field label="Supplier" value={form.supplier} onChange={(v) => setForm((f) => ({ ...f, supplier: v }))} />
          <Field label="Supplier lot #" value={form.supplierLotNumber} onChange={(v) => setForm((f) => ({ ...f, supplierLotNumber: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Qty received" type="number" value={form.qtyReceived} onChange={(v) => setForm((f) => ({ ...f, qtyReceived: v }))} />
            <Field label="Unit" value={form.unit} onChange={(v) => setForm((f) => ({ ...f, unit: v }))} />
          </div>
          <Field label="Received date" type="date" value={form.receivedDate} onChange={(v) => setForm((f) => ({ ...f, receivedDate: v }))} />
          <Field label="Best before" type="date" value={form.bestBefore} onChange={(v) => setForm((f) => ({ ...f, bestBefore: v }))} />
          <div className="sm:col-span-2">
            <button onClick={receive} disabled={busy === "receive"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
              {busy === "receive" ? "…" : "Receive → quarantine"}
            </button>
          </div>
        </div>
      </section>

      {/* Quarantine queue with incoming QC */}
      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-4">
          Awaiting incoming QC {quarantined.length > 0 && <span className="text-muted-foreground">({quarantined.length})</span>}
        </h3>
        {quarantined.length === 0 ? (
          <p className="font-body text-muted-foreground">Nothing in quarantine. ✓</p>
        ) : (
          <div className="space-y-3">
            {quarantined.map((lot) => {
              const mat = materialsById[lot.raw_material_id];
              const items = itemsForLot(lot);
              const open = openLot === lot.id;
              return (
                <div key={lot.id} className="border border-foreground/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-body font-medium">{mat?.name ?? "—"}</p>
                      <p className="text-xs font-body text-muted-foreground">
                        {lot.supplier || "supplier?"} · lot {lot.supplier_lot_number || "?"} · {lot.qty_received} {lot.unit} · BB {fmtDate(lot.best_before)}
                      </p>
                    </div>
                    <button onClick={() => setOpenLot(open ? null : lot.id)} className="btn-outline text-xs px-3 py-1">
                      {open ? "Close" : "Incoming QC"}
                    </button>
                  </div>

                  {open && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {items.map((it) => (
                        <QcField key={it.id} item={it} state={qc[lot.id]?.[it.parameter]} onChange={(patch) => setField(lot.id, it.parameter, patch)} />
                      ))}
                      <div className="flex items-center gap-2 pt-2">
                        <button onClick={() => decide(lot, "release")} disabled={busy === lot.id || !canRelease(lot)} className="btn-primary text-xs px-4 py-2 disabled:opacity-40">
                          {busy === lot.id ? "…" : "Release lot"}
                        </button>
                        <button onClick={() => decide(lot, "reject")} disabled={busy === lot.id} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40">
                          Reject
                        </button>
                        {!canRelease(lot) && <span className="text-xs font-body text-muted-foreground">All gating checks must pass to release.</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Full lot list */}
      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-4">All lots</h3>
        {lots.length === 0 ? (
          <p className="font-body text-muted-foreground">No lots yet.</p>
        ) : (
          <div className="border border-border divide-y divide-border text-sm">
            {lots.map((lot) => {
              const mat = materialsById[lot.raw_material_id];
              return (
                <div key={lot.id} className="p-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-body font-medium w-44 shrink-0">{mat?.name ?? "—"}</span>
                  <span className="text-muted-foreground w-32 shrink-0">lot {lot.supplier_lot_number || "?"}</span>
                  <span className="text-muted-foreground w-28 shrink-0">{lot.qty_remaining} / {lot.qty_received} {lot.unit}</span>
                  <span className="text-muted-foreground w-28 shrink-0">BB {fmtDate(lot.best_before)}</span>
                  <StatusPill status={lot.status} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

function sortedItems(t: QcTemplate | undefined): QcTemplateItem[] {
  return [...(t?.qc_template_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
}

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{children}</span>
);

const StatusPill = ({ status }: { status: RawMaterialLot["status"] }) => (
  <span className={`text-xs uppercase tracking-widest px-2 py-0.5 ${status === "released" ? "bg-foreground text-background" : status === "rejected" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
    {LOT_STATUS_LABEL[status]}
  </span>
);

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <label className="text-sm">
    <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
  </label>
);

// Renders one QC checklist item with the right control(s) for its input_type.
const QcField = ({ item, state, onChange }: { item: QcTemplateItem; state: FieldState | undefined; onChange: (patch: Partial<FieldState>) => void }) => {
  const passFail = (
    <span className="flex gap-1">
      <PassBtn active={state?.passed === true} onClick={() => onChange({ passed: true, value: state?.value || "pass" })}>Pass</PassBtn>
      <FailBtn active={state?.passed === false} onClick={() => onChange({ passed: false, value: state?.value || "fail" })}>Fail</FailBtn>
    </span>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-body">{item.parameter}{item.gating && <span className="text-destructive"> *</span>}</p>
        {item.expected && <p className="text-xs font-body text-muted-foreground">Expected: {item.expected}</p>}
      </div>
      <div className="flex items-center gap-2">
        {item.input_type === "pass_fail" && passFail}
        {item.input_type === "boolean" && (
          <span className="flex gap-1">
            <PassBtn active={state?.value === "true"} onClick={() => onChange({ value: "true", passed: true })}>Yes</PassBtn>
            <FailBtn active={state?.value === "false"} onClick={() => onChange({ value: "false", passed: false })}>No</FailBtn>
          </span>
        )}
        {item.input_type === "numeric" && (
          <input type="number" placeholder="value" value={state?.value ?? ""} onChange={(e) => onChange({ value: e.target.value })}
            className="w-24 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        )}
        {item.input_type === "date" && (
          <>
            <input type="date" value={state?.value ?? ""} onChange={(e) => onChange({ value: e.target.value })}
              className="px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
            {item.gating && passFail}
          </>
        )}
        {item.input_type === "text" && (
          <input type="text" placeholder="note" value={state?.value ?? ""} onChange={(e) => onChange({ value: e.target.value })}
            className="w-40 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        )}
        {/* numeric/text gating items that aren't the peroxide value still need a judgment */}
        {(item.input_type === "numeric" || item.input_type === "text") && item.gating && !/peroxide/i.test(item.parameter) && passFail}
      </div>
    </div>
  );
};

const PassBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`text-xs font-typewriter uppercase tracking-wider px-2.5 py-1 border ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{children}</button>
);
const FailBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`text-xs font-typewriter uppercase tracking-wider px-2.5 py-1 border ${active ? "bg-destructive text-destructive-foreground border-destructive" : "border-border text-muted-foreground hover:text-foreground"}`}>{children}</button>
);

export default Materials;
