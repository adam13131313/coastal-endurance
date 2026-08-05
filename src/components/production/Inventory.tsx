import { useCallback, useEffect, useState } from "react";
import { sb } from "@/lib/production";
import { fetchLots, rollUp, daysUntil, type LotRow, type OnHand } from "@/lib/inventory";

// What's physically on hand per raw material, live from lots: released =
// usable, quarantine = incoming (awaiting QC). The BMR draws lots down as
// blends record, and Batch sizing nets on-hand off the buy quantity.

interface MaterialRow { id: string; name: string; density_g_ml: number | null; pack_unit: "L" | "kg" | null; }

const fmtQty = (oh: OnHand | undefined) => {
  if (!oh) return "—";
  const parts: string[] = [];
  if (oh.litres > 0) parts.push(`${oh.litres.toFixed(2)} L`);
  if (oh.kg > 0) parts.push(`${oh.kg.toFixed(2)} kg`);
  if (oh.units > 0) parts.push(`${oh.units} units`);
  return parts.length ? parts.join(" + ") : "—";
};

const Inventory = () => {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [lots, setLots] = useState<LotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: mats }, lotRows] = await Promise.all([
      sb.from("raw_materials").select("id, name, density_g_ml, pack_unit").eq("active", true).order("name"),
      fetchLots(),
    ]);
    setMaterials((mats as MaterialRow[]) ?? []);
    setLots(lotRows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="font-body text-muted-foreground">Loading inventory…</p>;

  const { released, incoming } = rollUp(lots);
  const withStock = materials.filter((m) => released.has(m.id) || incoming.has(m.id));
  const withoutStock = materials.filter((m) => !released.has(m.id) && !incoming.has(m.id));

  return (
    <div className="space-y-8 max-w-[860px]">
      <div>
        <h3 className="font-typewriter text-lg uppercase tracking-wider">Raw material inventory</h3>
        <p className="mt-1 text-sm font-body text-muted-foreground">
          Live from lots: released stock is usable; quarantined is incoming until it clears QC (Production → Materials). Blends draw stock down automatically as batches record.
        </p>
      </div>

      <div className="border border-border divide-y divide-border">
        <div className="hidden md:grid grid-cols-[1fr_8rem_8rem_8rem] gap-3 px-3 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">
          <span>Material</span><span className="text-right">On hand</span><span className="text-right">Incoming (QC)</span><span className="text-right">Nearest BB</span>
        </div>
        {withStock.map((m) => {
          const rel = released.get(m.id);
          const inc = incoming.get(m.id);
          const bb = rel?.nearestBestBefore ?? inc?.nearestBestBefore ?? null;
          const days = daysUntil(bb);
          const materialLots = lots.filter((l) => l.raw_material_id === m.id);
          return (
            <div key={m.id}>
              <button onClick={() => setOpen(open === m.id ? null : m.id)} className="w-full text-left grid md:grid-cols-[1fr_8rem_8rem_8rem] grid-cols-2 gap-x-3 gap-y-1 px-3 py-2.5 text-sm hover:bg-secondary/60 transition-colors">
                <span className="font-body">{m.name}</span>
                <span className="font-body tabular-nums md:text-right">{fmtQty(rel)}</span>
                <span className="font-body tabular-nums md:text-right text-muted-foreground">{fmtQty(inc)}</span>
                <span className={`font-body tabular-nums md:text-right ${days != null && days < 90 ? "text-destructive" : "text-muted-foreground"}`}>
                  {bb ? `${bb}${days != null && days < 90 ? ` (${Math.max(days, 0)}d)` : ""}` : "—"}
                </span>
              </button>
              {open === m.id && (
                <div className="px-3 pb-3">
                  <div className="border border-border divide-y divide-border">
                    {materialLots.map((l) => (
                      <div key={l.id} className="grid grid-cols-[1fr_6rem_6rem_6rem] gap-3 px-3 py-1.5 text-xs font-body text-muted-foreground">
                        <span>{l.supplier ?? "—"}{l.supplier_lot_number ? ` · lot ${l.supplier_lot_number}` : " · lot no. pending"}</span>
                        <span className="text-right tabular-nums">{Number(l.qty_remaining)} {l.unit}</span>
                        <span className="text-right">{l.status}</span>
                        <span className="text-right tabular-nums">{l.best_before ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {withStock.length === 0 && (
          <p className="px-3 py-4 text-sm font-body text-muted-foreground">Nothing on hand yet. Receiving a purchase order creates lots here.</p>
        )}
      </div>

      {withoutStock.length > 0 && (
        <p className="text-xs font-body text-muted-foreground">
          No stock: {withoutStock.map((m) => m.name).join(", ")}.
        </p>
      )}
    </div>
  );
};

export default Inventory;
