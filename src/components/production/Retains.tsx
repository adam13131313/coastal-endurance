import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sb, fmtDate, type ProductionBatch, type RetainSample } from "@/lib/production";

// Retain samples: keep ≥3 sealed units per batch, out of light, for the full
// best-before period (reference standard + complaint reference + stability feed).
// Written browser-direct (admin RLS), not a state transition.
type RetainRow = RetainSample & { production_batches?: { batch_number: string } };

const Retains = () => {
  const [retains, setRetains] = useState<RetainRow[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ batchId: "", qty: "3", location: "", retainedUntil: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [r, b] = await Promise.all([
      sb.from("retain_samples").select("*, production_batches ( batch_number )").order("created_at", { ascending: false }),
      sb.from("production_batches").select("*").order("created_at", { ascending: false }),
    ]);
    setRetains((r.data as RetainRow[]) ?? []);
    setBatches((b.data as ProductionBatch[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.batchId) { toast.error("Pick a batch."); return; }
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await sb.from("retain_samples").insert({
      batch_id: form.batchId,
      qty: Number(form.qty) || 3,
      location: form.location.trim() || null,
      retained_until: form.retainedUntil || null,
      notes: form.notes.trim() || null,
    });
    void session;
    setBusy(false);
    if (error) { toast.error("Couldn't log the retain."); return; }
    toast.success("Retain logged.");
    setForm({ batchId: "", qty: "3", location: "", retainedUntil: "", notes: "" });
    load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading retains…</p>;

  return (
    <div className="max-w-[820px] space-y-10">
      <section className="border border-border p-4">
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-3">Log a retain</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Batch</span>
            <select value={form.batchId} onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
              className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground">
              <option value="">Select…</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.batch_number}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Units kept</span>
            <input type="number" value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Location</span>
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. retains shelf, cool store"
              className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Retain until</span>
            <input type="date" value={form.retainedUntil} onChange={(e) => setForm((f) => ({ ...f, retainedUntil: e.target.value }))}
              className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Notes</span>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
          <div className="sm:col-span-2">
            <button onClick={add} disabled={busy} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy ? "…" : "Log retain"}</button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-4">Retain log</h3>
        {retains.length === 0 ? <p className="font-body text-muted-foreground">No retains logged yet.</p> : (
          <div className="border border-border divide-y divide-border text-sm">
            {retains.map((r) => (
              <div key={r.id} className="p-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-body font-medium w-40 shrink-0">{r.production_batches?.batch_number ?? "—"}</span>
                <span className="text-muted-foreground w-20 shrink-0">{r.qty} units</span>
                <span className="text-muted-foreground w-44 shrink-0">{r.location || "—"}</span>
                <span className="text-muted-foreground w-36 shrink-0">until {fmtDate(r.retained_until)}</span>
                {r.notes && <span className="text-muted-foreground">{r.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Retains;
