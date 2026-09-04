import { useCallback, useEffect, useMemo, useState } from "react";
import { sb, fmtDateTime, type QcCheck } from "@/lib/production";

// All QC checks, filterable, plus the hemp peroxide-value trend over time — the
// single most important number for shelf life, so it gets its own view.
type Filter = "all" | "incoming" | "in_process" | "finished";

const QCLog = () => {
  const [checks, setChecks] = useState<QcCheck[]>([]);
  const [subjectLabels, setSubjectLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: batches }, { data: lots }] = await Promise.all([
      sb.from("qc_checks").select("*, qc_check_items ( * )").order("performed_at", { ascending: false }),
      sb.from("production_batches").select("id, batch_number"),
      sb.from("raw_material_lots").select("id, supplier_lot_number, raw_materials ( name )"),
    ]);
    // Map each subject_id (a batch or a raw-material lot) to a readable label.
    const labels: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const b of (batches as any[]) ?? []) labels[b.id] = b.batch_number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const l of (lots as any[]) ?? []) labels[l.id] = `${l.raw_materials?.name ?? "lot"} · lot ${l.supplier_lot_number || "?"}`;
    setSubjectLabels(labels);
    setChecks((data as QcCheck[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => (filter === "all" ? checks : checks.filter((c) => c.type === filter)), [checks, filter]);

  // Hemp PV trend: pull peroxide items from incoming checks, oldest → newest.
  const pvPoints = useMemo(() => {
    const pts: { at: string; value: number; passed: boolean | null }[] = [];
    for (const c of checks) {
      if (c.type !== "incoming") continue;
      for (const it of c.qc_check_items ?? []) {
        if (/peroxide/i.test(it.parameter)) {
          const v = Number(it.value);
          if (Number.isFinite(v)) pts.push({ at: c.performed_at ?? c.created_at, value: v, passed: it.passed });
        }
      }
    }
    return pts.sort((a, b) => (a.at < b.at ? -1 : 1));
  }, [checks]);
  const pvMaxSeen = pvPoints.reduce((m, p) => Math.max(m, p.value), 0);

  if (loading) return <p className="font-body text-muted-foreground">Loading QC checks…</p>;

  return (
    <div className="max-w-[880px] space-y-10">
      {/* Hemp peroxide trend */}
      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-1">Hemp peroxide value over time</h3>
        <p className="text-xs font-body text-muted-foreground mb-4">Lower is fresher. The gating ceiling is set on the material's spec.</p>
        {pvPoints.length === 0 ? (
          <p className="font-body text-muted-foreground text-sm">No peroxide values recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {pvPoints.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-muted-foreground">{fmtDateTime(p.at).split(",")[0]}</span>
                <div className="flex-1 h-4 bg-secondary relative">
                  <div className={`h-4 ${p.passed === false ? "bg-destructive" : "bg-foreground"}`} style={{ width: `${Math.min(100, (p.value / Math.max(pvMaxSeen, 1)) * 100)}%` }} />
                </div>
                <span className="w-24 shrink-0 tabular-nums font-body">{p.value} meq/kg{p.passed === false ? " ✗" : ""}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All checks */}
      <section>
        <p className="text-xs font-body text-muted-foreground mb-3 max-w-[640px]">
          Every QC check ever recorded, in one register. You run these where the work happens — <strong>incoming</strong> when releasing a raw-material lot (Materials), <strong>in-process</strong> during a blend and <strong>finished</strong> before release (both on a batch, in Batches). This tab is the read-only record of all of them, plus the hemp peroxide trend above. Each row names the batch or lot it belongs to.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-typewriter text-lg uppercase tracking-wider">QC checks</h3>
          <div className="flex gap-1">
            {(["all", "incoming", "in_process", "finished"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs font-typewriter uppercase tracking-wider border ${filter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {f.replace("_", "-")}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? <p className="font-body text-muted-foreground">No checks.</p> : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="border border-border p-3">
                <p className="text-sm font-body">
                  <span className="font-typewriter uppercase tracking-wider text-xs">{c.type.replace("_", "-")}</span>{" · "}
                  <span className="font-medium">{subjectLabels[c.subject_id] ?? (c.subject_type === "batch" ? "batch" : "raw lot")}</span>{" · "}
                  <span className={c.result === "pass" ? "text-foreground font-medium" : c.result === "fail" ? "text-destructive font-medium" : "text-muted-foreground"}>{c.result}</span>
                  {" · "}<span className="text-muted-foreground">{fmtDateTime(c.performed_at)} · {c.performed_by}</span>
                </p>
                <ul className="mt-2 space-y-0.5 text-xs font-body text-muted-foreground">
                  {(c.qc_check_items ?? []).map((it) => (
                    <li key={it.id}>{it.parameter}: {it.value || "—"}{it.gating ? " *" : ""}{it.passed == null ? "" : it.passed ? " ✓" : " ✗"}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default QCLog;
