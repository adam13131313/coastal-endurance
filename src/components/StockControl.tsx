import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Stock control: see stock per product, adjust it with a reason (audited via the
// admin_adjust_stock RPC), and apply a released production batch's yield exactly
// once. Replaces hand-editing stock_quantity in the Supabase dashboard.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface ProductRow { id: string; name: string; stock_quantity: number; active: boolean }
interface Adjustment { id: string; product_id: string; delta: number; reason: string; batch_id: string | null; stock_after: number; actor: string | null; created_at: string }
interface ReleasedBatch { id: string; batch_number: string; yield_units: number | null; released_at: string | null }

const fmt = (s: string) => new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const StockControl = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [batches, setBatches] = useState<ReleasedBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, { delta: string; reason: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [p, a, b] = await Promise.all([
      sb.from("products").select("id, name, stock_quantity, active").order("name"),
      sb.from("stock_adjustments").select("*").order("created_at", { ascending: false }).limit(30),
      sb.from("production_batches").select("id, batch_number, yield_units, released_at").eq("status", "released").order("released_at", { ascending: false }),
    ]);
    setProducts((p.data as ProductRow[]) ?? []);
    setAdjustments((a.data as Adjustment[]) ?? []);
    setBatches((b.data as ReleasedBatch[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const adjust = async (productId: string, delta: number, reason: string, batchId?: string) => {
    setBusy(productId + (batchId ?? ""));
    const { data, error } = await sb.rpc("admin_adjust_stock", {
      p_product_id: productId, p_delta: delta, p_reason: reason, p_batch_id: batchId ?? null,
    });
    setBusy(null);
    if (error) { toast.error(error.message ?? "Adjustment failed."); return; }
    toast.success(`Stock updated → ${data}.`);
    setForm((f) => ({ ...f, [productId]: { delta: "", reason: "" } }));
    load();
  };

  const manualAdjust = (p: ProductRow) => {
    const f = form[p.id] ?? { delta: "", reason: "" };
    const delta = Math.trunc(Number(f.delta));
    if (!delta) { toast.error("Enter a non-zero adjustment (e.g. -3 or 12)."); return; }
    if (!f.reason.trim()) { toast.error("Give a reason — it goes in the audit log."); return; }
    adjust(p.id, delta, f.reason.trim());
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading stock…</p>;

  const appliedBatchIds = new Set(adjustments.map((a) => a.batch_id).filter(Boolean));
  const unappliedBatches = batches.filter((b) => (b.yield_units ?? 0) > 0 && !appliedBatchIds.has(b.id));
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  return (
    <div className="max-w-[820px] space-y-10">
      <div>
        <h2 className="text-2xl font-typewriter uppercase">Stock</h2>
        <p className="mt-1 text-sm font-body text-muted-foreground">Every change is logged with a reason. The store shows out-of-stock at 0.</p>
      </div>

      {/* Current stock + manual adjust */}
      <section className="space-y-4">
        {products.map((p) => {
          const f = form[p.id] ?? { delta: "", reason: "" };
          return (
            <div key={p.id} className="border border-border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-body font-medium">{p.name}{!p.active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}</p>
                <p className={`font-typewriter text-2xl tabular-nums ${p.stock_quantity <= 10 ? "text-destructive" : ""}`}>{p.stock_quantity}<span className="text-xs text-muted-foreground ml-1.5">bottles</span></p>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="text-sm">
                  <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Adjust (+/-)</span>
                  <input type="number" value={f.delta} placeholder="-3" onChange={(e) => setForm((s) => ({ ...s, [p.id]: { ...f, delta: e.target.value } }))}
                    className="w-24 px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
                </label>
                <label className="text-sm flex-1 min-w-[200px]">
                  <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Reason</span>
                  <input value={f.reason} placeholder="e.g. damaged in transit, samples for PR" onChange={(e) => setForm((s) => ({ ...s, [p.id]: { ...f, reason: e.target.value } }))}
                    className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
                </label>
                <button onClick={() => manualAdjust(p)} disabled={busy === p.id} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === p.id ? "…" : "Apply"}</button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && <p className="font-body text-muted-foreground">No products.</p>}
      </section>

      {/* Released batches not yet applied */}
      <section>
        <h3 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground mb-3">Released batches → stock</h3>
        {unappliedBatches.length === 0 ? (
          <p className="text-sm font-body text-muted-foreground">No released batch is waiting to be added. ✓</p>
        ) : (
          <div className="space-y-2">
            {unappliedBatches.map((b) => (
              <div key={b.id} className="border border-foreground/60 p-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-sm"><span className="font-medium">{b.batch_number}</span> · {b.yield_units} bottles released</p>
                <div className="flex gap-2">
                  {products.filter((p) => p.active).map((p) => (
                    <button key={p.id} onClick={() => adjust(p.id, b.yield_units ?? 0, `Batch ${b.batch_number} yield`, b.id)} disabled={busy === p.id + b.id}
                      className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">
                      {busy === p.id + b.id ? "…" : `Add to ${p.name}`}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audit log */}
      <section>
        <h3 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground mb-3">Recent adjustments</h3>
        {adjustments.length === 0 ? <p className="text-sm font-body text-muted-foreground">None yet.</p> : (
          <div className="border border-border divide-y divide-border text-sm">
            {adjustments.map((a) => (
              <div key={a.id} className="p-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className={`w-14 shrink-0 tabular-nums font-medium ${a.delta < 0 ? "text-destructive" : ""}`}>{a.delta > 0 ? `+${a.delta}` : a.delta}</span>
                <span className="flex-1 min-w-[160px] font-body">{a.reason}</span>
                <span className="text-muted-foreground">→ {a.stock_after}</span>
                <span className="text-muted-foreground w-40 shrink-0">{productsById[a.product_id]?.name ?? ""} · {fmt(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StockControl;
