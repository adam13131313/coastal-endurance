import { useCallback, useEffect, useMemo, useState } from "react";
import { sb, type Formula as FormulaT, type FormulaComponent } from "@/lib/production";

// The recipe reference: versioned % w/w formulas, read-only here. Quantities
// live in Supply → Batch sizing (which also saves immutable sizings); the BMR
// seeds gram targets itself when a batch opens. Labelling-only carriers
// (Sunflower) are never formula components, so they don't appear here.
const Formula = () => {
  const [formulas, setFormulas] = useState<FormulaT[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [components, setComponents] = useState<FormulaComponent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComponents = useCallback(async (fid: string) => {
    const { data: c } = await sb
      .from("formula_components")
      .select("*, raw_materials ( name, inci_name, role )")
      .eq("formula_id", fid)
      .order("sort_order");
    setComponents((c as FormulaComponent[]) ?? []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: fs } = await sb.from("formulas").select("*").neq("status", "archived").order("created_at", { ascending: false });
    const list = (fs as FormulaT[]) ?? [];
    setFormulas(list);
    const active = list.find((f) => f.status === "active") ?? list[0];
    if (active) {
      setSelected(active.id);
      await loadComponents(active.id);
    }
    setLoading(false);
  }, [loadComponents]);

  useEffect(() => { load(); }, [load]);

  const formula = formulas.find((f) => f.id === selected) ?? null;
  const totalPct = useMemo(() => components.reduce((s, c) => s + Number(c.percent_ww), 0), [components]);

  if (loading) return <p className="font-body text-muted-foreground">Loading formula…</p>;
  if (!formula) return <p className="font-body text-muted-foreground">No formula found.</p>;

  return (
    <div className="space-y-8 max-w-[820px]">
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-typewriter text-lg uppercase tracking-wider">{formula.name} · v{formula.version}</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-typewriter uppercase tracking-widest text-muted-foreground">
              {formula.status} · sums to {totalPct.toFixed(2)}%
            </span>
            {formulas.length > 1 && (
              <select
                value={selected ?? ""}
                onChange={async (e) => { setSelected(e.target.value); await loadComponents(e.target.value); }}
                className="text-xs font-typewriter uppercase tracking-wider px-2 py-1 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                {formulas.map((f) => <option key={f.id} value={f.id}>v{f.version} ({f.status})</option>)}
              </select>
            )}
          </div>
        </div>
        {formula.notes && <p className="mt-2 text-sm font-body text-muted-foreground">{formula.notes}</p>}
      </section>

      <section>
        <div className="border border-border divide-y divide-border">
          <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">
            <span>Ingredient</span>
            <span className="text-right w-20">% w/w</span>
          </div>
          {components.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 text-sm">
              <span className="font-body">
                {c.raw_materials?.name}
                {c.raw_materials?.inci_name && <span className="block text-[11px] text-muted-foreground">{c.raw_materials.inci_name}</span>}
                {c.raw_materials?.role && <span className="mt-0.5 inline-block text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground">{c.raw_materials.role}</span>}
              </span>
              <span className="text-right w-20 font-body tabular-nums">{Number(c.percent_ww).toFixed(2)}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 text-sm font-medium bg-secondary/50">
            <span className="font-body">Total</span>
            <span className="text-right w-20 font-body tabular-nums">{totalPct.toFixed(2)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs font-body text-muted-foreground">
          Quantities and purchasing live under Supply → Batch sizing. Sunflower is labelling-only (it carries the Vitamin E and rosemary) and is never weighed.
          Reserve ~1% of the jojoba to pre-disperse the Vitamin E and rosemary before adding the actives.
        </p>
      </section>
    </div>
  );
};

export default Formula;
