// Batch Volume Calculator — pure maths + validation, no framework or Supabase
// dependencies. The UI (and any future server-side use) calls these.
//
// Precision rule: intermediates are never rounded. Rounding happens only at
// the deliberate ceil() steps in pack rounding and at display time (the UI's
// job). results carry full precision into the saved snapshot.

export interface CalcInputs {
  bottles: number;
  targetFillMl: number;
  processLossPct: number;    // clamped to [0, 95)
  orderingBufferPct: number;
}

export interface IngredientInput {
  name: string;
  inciName: string | null;
  supplier: string | null;
  supplierLocked: boolean;
  pctWw: number;
  densityGMl: number | null; // null / <= 0 => volume unknown for this line
  densitySource: "book" | "coa";
  isAuGrown: boolean;
  minPct: number | null;
  maxPct: number | null;
  packSize: number | null;   // in packUnit
  packUnit: "L" | "kg" | null;
  minOrderPacks: number | null;
}

export interface ComponentInput {
  name: string;
  supplier: string | null;
  supplierLocked: boolean;
  unitsPerBottle: number;
  packSize: number | null;   // units per carton
  minOrderPacks: number | null;
}

export interface IngredientResult extends IngredientInput {
  massFraction: number;
  massG: number;
  volumeMl: number | null;
  orderMassG: number;
  orderVolumeMl: number | null;
  requiredInPackUnit: number | null; // kg or L depending on packUnit
  packs: number | null;
  purchasedInPackUnit: number | null;
  surplusInPackUnit: number | null;
  surplusPct: number | null;         // surplus as % of required
}

export interface ComponentResult extends ComponentInput {
  requiredUnits: number;
  packs: number | null;
  purchasedUnits: number | null;
  surplusUnits: number | null;
  surplusPct: number | null;
}

export interface BatchResults {
  inputs: CalcInputs;              // as used (after clamping)
  sumPct: number;
  filledVolumeMl: number;
  batchVolumeMl: number;
  blendDensityGMl: number;
  batchMassG: number;
  auGrownPct: number;
  ingredients: IngredientResult[];
  components: ComponentResult[];
}

export type FlagLevel = "ok" | "warn" | "info";
export interface ValidationFlag {
  level: FlagLevel;
  code: string;
  message: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// Ceil with a tiny epsilon so binary floating-point noise (700 × 1.1 =
// 770.0000000000001) doesn't buy a phantom extra unit or pack.
const ceilSafe = (v: number) => Math.ceil(v - 1e-9);

export function computeBatch(
  rawInputs: CalcInputs,
  ingredients: IngredientInput[],
  components: ComponentInput[],
): BatchResults {
  const inputs: CalcInputs = {
    bottles: Math.max(0, Math.floor(rawInputs.bottles || 0)),
    targetFillMl: Math.max(0, rawInputs.targetFillMl || 0),
    processLossPct: clamp(rawInputs.processLossPct || 0, 0, 94.999),
    orderingBufferPct: Math.max(0, rawInputs.orderingBufferPct || 0),
  };

  const sumPct = ingredients.reduce((s, i) => s + (i.pctWw || 0), 0);
  const filledVolumeMl = inputs.bottles * inputs.targetFillMl;
  const batchVolumeMl = filledVolumeMl / (1 - inputs.processLossPct / 100);

  // Ideal-mixing blend density on a mass-fraction basis: 1 / Σ (w_i / ρ_i).
  // Lines with no usable density are excluded from the density sum (their
  // volume is reported as unknown); if nothing has a density, density is 0
  // and masses fall back to volume × 0 = zeroed rather than dividing by zero.
  let densitySum = 0;
  let densityFractionCovered = 0;
  for (const ing of ingredients) {
    const w = sumPct > 0 ? (ing.pctWw || 0) / sumPct : 0;
    if (ing.densityGMl != null && ing.densityGMl > 0) {
      densitySum += w / ing.densityGMl;
      densityFractionCovered += w;
    }
  }
  // Scale to the covered fraction so one unknown density doesn't skew the rest.
  const blendDensityGMl =
    densitySum > 0 ? densityFractionCovered / densitySum : 0;
  const batchMassG = batchVolumeMl * blendDensityGMl;

  const buffer = 1 + inputs.orderingBufferPct / 100;

  const ingredientResults: IngredientResult[] = ingredients.map((ing) => {
    const w = sumPct > 0 ? (ing.pctWw || 0) / sumPct : 0;
    const massG = w * batchMassG;
    const hasDensity = ing.densityGMl != null && ing.densityGMl > 0;
    const volumeMl = hasDensity ? massG / (ing.densityGMl as number) : null;
    const orderMassG = massG * buffer;
    const orderVolumeMl = volumeMl != null ? volumeMl * buffer : null;

    let requiredInPackUnit: number | null = null;
    let packs: number | null = null;
    let purchasedInPackUnit: number | null = null;
    let surplusInPackUnit: number | null = null;
    let surplusPct: number | null = null;

    if (ing.packSize != null && ing.packSize > 0 && ing.packUnit) {
      requiredInPackUnit =
        ing.packUnit === "kg" ? orderMassG / 1000 : orderVolumeMl != null ? orderVolumeMl / 1000 : null;
      if (requiredInPackUnit != null) {
        packs = Math.max(ceilSafe(requiredInPackUnit / ing.packSize), ing.minOrderPacks ?? 1);
        purchasedInPackUnit = packs * ing.packSize;
        surplusInPackUnit = purchasedInPackUnit - requiredInPackUnit;
        surplusPct = requiredInPackUnit > 0 ? (surplusInPackUnit / requiredInPackUnit) * 100 : null;
      }
    }

    return {
      ...ing,
      massFraction: w,
      massG,
      volumeMl,
      orderMassG,
      orderVolumeMl,
      requiredInPackUnit,
      packs,
      purchasedInPackUnit,
      surplusInPackUnit,
      surplusPct,
    };
  });

  const componentResults: ComponentResult[] = components.map((c) => {
    const requiredUnits = ceilSafe(inputs.bottles * (c.unitsPerBottle || 0) * buffer);
    let packs: number | null = null;
    let purchasedUnits: number | null = null;
    let surplusUnits: number | null = null;
    let surplusPct: number | null = null;
    if (c.packSize != null && c.packSize > 0) {
      packs = Math.max(ceilSafe(requiredUnits / c.packSize), c.minOrderPacks ?? 1);
      purchasedUnits = packs * c.packSize;
      surplusUnits = purchasedUnits - requiredUnits;
      surplusPct = requiredUnits > 0 ? (surplusUnits / requiredUnits) * 100 : null;
    }
    return { ...c, requiredUnits, packs, purchasedUnits, surplusUnits, surplusPct };
  });

  const auPct = ingredients.reduce((s, i) => s + (i.isAuGrown ? i.pctWw || 0 : 0), 0);
  const auGrownPct = sumPct > 0 ? (auPct / sumPct) * 100 : 0;

  return {
    inputs,
    sumPct,
    filledVolumeMl,
    batchVolumeMl,
    blendDensityGMl,
    batchMassG,
    auGrownPct,
    ingredients: ingredientResults,
    components: componentResults,
  };
}

// ---------------------------------------------------------------------------
// Validation flags. Rendered as a persistent panel; warnings never block a
// save (a deliberately non-compliant scenario must be saveable for comparison).
// Range checks are driven off the generic min/max pct columns, not ingredient
// identity, so new constraints need no code change.
// ---------------------------------------------------------------------------
export function validateBatch(results: BatchResults): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  const { ingredients, components, sumPct, auGrownPct } = results;

  if (Math.abs(sumPct - 100) > 0.005) {
    flags.push({
      level: "warn",
      code: "PCT_SUM",
      message: `Percentages total ${sumPct.toFixed(3)}%, not 100%. Quantities are scaled proportionally to the total.`,
    });
  }

  for (const ing of ingredients) {
    if (ing.minPct != null && ing.pctWw < ing.minPct) {
      flags.push({
        level: "warn",
        code: "RANGE_LOW",
        message: `${ing.name} at ${ing.pctWw}% is below its minimum ${ing.minPct}%.`,
      });
    }
    if (ing.maxPct != null && ing.pctWw > ing.maxPct) {
      flags.push({
        level: "warn",
        code: "RANGE_HIGH",
        message: `${ing.name} at ${ing.pctWw}% is above its maximum ${ing.maxPct}%.`,
      });
    }
    if (ing.densityGMl == null || ing.densityGMl <= 0) {
      flags.push({
        level: "warn",
        code: "DENSITY_MISSING",
        message: `${ing.name} has no usable density; its volume is unknown and the blend density excludes it.`,
      });
    }
  }

  flags.push({
    level: auGrownPct < 50 ? "warn" : "ok",
    code: "AU_ORIGIN",
    message:
      auGrownPct < 50
        ? `Australian-grown is ${auGrownPct.toFixed(1)}% by weight. Below 50%, "majority Australian-grown" fails.`
        : `Australian-grown: ${auGrownPct.toFixed(1)}% by weight.`,
  });

  const inciOrder = [...ingredients]
    .sort((a, b) => b.pctWw - a.pctWw)
    .map((i) => i.inciName || i.name);
  inciOrder.push("Helianthus Annuus Seed Oil");
  flags.push({
    level: "info",
    code: "INCI_ORDER",
    message:
      `Label order: ${inciOrder.join(", ")}. Sunflower is the carrier inside the vitamin E and rosemary extract: ` +
      `it must appear on the label but is never dosed or ordered separately.`,
  });

  const unlocked = [
    ...ingredients.filter((i) => !i.supplierLocked).map((i) => i.name),
    ...components.filter((c) => !c.supplierLocked).map((c) => c.name),
  ];
  if (unlocked.length > 0) {
    flags.push({
      level: "warn",
      code: "SUPPLIER_UNLOCKED",
      message: `Supplier not confirmed for: ${unlocked.join(", ")}.`,
    });
  }

  const bookDensities = ingredients
    .filter((i) => i.densityGMl != null && i.densityGMl > 0 && i.densitySource === "book")
    .map((i) => i.name);
  if (bookDensities.length > 0) {
    flags.push({
      level: "warn",
      code: "DENSITY_UNVERIFIED",
      message:
        `Book densities, not certificate values: ${bookDensities.join(", ")}. ` +
        `Jojoba matters most (wax ester at 0.865, well off the other oils).`,
    });
  }

  for (const ing of results.ingredients) {
    if (ing.surplusPct != null && ing.surplusPct > 50) {
      flags.push({
        level: "warn",
        code: "PACK_SURPLUS",
        message:
          `${ing.name}: pack rounding buys ${ing.surplusPct.toFixed(0)}% more than the batch needs. ` +
          `Pack size is dictating the order; consider resizing the batch instead of carrying dead stock.`,
      });
    }
  }
  for (const c of results.components) {
    if (c.surplusPct != null && c.surplusPct > 50) {
      flags.push({
        level: "warn",
        code: "PACK_SURPLUS",
        message: `${c.name}: pack rounding buys ${c.surplusPct.toFixed(0)}% more than the batch needs.`,
      });
    }
  }

  const noPack = [
    ...ingredients.filter((i) => i.packSize == null || !i.packUnit).map((i) => i.name),
    ...components.filter((c) => c.packSize == null).map((c) => c.name),
  ];
  if (noPack.length > 0) {
    flags.push({
      level: "info",
      code: "PACK_UNKNOWN",
      message: `No pack size yet (showing raw order quantities): ${noPack.join(", ")}.`,
    });
  }

  flags.push({
    level: "info",
    code: "FILL_HEADROOM",
    message:
      `Target fill ${results.inputs.targetFillMl} ml is at the physical ceiling of the current bottle, leaving no ` +
      `headspace for thermal expansion in transit. Brim-full capacity with the dropper inserted is unconfirmed, and ` +
      `fill variance against a 30 ml declared net content has average-quantity implications.`,
  });

  return flags;
}

// ---------------------------------------------------------------------------
// Snapshot builders. Saved batches store full inline copies, never references:
// a later edit to the master formula must not change a saved batch. Deep-copied
// via JSON so callers can't retain object identity into the saved payload.
// ---------------------------------------------------------------------------
export function buildSnapshots(
  ingredients: IngredientInput[],
  components: ComponentInput[],
  results: BatchResults,
): { formula_snapshot: IngredientInput[]; components_snapshot: ComponentInput[]; results_snapshot: BatchResults } {
  return {
    formula_snapshot: JSON.parse(JSON.stringify(ingredients)),
    components_snapshot: JSON.parse(JSON.stringify(components)),
    results_snapshot: JSON.parse(JSON.stringify(results)),
  };
}
