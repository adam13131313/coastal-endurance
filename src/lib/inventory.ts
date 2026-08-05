import { sb } from "@/lib/production";

// On-hand raw material inventory, rolled up from lots. Released lots are
// usable stock; quarantined lots are incoming (not yet cleared by QC).
// Lots store g / ml; we report in kg / L. The BMR decrements qty_remaining
// as blends record consumption, so "remaining" is live.

export interface LotRow {
  id: string;
  raw_material_id: string;
  supplier: string | null;
  supplier_lot_number: string | null;
  qty_remaining: number;
  unit: string;
  best_before: string | null;
  status: string;
  received_date: string | null;
}

export interface OnHand {
  litres: number;      // from ml/L lots
  kg: number;          // from g/kg lots
  units: number;       // anything countable
  nearestBestBefore: string | null;
}

const add = (o: OnHand, qty: number, unit: string) => {
  const u = unit.toLowerCase();
  if (u === "ml") o.litres += qty / 1000;
  else if (u === "l") o.litres += qty;
  else if (u === "g") o.kg += qty / 1000;
  else if (u === "kg") o.kg += qty;
  else o.units += qty;
};

export function rollUp(lots: LotRow[]): { released: Map<string, OnHand>; incoming: Map<string, OnHand> } {
  const released = new Map<string, OnHand>();
  const incoming = new Map<string, OnHand>();
  for (const lot of lots) {
    const qty = Number(lot.qty_remaining) || 0;
    if (qty <= 0) continue;
    const target = lot.status === "released" ? released : lot.status === "quarantine" ? incoming : null;
    if (!target) continue;
    const cur = target.get(lot.raw_material_id) ?? { litres: 0, kg: 0, units: 0, nearestBestBefore: null };
    add(cur, qty, lot.unit);
    if (lot.best_before && (!cur.nearestBestBefore || lot.best_before < cur.nearestBestBefore)) {
      cur.nearestBestBefore = lot.best_before;
    }
    target.set(lot.raw_material_id, cur);
  }
  return { released, incoming };
}

export async function fetchLots(): Promise<LotRow[]> {
  const { data } = await sb
    .from("raw_material_lots")
    .select("id, raw_material_id, supplier, supplier_lot_number, qty_remaining, unit, best_before, status, received_date")
    .in("status", ["released", "quarantine"]);
  return (data as LotRow[]) ?? [];
}

// On-hand expressed in a target unit (the material's pack unit), converting
// volume <-> mass through density when the stored form differs.
export function onHandInUnit(oh: OnHand | undefined, unit: "L" | "kg", densityGMl: number | null): number {
  if (!oh) return 0;
  let total = unit === "L" ? oh.litres : oh.kg;
  const other = unit === "L" ? oh.kg : oh.litres;
  if (other > 0 && densityGMl != null && densityGMl > 0) {
    total += unit === "L" ? other / densityGMl : other * densityGMl; // kg->L or L->kg
  }
  return total;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
