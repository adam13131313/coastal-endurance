import { useCallback, useEffect, useMemo, useState } from "react";
import { sb, gramsFor, fmtGrams, type Formula as FormulaT, type FormulaComponent } from "@/lib/production";

// Read-only view of the active % w/w formula + a batch calculator: enter a batch
// mass, get per-ingredient gram targets. Labelling-only carriers (Sunflower) are
// never formula components, so they don't appear here or get weighed.
const Formula = () => {
  const [formula, setFormula] = useState<FormulaT | null>(null);
  const [components, setComponents] = useState<FormulaComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mass, setMass] = useState("21000");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: f } = await sb.from("formulas").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    setFormula((f as FormulaT) ?? null);
    if (f) {
      const { data: c } = await sb
        .from("formula_components")
        .select("*, raw_materials ( name, inci_name, role )")
        .eq("formula_id", (f as FormulaT).id)
        .order("sort_order");
      setComponents((c as FormulaComponent[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const batchMass = Number(mass);
  const validMass = Number.isFinite(batchMass) && batchMass > 0;
  const totalPct = useMemo(() => components.reduce((s, c) => s + Number(c.percent_ww), 0), [components]);
  const theoreticalUnits = validMass ? Math.floor((batchMass / 0.9) / 30) : 0; // ~0.90 g/mL, 30 ml bottles

  if (loading) return <p className="font-body text-muted-foreground">Loading formula…</p>;
  if (!formula) return <p className="font-body text-muted-foreground">No active formula found.</p>;

  return (
    <div className="space-y-10 max-w-[820px]">
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-typewriter text-lg uppercase tracking-wider">{formula.name} · v{formula.version}</h3>
          <span className="text-xs font-typewriter uppercase tracking-widest text-muted-foreground">
            {formula.status} · sums to {totalPct.toFixed(1)}%
          </span>
        </div>
        {formula.notes && <p className="mt-2 text-sm font-body text-muted-foreground">{formula.notes}</p>}
      </section>

      {/* Batch calculator */}
      <section className="border border-border p-4">
        <label className="flex flex-wrap items-end gap-3">
          <span className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Batch mass (g)</span>
            <input
              type="number"
              value={mass}
              onChange={(e) => setMass(e.target.value)}
              className="w-40 px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </span>
          {validMass && (
            <span className="text-sm font-body text-muted-foreground pb-1">
              ≈ {theoreticalUnits.toLocaleString("en-AU")} × 30 ml theoretical (before fill losses &amp; retains)
            </span>
          )}
        </label>
      </section>

      {/* Recipe + gram targets */}
      <section>
        <div className="border border-border divide-y divide-border">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">
            <span>Ingredient</span>
            <span className="text-right w-20">% w/w</span>
            <span className="text-right w-28">Target</span>
          </div>
          {components.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 text-sm">
              <span className="font-body">
                {c.raw_materials?.name}
                {c.raw_materials?.role && <span className="ml-2 text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground">{c.raw_materials.role}</span>}
              </span>
              <span className="text-right w-20 font-body tabular-nums">{Number(c.percent_ww).toFixed(1)}</span>
              <span className="text-right w-28 font-body tabular-nums">{validMass ? fmtGrams(gramsFor(Number(c.percent_ww), batchMass)) : "—"}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 text-sm font-medium bg-secondary/50">
            <span className="font-body">Total</span>
            <span className="text-right w-20 font-body tabular-nums">{totalPct.toFixed(1)}</span>
            <span className="text-right w-28 font-body tabular-nums">{validMass ? fmtGrams(batchMass) : "—"}</span>
          </div>
        </div>
        <p className="mt-3 text-xs font-body text-muted-foreground">
          Sunflower is labelling-only (it carries the Vitamin E and rosemary) and is never weighed, so it isn't listed here.
          Reserve ~1% of the jojoba to pre-disperse the Vitamin E and rosemary before adding the actives.
        </p>
      </section>
    </div>
  );
};

export default Formula;
