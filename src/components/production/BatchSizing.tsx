import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/production";
import {
  computeBatch, validateBatch, buildSnapshots,
  type IngredientInput, type ComponentInput, type BatchResults, type ValidationFlag,
} from "@/lib/batchCalc";

// Batch Volume Calculator: bottles in, purchasable quantities out, with an
// immutable saved snapshot per sizing. The master formula stays editable;
// saved batches never change (only actuals + archive). Scratch edits here do
// NOT write back to the formula or materials unless explicitly committed.

interface MaterialRow {
  id: string; name: string; inci_name: string | null; default_supplier: string | null;
  supplier_locked: boolean; is_au_grown: boolean; density_g_ml: number | null;
  density_source: "book" | "coa"; min_pct: number | null; max_pct: number | null;
  pack_size: number | null; pack_unit: "L" | "kg" | null; min_order_packs: number | null;
}
interface FormulaRow { id: string; name: string; version: string; status: string; notes: string | null; }
interface PackagingRow {
  id: string; sort_order: number; name: string; supplier: string | null; supplier_locked: boolean;
  units_per_bottle: number; pack_size: number | null; min_order_packs: number | null;
}
interface SavedBatch {
  id: string; batch_ref: string; label: string; bottles: number; target_fill_ml: number;
  process_loss_pct: number; ordering_buffer_pct: number;
  formula_snapshot: IngredientInput[]; components_snapshot: ComponentInput[]; results_snapshot: BatchResults;
  batch_volume_ml: number | null; batch_mass_g: number | null; au_grown_pct: number | null;
  actual_bottles_filled: number | null; actual_batch_volume_ml: number | null; actual_notes: string | null;
  formula_version_label: string | null; notes: string | null; created_at: string; archived_at: string | null;
}

// Scratch rows keep numeric fields as strings so typing never fights the caret.
interface IngRow {
  materialId: string; name: string; inci: string | null; supplier: string | null; supplierLocked: boolean;
  isAuGrown: boolean; densitySource: "book" | "coa"; minPct: number | null; maxPct: number | null;
  pct: string; density: string; packSize: string; packUnit: "" | "L" | "kg"; minOrderPacks: string;
}
interface CompRow {
  id: string; name: string; supplier: string | null; supplierLocked: boolean;
  unitsPerBottle: string; packSize: string; minOrderPacks: string;
}

const num = (s: string): number | null => {
  const v = Number(s);
  return s.trim() !== "" && Number.isFinite(v) ? v : null;
};

const toIngredients = (rows: IngRow[]): IngredientInput[] =>
  rows.map((r) => ({
    name: r.name, inciName: r.inci, supplier: r.supplier, supplierLocked: r.supplierLocked,
    pctWw: num(r.pct) ?? 0, densityGMl: num(r.density), densitySource: r.densitySource,
    isAuGrown: r.isAuGrown, minPct: r.minPct, maxPct: r.maxPct,
    packSize: num(r.packSize), packUnit: r.packUnit === "" ? null : r.packUnit,
    minOrderPacks: num(r.minOrderPacks) != null ? Math.round(num(r.minOrderPacks) as number) : null,
  }));

const toComponents = (rows: CompRow[]): ComponentInput[] =>
  rows.map((r) => ({
    name: r.name, supplier: r.supplier, supplierLocked: r.supplierLocked,
    unitsPerBottle: num(r.unitsPerBottle) ?? 0,
    packSize: num(r.packSize) != null ? Math.round(num(r.packSize) as number) : null,
    minOrderPacks: num(r.minOrderPacks) != null ? Math.round(num(r.minOrderPacks) as number) : null,
  }));

const fmt = (v: number | null | undefined, dp = 1) => (v == null || !Number.isFinite(v) ? "—" : v.toFixed(dp));
const fmtKgL = (v: number | null | undefined, unit: string | null) =>
  v == null ? "—" : `${v.toFixed(3)} ${unit ?? ""}`.trim();
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

// Plain-text order sheet grouped by supplier, carrying its own caveats.
function orderSheet(results: BatchResults, flags: ValidationFlag[], ref: string | null, label: string | null, formulaLabel: string | null): string {
  const lines: string[] = [];
  lines.push(`COASTAL ENDURANCE — BATCH ORDER SHEET`);
  lines.push(`${ref ? ref + " · " : ""}${label ?? "Unsaved calculation"}${formulaLabel ? " · formula " + formulaLabel : ""}`);
  lines.push(`${results.inputs.bottles} bottles × ${results.inputs.targetFillMl} ml · batch ${(results.batchVolumeMl / 1000).toFixed(2)} L / ${(results.batchMassG / 1000).toFixed(2)} kg · AU-grown ${results.auGrownPct.toFixed(1)}% by weight`);
  lines.push("");

  const bySupplier = new Map<string, string[]>();
  const add = (supplier: string | null, line: string) => {
    const key = supplier?.trim() || "SUPPLIER UNCONFIRMED";
    if (!bySupplier.has(key)) bySupplier.set(key, []);
    (bySupplier.get(key) as string[]).push(line);
  };
  for (const i of results.ingredients) {
    const req = i.packUnit
      ? `${fmtKgL(i.requiredInPackUnit, i.packUnit)} required`
      : `${(i.orderMassG / 1000).toFixed(3)} kg required (pack size unknown)`;
    const packs = i.packs != null
      ? ` → ${i.packs} × ${i.packSize} ${i.packUnit} = ${fmtKgL(i.purchasedInPackUnit, i.packUnit)} (surplus ${fmtKgL(i.surplusInPackUnit, i.packUnit)})`
      : "";
    add(i.supplier, `- ${i.name} (${i.pctWw}% w/w): ${req}${packs}`);
  }
  for (const c of results.components) {
    const packs = c.packs != null
      ? ` → ${c.packs} × ${c.packSize} = ${c.purchasedUnits} units (surplus ${c.surplusUnits})`
      : " (pack size unknown)";
    add(c.supplier, `- ${c.name}: ${c.requiredUnits} units required${packs}`);
  }
  for (const [supplier, items] of bySupplier) {
    lines.push(supplier.toUpperCase());
    lines.push(...items, "");
  }

  lines.push("CAVEATS");
  for (const f of flags.filter((f) => f.level !== "ok")) lines.push(`- [${f.level.toUpperCase()}] ${f.message}`);
  return lines.join("\n");
}

function orderCsv(results: BatchResults, flags: ValidationFlag[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows: string[] = [];
  for (const f of flags.filter((f) => f.level !== "ok")) rows.push(`# ${f.level.toUpperCase()}: ${f.message.replace(/\n/g, " ")}`);
  rows.push(["type", "name", "supplier", "pct_ww", "mass_g", "volume_ml", "required", "pack_size", "pack_unit", "packs", "purchased", "surplus"].join(","));
  for (const i of results.ingredients) {
    rows.push(["ingredient", i.name, i.supplier, i.pctWw, i.massG, i.volumeMl, i.requiredInPackUnit, i.packSize, i.packUnit, i.packs, i.purchasedInPackUnit, i.surplusInPackUnit].map(esc).join(","));
  }
  for (const c of results.components) {
    rows.push(["component", c.name, c.supplier, "", "", "", c.requiredUnits, c.packSize, "units", c.packs, c.purchasedUnits, c.surplusUnits].map(esc).join(","));
  }
  return rows.join("\n");
}

const inputCls = "px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground tabular-nums";
const cellInput = "w-full px-1.5 py-1 border border-border bg-background text-xs rounded-none focus:outline-none focus:ring-1 focus:ring-foreground tabular-nums text-right";

const BatchSizing = () => {
  const [formulas, setFormulas] = useState<FormulaRow[]>([]);
  const [formulaId, setFormulaId] = useState<string | null>(null);
  const [ingRows, setIngRows] = useState<IngRow[]>([]);
  const [compRows, setCompRows] = useState<CompRow[]>([]);
  const [saved, setSaved] = useState<SavedBatch[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [viewing, setViewing] = useState<SavedBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [bottles, setBottles] = useState("700");
  const [fill, setFill] = useState("30.0");
  const [loss, setLoss] = useState("8");
  const [buffer, setBuffer] = useState("10");

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [actualsFor, setActualsFor] = useState<SavedBatch | null>(null);
  const [aBottles, setABottles] = useState("");
  const [aVolume, setAVolume] = useState("");
  const [aNotes, setANotes] = useState("");

  const loadFormula = useCallback(async (fid: string) => {
    const { data } = await sb
      .from("formula_components")
      .select("percent_ww, sort_order, raw_materials ( id, name, inci_name, default_supplier, supplier_locked, is_au_grown, density_g_ml, density_source, min_pct, max_pct, pack_size, pack_unit, min_order_packs )")
      .eq("formula_id", fid)
      .order("sort_order");
    const rows: IngRow[] = ((data as { percent_ww: number; raw_materials: MaterialRow }[]) ?? []).map((c) => ({
      materialId: c.raw_materials.id,
      name: c.raw_materials.name,
      inci: c.raw_materials.inci_name,
      supplier: c.raw_materials.default_supplier,
      supplierLocked: c.raw_materials.supplier_locked,
      isAuGrown: c.raw_materials.is_au_grown,
      densitySource: c.raw_materials.density_source,
      minPct: c.raw_materials.min_pct != null ? Number(c.raw_materials.min_pct) : null,
      maxPct: c.raw_materials.max_pct != null ? Number(c.raw_materials.max_pct) : null,
      pct: String(Number(c.percent_ww)),
      density: c.raw_materials.density_g_ml != null ? String(Number(c.raw_materials.density_g_ml)) : "",
      packSize: c.raw_materials.pack_size != null ? String(Number(c.raw_materials.pack_size)) : "",
      packUnit: (c.raw_materials.pack_unit as "L" | "kg" | null) ?? "",
      minOrderPacks: c.raw_materials.min_order_packs != null ? String(c.raw_materials.min_order_packs) : "",
    }));
    setIngRows(rows);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: fs }, { data: pcs }, { data: bs }] = await Promise.all([
      sb.from("formulas").select("id, name, version, status, notes").neq("status", "archived").order("created_at", { ascending: false }),
      sb.from("packaging_components").select("*").eq("active", true).order("sort_order"),
      sb.from("batch_calculations").select("*").order("created_at", { ascending: false }),
    ]);
    const formulaList = (fs as FormulaRow[]) ?? [];
    setFormulas(formulaList);
    setCompRows(((pcs as PackagingRow[]) ?? []).map((p) => ({
      id: p.id, name: p.name, supplier: p.supplier, supplierLocked: p.supplier_locked,
      unitsPerBottle: String(Number(p.units_per_bottle)),
      packSize: p.pack_size != null ? String(p.pack_size) : "",
      minOrderPacks: p.min_order_packs != null ? String(p.min_order_packs) : "",
    })));
    setSaved((bs as SavedBatch[]) ?? []);
    const initial = formulaList[0]?.id ?? null;
    setFormulaId(initial);
    if (initial) await loadFormula(initial);
    setLoading(false);
  }, [loadFormula]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const selectedFormula = formulas.find((f) => f.id === formulaId) ?? null;
  const formulaLabel = selectedFormula ? `${selectedFormula.name} v${selectedFormula.version}` : null;

  const ingredients = useMemo(() => toIngredients(ingRows), [ingRows]);
  const components = useMemo(() => toComponents(compRows), [compRows]);
  const results = useMemo(
    () => computeBatch(
      { bottles: num(bottles) ?? 0, targetFillMl: num(fill) ?? 0, processLossPct: num(loss) ?? 0, orderingBufferPct: num(buffer) ?? 0 },
      ingredients, components,
    ),
    [bottles, fill, loss, buffer, ingredients, components],
  );
  const flags = useMemo(() => validateBatch(results), [results]);

  const setIng = (idx: number, patch: Partial<IngRow>) =>
    setIngRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const setComp = (idx: number, patch: Partial<CompRow>) =>
    setCompRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const normalise = () => {
    const sum = ingRows.reduce((s, r) => s + (num(r.pct) ?? 0), 0);
    if (sum <= 0) { toast.error("Nothing to normalise."); return; }
    setIngRows((rows) => rows.map((r) => ({ ...r, pct: String(Number((((num(r.pct) ?? 0) / sum) * 100).toFixed(4))) })));
    toast.success("Normalised to 100%.");
  };

  const savePctToFormula = async () => {
    if (!formulaId) return;
    if (!confirm(`Write these percentages back to ${formulaLabel}? This changes the master formula.`)) return;
    setBusy("savepct");
    for (const r of ingRows) {
      await sb.from("formula_components").update({ percent_ww: num(r.pct) ?? 0 })
        .eq("formula_id", formulaId).eq("raw_material_id", r.materialId);
    }
    setBusy(null);
    toast.success("Formula updated.");
  };

  const commitDensity = async (r: IngRow) => {
    const d = num(r.density);
    if (d == null || d <= 0) { toast.error("Enter a positive density first."); return; }
    if (!confirm(`Record ${d} g/ml as the certificate-of-analysis density for ${r.name}?`)) return;
    setBusy(r.materialId);
    const { error } = await sb.from("raw_materials")
      .update({ density_g_ml: d, density_source: "coa", density_verified_at: new Date().toISOString() })
      .eq("id", r.materialId);
    setBusy(null);
    if (error) { toast.error("Couldn't save the density."); return; }
    setIng(ingRows.indexOf(r), { densitySource: "coa" });
    toast.success(`${r.name}: density recorded from CoA.`);
  };

  const savePackInfo = async () => {
    if (!confirm("Save pack sizes, MOQs and supplier-lock state back to the master materials and packaging records?")) return;
    setBusy("savepack");
    for (const r of ingRows) {
      await sb.from("raw_materials").update({
        pack_size: num(r.packSize), pack_unit: r.packUnit === "" ? null : r.packUnit,
        min_order_packs: num(r.minOrderPacks) != null ? Math.round(num(r.minOrderPacks) as number) : null,
        supplier_locked: r.supplierLocked,
      }).eq("id", r.materialId);
    }
    for (const c of compRows) {
      await sb.from("packaging_components").update({
        pack_size: num(c.packSize) != null ? Math.round(num(c.packSize) as number) : null,
        min_order_packs: num(c.minOrderPacks) != null ? Math.round(num(c.minOrderPacks) as number) : null,
        units_per_bottle: num(c.unitsPerBottle) ?? 1,
        supplier_locked: c.supplierLocked,
      }).eq("id", c.id);
    }
    setBusy(null);
    toast.success("Pack info saved to master records.");
  };

  const saveBatch = async () => {
    if (!saveLabel.trim()) { toast.error("Give the batch a label."); return; }
    setBusy("save");
    const snaps = buildSnapshots(ingredients, components, results);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await sb.from("batch_calculations").insert({
      label: saveLabel.trim(),
      notes: saveNotes.trim() || null,
      bottles: results.inputs.bottles,
      target_fill_ml: results.inputs.targetFillMl,
      process_loss_pct: results.inputs.processLossPct,
      ordering_buffer_pct: results.inputs.orderingBufferPct,
      ...snaps,
      batch_volume_ml: results.batchVolumeMl,
      batch_mass_g: results.batchMassG,
      blend_density_g_ml: results.blendDensityGMl,
      au_grown_pct: results.auGrownPct,
      source_formula_id: formulaId,
      formula_version_label: formulaLabel,
      created_by: userData?.user?.id ?? null,
    }).select("*").single();
    setBusy(null);
    if (error || !data) { toast.error("Couldn't save the batch."); return; }
    toast.success(`Saved as ${(data as SavedBatch).batch_ref}.`);
    setSaveOpen(false); setSaveLabel(""); setSaveNotes("");
    setSaved((s) => [data as SavedBatch, ...s]);
  };

  const recordActuals = async () => {
    if (!actualsFor) return;
    setBusy("actuals");
    const { error } = await sb.from("batch_calculations").update({
      actual_bottles_filled: num(aBottles) != null ? Math.round(num(aBottles) as number) : null,
      actual_batch_volume_ml: num(aVolume),
      actual_notes: aNotes.trim() || null,
    }).eq("id", actualsFor.id);
    setBusy(null);
    if (error) { toast.error("Couldn't record actuals."); return; }
    toast.success("Actuals recorded.");
    setActualsFor(null); setABottles(""); setAVolume(""); setANotes("");
    const { data } = await sb.from("batch_calculations").select("*").order("created_at", { ascending: false });
    const list = (data as SavedBatch[]) ?? [];
    setSaved(list);
    setViewing((v) => (v ? list.find((b) => b.id === v.id) ?? null : null));
  };

  const archive = async (b: SavedBatch, unarchive = false) => {
    if (!unarchive && !confirm(`Archive ${b.batch_ref}? It stays on record, hidden from the default list.`)) return;
    await sb.from("batch_calculations").update({ archived_at: unarchive ? null : new Date().toISOString() }).eq("id", b.id);
    const { data } = await sb.from("batch_calculations").select("*").order("created_at", { ascending: false });
    setSaved((data as SavedBatch[]) ?? []);
    setViewing(null);
    toast.success(unarchive ? "Unarchived." : "Archived.");
  };

  const duplicateIntoCalculator = (b: SavedBatch) => {
    setBottles(String(b.bottles)); setFill(String(Number(b.target_fill_ml)));
    setLoss(String(Number(b.process_loss_pct))); setBuffer(String(Number(b.ordering_buffer_pct)));
    setIngRows(b.formula_snapshot.map((i) => ({
      materialId: "", name: i.name, inci: i.inciName, supplier: i.supplier, supplierLocked: i.supplierLocked,
      isAuGrown: i.isAuGrown, densitySource: i.densitySource, minPct: i.minPct, maxPct: i.maxPct,
      pct: String(i.pctWw), density: i.densityGMl != null ? String(i.densityGMl) : "",
      packSize: i.packSize != null ? String(i.packSize) : "", packUnit: i.packUnit ?? "",
      minOrderPacks: i.minOrderPacks != null ? String(i.minOrderPacks) : "",
    })));
    setCompRows(b.components_snapshot.map((c, idx) => ({
      id: `snap-${idx}`, name: c.name, supplier: c.supplier, supplierLocked: c.supplierLocked,
      unitsPerBottle: String(c.unitsPerBottle),
      packSize: c.packSize != null ? String(c.packSize) : "",
      minOrderPacks: c.minOrderPacks != null ? String(c.minOrderPacks) : "",
    })));
    setViewing(null);
    toast.success(`${b.batch_ref} loaded into the calculator as a new draft. Note: master-data commits are disabled for duplicated rows.`);
  };

  const copySheet = (r: BatchResults, f: ValidationFlag[], ref: string | null, label: string | null, fl: string | null) => {
    navigator.clipboard.writeText(orderSheet(r, f, ref, label, fl))
      .then(() => toast.success("Order sheet copied."))
      .catch(() => toast.error("Couldn't copy."));
  };

  const downloadCsv = (r: BatchResults, f: ValidationFlag[], name: string) => {
    const blob = new Blob([orderCsv(r, f)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading batch sizing…</p>;

  // ------------------------------------------------------------------ saved detail
  if (viewing) {
    const r = viewing.results_snapshot;
    const vFlags = validateBatch(r);
    const impliedLoss =
      viewing.actual_bottles_filled != null && viewing.actual_batch_volume_ml != null && viewing.actual_batch_volume_ml > 0
        ? (1 - (viewing.actual_bottles_filled * Number(viewing.target_fill_ml)) / Number(viewing.actual_batch_volume_ml)) * 100
        : null;
    return (
      <div className="space-y-6 max-w-[900px]">
        <div className="border-2 border-foreground p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-typewriter text-sm uppercase tracking-widest">
              <span className="bg-foreground text-background px-2 py-0.5 mr-2">Saved record</span>
              {viewing.batch_ref} · {viewing.label}
              {viewing.archived_at && <span className="ml-2 text-muted-foreground">(archived)</span>}
            </p>
            <button onClick={() => setViewing(null)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">← Back</button>
          </div>
          <p className="mt-2 text-xs font-body text-muted-foreground">
            Immutable snapshot saved {fmtDate(viewing.created_at)}{viewing.formula_version_label ? ` from ${viewing.formula_version_label}` : ""}. Later formula edits do not touch this record.
          </p>
          {viewing.notes && <p className="mt-1 text-sm font-body text-muted-foreground">{viewing.notes}</p>}

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <Stat label="Bottles" value={String(viewing.bottles)} />
            <Stat label="Batch volume" value={`${(r.batchVolumeMl / 1000).toFixed(2)} L`} />
            <Stat label="Batch mass" value={`${(r.batchMassG / 1000).toFixed(2)} kg`} />
            <Stat label="Blend density" value={`${r.blendDensityGMl.toFixed(4)} g/ml`} />
            <Stat label="AU-grown" value={`${r.auGrownPct.toFixed(1)}%`} />
          </div>

          {(viewing.actual_bottles_filled != null || viewing.actual_batch_volume_ml != null) && (
            <div className="mt-4 border-t border-border pt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Actual bottles" value={viewing.actual_bottles_filled != null ? `${viewing.actual_bottles_filled} (plan ${viewing.bottles})` : "—"} />
              <Stat label="Actual volume" value={viewing.actual_batch_volume_ml != null ? `${(Number(viewing.actual_batch_volume_ml) / 1000).toFixed(2)} L` : "—"} />
              <Stat label="Implied real loss" value={impliedLoss != null ? `${impliedLoss.toFixed(1)}% (assumed ${Number(viewing.process_loss_pct)}%)` : "—"} />
              <Stat label="Actual notes" value={viewing.actual_notes ?? "—"} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => duplicateIntoCalculator(viewing)} className="btn-outline text-xs px-3 py-1.5">Duplicate into calculator</button>
            <button onClick={() => { setActualsFor(viewing); setABottles(viewing.actual_bottles_filled != null ? String(viewing.actual_bottles_filled) : ""); setAVolume(viewing.actual_batch_volume_ml != null ? String(Number(viewing.actual_batch_volume_ml)) : ""); setANotes(viewing.actual_notes ?? ""); }} className="btn-outline text-xs px-3 py-1.5">Record actuals</button>
            <button onClick={() => copySheet(r, vFlags, viewing.batch_ref, viewing.label, viewing.formula_version_label)} className="btn-outline text-xs px-3 py-1.5">Copy order sheet</button>
            <button onClick={() => downloadCsv(r, vFlags, viewing.batch_ref)} className="btn-outline text-xs px-3 py-1.5">CSV</button>
            {viewing.archived_at
              ? <button onClick={() => archive(viewing, true)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground px-2">Unarchive</button>
              : <button onClick={() => archive(viewing)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground px-2">Archive</button>}
          </div>
        </div>

        <ResultTables results={r} readonly />
        <FlagPanel flags={vFlags} />

        {actualsFor && (
          <ActualsModal
            batch={actualsFor} aBottles={aBottles} aVolume={aVolume} aNotes={aNotes}
            setABottles={setABottles} setAVolume={setAVolume} setANotes={setANotes}
            onSave={recordActuals} onClose={() => setActualsFor(null)} busy={busy === "actuals"}
          />
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ calculator
  const duplicatedRows = ingRows.some((r) => r.materialId === "");
  return (
    <div className="space-y-8 max-w-[980px]">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-typewriter text-lg uppercase tracking-wider">Batch sizing</h3>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Bottles in, purchasable quantities out. Edits here are scratch: nothing writes back to the formula or materials unless you explicitly save it.
            </p>
          </div>
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Formula version</span>
            <select
              value={formulaId ?? ""}
              onChange={async (e) => { setFormulaId(e.target.value); await loadFormula(e.target.value); }}
              className={inputCls}
            >
              {formulas.map((f) => <option key={f.id} value={f.id}>{f.name} v{f.version} ({f.status})</option>)}
            </select>
          </label>
        </div>
        {selectedFormula?.status === "draft" && (
          <p className="mt-3 border border-foreground bg-secondary px-3 py-2 text-xs font-typewriter uppercase tracking-wider">
            Draft formula: percentages are provisional pending the locked batch worksheet.
          </p>
        )}
      </div>

      {/* Inputs */}
      <div className="border border-border p-4 flex flex-wrap gap-4">
        <Field label="Bottles" value={bottles} onChange={setBottles} w="w-28" />
        <Field label="Target fill (ml)" value={fill} onChange={setFill} w="w-28" />
        <Field label="Process loss %" value={loss} onChange={setLoss} w="w-28" />
        <Field label="Ordering buffer %" value={buffer} onChange={setBuffer} w="w-32" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Filled volume" value={`${(results.filledVolumeMl / 1000).toFixed(2)} L`} />
        <Stat label="Batch to make" value={`${(results.batchVolumeMl / 1000).toFixed(2)} L`} />
        <Stat label="Batch mass" value={`${(results.batchMassG / 1000).toFixed(2)} kg`} />
        <Stat label="Blend density" value={`${results.blendDensityGMl.toFixed(4)} g/ml`} />
        <Stat label="AU-grown by wt" value={`${results.auGrownPct.toFixed(1)}%`} />
      </div>

      <ResultTables
        results={results}
        ingRows={ingRows}
        compRows={compRows}
        onIng={setIng}
        onComp={setComp}
        onCommitDensity={duplicatedRows ? undefined : commitDensity}
        busy={busy}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={normalise} className="btn-outline text-xs px-3 py-1.5">Normalise to 100%</button>
        <button onClick={() => setSaveOpen(true)} className="btn-primary text-xs px-4 py-2">Save batch</button>
        <button onClick={() => copySheet(results, flags, null, null, formulaLabel)} className="btn-outline text-xs px-3 py-1.5">Copy order sheet</button>
        <button onClick={() => downloadCsv(results, flags, "batch-order-sheet")} className="btn-outline text-xs px-3 py-1.5">CSV</button>
        <button onClick={loadAll} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground px-2">Reset</button>
        <span className="flex-1" />
        {!duplicatedRows && (
          <>
            <button onClick={savePctToFormula} disabled={busy === "savepct"} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">{busy === "savepct" ? "…" : "Save % to formula"}</button>
            <button onClick={savePackInfo} disabled={busy === "savepack"} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">{busy === "savepack" ? "…" : "Save pack info to masters"}</button>
          </>
        )}
      </div>

      <FlagPanel flags={flags} />

      {/* Saved batches */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h4 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground">Saved batches</h4>
          <label className="text-xs font-body text-muted-foreground flex items-center gap-1.5">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
        </div>
        <div className="border border-border divide-y divide-border">
          <div className="hidden md:grid grid-cols-[7rem_1fr_5rem_6rem_5rem_6rem_5rem] gap-3 px-3 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">
            <span>Ref</span><span>Label</span><span className="text-right">Bottles</span><span className="text-right">Volume</span><span className="text-right">AU %</span><span>Date</span><span>Actuals</span>
          </div>
          {saved.filter((b) => showArchived || !b.archived_at).map((b) => (
            <button key={b.id} onClick={() => setViewing(b)} className="w-full text-left grid md:grid-cols-[7rem_1fr_5rem_6rem_5rem_6rem_5rem] grid-cols-2 gap-x-3 gap-y-1 px-3 py-2.5 text-sm hover:bg-secondary/60 transition-colors">
              <span className="font-typewriter text-xs pt-0.5">{b.batch_ref}{b.archived_at ? " ⌀" : ""}</span>
              <span className="font-body truncate">{b.label}</span>
              <span className="font-body tabular-nums md:text-right">{b.bottles}</span>
              <span className="font-body tabular-nums md:text-right">{b.batch_volume_ml != null ? `${(Number(b.batch_volume_ml) / 1000).toFixed(2)} L` : "—"}</span>
              <span className="font-body tabular-nums md:text-right">{b.au_grown_pct != null ? `${Number(b.au_grown_pct).toFixed(1)}` : "—"}</span>
              <span className="font-body text-muted-foreground text-xs pt-0.5">{fmtDate(b.created_at)}</span>
              <span className="font-body text-xs pt-0.5">{b.actual_bottles_filled != null ? "recorded" : "—"}</span>
            </button>
          ))}
          {saved.filter((b) => showArchived || !b.archived_at).length === 0 && (
            <p className="px-3 py-4 text-sm font-body text-muted-foreground">No saved batches yet. Size one above and hit Save batch.</p>
          )}
        </div>
      </section>

      {/* Save modal */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSaveOpen(false)}>
          <div className="bg-background border border-border p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-typewriter text-sm uppercase tracking-widest">Save batch</h4>
            <p className="text-xs font-body text-muted-foreground">
              Stores an immutable snapshot of the formula, packaging and results as they stand. A sequential reference is assigned on save.
            </p>
            <label className="block text-sm">
              <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Label (required)</span>
              <input value={saveLabel} onChange={(e) => setSaveLabel(e.target.value)} className={`${inputCls} w-full`} placeholder="e.g. 700-bottle launch scenario" />
            </label>
            <label className="block text-sm">
              <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Notes</span>
              <textarea value={saveNotes} onChange={(e) => setSaveNotes(e.target.value)} rows={3} className={`${inputCls} w-full`} />
            </label>
            <div className="flex gap-2">
              <button onClick={saveBatch} disabled={busy === "save"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "save" ? "…" : "Save"}</button>
              <button onClick={() => setSaveOpen(false)} className="text-xs font-body text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
const Field = ({ label, value, onChange, w }: { label: string; value: string; onChange: (v: string) => void; w: string }) => (
  <label className="text-sm">
    <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className={`${w} ${inputCls}`} />
  </label>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-border px-3 py-2">
    <p className="font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-0.5 font-body text-sm font-medium tabular-nums break-words">{value}</p>
  </div>
);

const FlagPanel = ({ flags }: { flags: ValidationFlag[] }) => (
  <section className="border border-border">
    <p className="px-3 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Checks</p>
    <ul className="divide-y divide-border">
      {flags.map((f, i) => (
        <li key={i} className="px-3 py-2 text-sm font-body flex gap-2">
          <span className={`font-typewriter text-[10px] uppercase tracking-widest pt-0.5 shrink-0 ${
            f.level === "warn" ? "text-destructive" : f.level === "ok" ? "text-muted-foreground" : "text-muted-foreground"}`}>
            {f.level === "warn" ? "⚠ warn" : f.level}
          </span>
          <span className={f.level === "warn" ? "text-foreground" : "text-muted-foreground"}>{f.message}</span>
        </li>
      ))}
    </ul>
  </section>
);

// Ingredient + component tables. In edit mode, % / density / pack cells are
// live inputs; in readonly (saved detail) mode everything renders as text.
const ResultTables = ({
  results, ingRows, compRows, onIng, onComp, onCommitDensity, busy, readonly = false,
}: {
  results: BatchResults;
  ingRows?: IngRow[];
  compRows?: CompRow[];
  onIng?: (i: number, p: Partial<IngRow>) => void;
  onComp?: (i: number, p: Partial<CompRow>) => void;
  onCommitDensity?: (r: IngRow) => void;
  busy?: string | null;
  readonly?: boolean;
}) => (
  <div className="space-y-6">
    <section className="border border-border overflow-x-auto">
      <p className="px-3 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Ingredients</p>
      <table className="w-full text-xs min-w-[860px]">
        <thead>
          <tr className="text-left font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="px-3 py-2 font-normal">Ingredient</th>
            <th className="px-2 py-2 font-normal text-right">% w/w</th>
            <th className="px-2 py-2 font-normal text-right">Density g/ml</th>
            <th className="px-2 py-2 font-normal text-right">Mass g</th>
            <th className="px-2 py-2 font-normal text-right">Vol ml</th>
            <th className="px-2 py-2 font-normal text-right">Required</th>
            <th className="px-2 py-2 font-normal text-right">Pack</th>
            <th className="px-2 py-2 font-normal text-right">Packs</th>
            <th className="px-2 py-2 font-normal text-right">Purchased</th>
            <th className="px-2 py-2 font-normal text-right">Surplus</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {results.ingredients.map((line, i) => {
            const row = ingRows?.[i];
            return (
              <tr key={row ? `${row.materialId}-${row.name}` : line.name}>
                <td className="px-3 py-2 font-body">
                  <span className="font-medium text-sm">{line.name}</span>
                  {!line.supplierLocked && <span className="ml-1.5 text-[9px] font-typewriter uppercase tracking-widest border border-border px-1 text-muted-foreground">supplier tbc</span>}
                  <span className="block text-[10px] text-muted-foreground">{line.supplier ?? "supplier unconfirmed"}{line.isAuGrown ? " · AU" : ""}</span>
                </td>
                <td className="px-2 py-2 text-right w-20">
                  {readonly || !row || !onIng
                    ? <span className="tabular-nums">{line.pctWw}</span>
                    : <input value={row.pct} inputMode="decimal" onChange={(e) => onIng(i, { pct: e.target.value })} className={cellInput} />}
                </td>
                <td className="px-2 py-2 text-right w-28">
                  <div className="flex items-center justify-end gap-1">
                    {readonly || !row || !onIng
                      ? <span className="tabular-nums">{line.densityGMl ?? "—"}</span>
                      : <input value={row.density} inputMode="decimal" onChange={(e) => onIng(i, { density: e.target.value })} className={`${cellInput} w-16`} />}
                    <span
                      title={line.densitySource === "book" ? "Book value, certificate outstanding" : "From certificate of analysis"}
                      className={`text-[9px] font-typewriter uppercase ${line.densitySource === "book" ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {line.densitySource}
                    </span>
                    {!readonly && row && onCommitDensity && line.densitySource === "book" && (
                      <button onClick={() => onCommitDensity(row)} disabled={busy === row.materialId} title="Record this density as the CoA value" className="text-[9px] font-typewriter uppercase tracking-wider border border-border px-1 hover:bg-foreground hover:text-background disabled:opacity-50">CoA</button>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(line.massG, 1)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{line.volumeMl != null ? fmt(line.volumeMl, 1) : "—"}</td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {line.requiredInPackUnit != null
                    ? fmtKgL(line.requiredInPackUnit, line.packUnit)
                    : `${(line.orderMassG / 1000).toFixed(3)} kg`}
                  {line.packs == null && <span className="block text-[9px] text-muted-foreground">pack size unknown</span>}
                </td>
                <td className="px-2 py-2 text-right w-32">
                  {readonly || !row || !onIng ? (
                    <span className="tabular-nums">{line.packSize != null ? `${line.packSize} ${line.packUnit ?? ""}` : "—"}</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <input value={row.packSize} inputMode="decimal" onChange={(e) => onIng(i, { packSize: e.target.value })} className={`${cellInput} w-14`} placeholder="size" />
                      <select value={row.packUnit} onChange={(e) => onIng(i, { packUnit: e.target.value as "" | "L" | "kg" })} className="border border-border bg-background text-[10px] rounded-none px-0.5 py-1">
                        <option value="">—</option><option value="L">L</option><option value="kg">kg</option>
                      </select>
                      <input value={row.minOrderPacks} inputMode="numeric" onChange={(e) => onIng(i, { minOrderPacks: e.target.value })} className={`${cellInput} w-10`} placeholder="moq" title="Minimum order (packs)" />
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{line.packs ?? "—"}</td>
                <td className="px-2 py-2 text-right tabular-nums">{line.purchasedInPackUnit != null ? fmtKgL(line.purchasedInPackUnit, line.packUnit) : "—"}</td>
                <td className={`px-2 py-2 text-right tabular-nums ${line.surplusPct != null && line.surplusPct > 50 ? "text-destructive font-medium" : ""}`}>
                  {line.surplusInPackUnit != null ? `${fmtKgL(line.surplusInPackUnit, line.packUnit)} (${fmt(line.surplusPct, 0)}%)` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>

    <section className="border border-border overflow-x-auto">
      <p className="px-3 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Packaging components</p>
      <table className="w-full text-xs min-w-[680px]">
        <thead>
          <tr className="text-left font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="px-3 py-2 font-normal">Component</th>
            <th className="px-2 py-2 font-normal text-right">Units / bottle</th>
            <th className="px-2 py-2 font-normal text-right">Required</th>
            <th className="px-2 py-2 font-normal text-right">Pack</th>
            <th className="px-2 py-2 font-normal text-right">Packs</th>
            <th className="px-2 py-2 font-normal text-right">Purchased</th>
            <th className="px-2 py-2 font-normal text-right">Surplus</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {results.components.map((line, i) => {
            const row = compRows?.[i];
            return (
              <tr key={row?.id ?? line.name}>
                <td className="px-3 py-2 font-body">
                  <span className="font-medium text-sm">{line.name}</span>
                  {!line.supplierLocked && <span className="ml-1.5 text-[9px] font-typewriter uppercase tracking-widest border border-border px-1 text-muted-foreground">supplier tbc</span>}
                  <span className="block text-[10px] text-muted-foreground">{line.supplier ?? "supplier unconfirmed"}</span>
                </td>
                <td className="px-2 py-2 text-right w-24">
                  {readonly || !row || !onComp
                    ? <span className="tabular-nums">{line.unitsPerBottle}</span>
                    : <input value={row.unitsPerBottle} inputMode="decimal" onChange={(e) => onComp(i, { unitsPerBottle: e.target.value })} className={cellInput} />}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{line.requiredUnits}</td>
                <td className="px-2 py-2 text-right w-28">
                  {readonly || !row || !onComp ? (
                    <span className="tabular-nums">{line.packSize ?? "—"}</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <input value={row.packSize} inputMode="numeric" onChange={(e) => onComp(i, { packSize: e.target.value })} className={`${cellInput} w-14`} placeholder="size" />
                      <input value={row.minOrderPacks} inputMode="numeric" onChange={(e) => onComp(i, { minOrderPacks: e.target.value })} className={`${cellInput} w-10`} placeholder="moq" title="Minimum order (packs)" />
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{line.packs ?? "—"}</td>
                <td className="px-2 py-2 text-right tabular-nums">{line.purchasedUnits ?? "—"}</td>
                <td className={`px-2 py-2 text-right tabular-nums ${line.surplusPct != null && line.surplusPct > 50 ? "text-destructive font-medium" : ""}`}>
                  {line.surplusUnits != null ? `${line.surplusUnits} (${fmt(line.surplusPct, 0)}%)` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  </div>
);

const ActualsModal = ({
  batch, aBottles, aVolume, aNotes, setABottles, setAVolume, setANotes, onSave, onClose, busy,
}: {
  batch: SavedBatch; aBottles: string; aVolume: string; aNotes: string;
  setABottles: (v: string) => void; setAVolume: (v: string) => void; setANotes: (v: string) => void;
  onSave: () => void; onClose: () => void; busy: boolean;
}) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-background border border-border p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
      <h4 className="font-typewriter text-sm uppercase tracking-widest">Record actuals · {batch.batch_ref}</h4>
      <p className="text-xs font-body text-muted-foreground">
        The only write permitted against a saved batch. Everything else stays frozen.
      </p>
      <div className="flex gap-3">
        <label className="block text-sm flex-1">
          <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Bottles filled</span>
          <input value={aBottles} inputMode="numeric" onChange={(e) => setABottles(e.target.value)} className={`${inputCls} w-full`} />
        </label>
        <label className="block text-sm flex-1">
          <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Batch volume (ml)</span>
          <input value={aVolume} inputMode="decimal" onChange={(e) => setAVolume(e.target.value)} className={`${inputCls} w-full`} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Notes</span>
        <textarea value={aNotes} onChange={(e) => setANotes(e.target.value)} rows={2} className={`${inputCls} w-full`} />
      </label>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={busy} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy ? "…" : "Save actuals"}</button>
        <button onClick={onClose} className="text-xs font-body text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  </div>
);

export default BatchSizing;
