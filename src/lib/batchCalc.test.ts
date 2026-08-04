import { describe, expect, it } from "vitest";
import {
  buildSnapshots,
  computeBatch,
  validateBatch,
  type CalcInputs,
  type ComponentInput,
  type IngredientInput,
} from "./batchCalc";

const ing = (over: Partial<IngredientInput> = {}): IngredientInput => ({
  name: "Test Oil",
  inciName: "Testum Oleum",
  supplier: "Acme",
  supplierLocked: true,
  pctWw: 100,
  densityGMl: 0.9,
  densitySource: "coa",
  isAuGrown: true,
  minPct: null,
  maxPct: null,
  packSize: null,
  packUnit: null,
  minOrderPacks: null,
  ...over,
});

const comp = (over: Partial<ComponentInput> = {}): ComponentInput => ({
  name: "Bottle",
  supplier: "Glassco",
  supplierLocked: true,
  unitsPerBottle: 1,
  packSize: null,
  minOrderPacks: null,
  ...over,
});

const inputs = (over: Partial<CalcInputs> = {}): CalcInputs => ({
  bottles: 700,
  targetFillMl: 30,
  processLossPct: 8,
  orderingBufferPct: 10,
  ...over,
});

describe("computeBatch", () => {
  it("computes the doc's worked quantities for a single-ingredient formula", () => {
    const r = computeBatch(inputs({ orderingBufferPct: 0 }), [ing()], []);
    expect(r.filledVolumeMl).toBe(21000);
    expect(r.batchVolumeMl).toBeCloseTo(21000 / 0.92, 6);
    expect(r.blendDensityGMl).toBeCloseTo(0.9, 9);
    expect(r.batchMassG).toBeCloseTo((21000 / 0.92) * 0.9, 6);
    expect(r.ingredients[0].massG).toBeCloseTo(r.batchMassG, 6);
    expect(r.ingredients[0].volumeMl).toBeCloseTo(r.batchVolumeMl, 6);
  });

  it("computes ideal-mixing blend density on mass fractions (two-ingredient hand check)", () => {
    // 50/50 by mass of ρ=1.0 and ρ=0.5 → 1 / (0.5/1 + 0.5/0.5) = 1/1.5
    const r = computeBatch(inputs(), [
      ing({ pctWw: 50, densityGMl: 1.0 }),
      ing({ pctWw: 50, densityGMl: 0.5, isAuGrown: false }),
    ], []);
    expect(r.blendDensityGMl).toBeCloseTo(1 / 1.5, 9);
    expect(r.auGrownPct).toBeCloseTo(50, 9);
  });

  it("scales proportionally when percentages do not sum to 100", () => {
    const r = computeBatch(inputs(), [
      ing({ pctWw: 30 }),
      ing({ pctWw: 30 }),
    ], []);
    expect(r.sumPct).toBe(60);
    expect(r.ingredients[0].massFraction).toBeCloseTo(0.5, 9);
    const masses = r.ingredients.reduce((s, i) => s + i.massG, 0);
    expect(masses).toBeCloseTo(r.batchMassG, 6);
  });

  it("returns zeroed results at zero bottles and with a zero-percent formula", () => {
    const r = computeBatch(inputs({ bottles: 0 }), [ing()], [comp()]);
    expect(r.batchVolumeMl).toBe(0);
    expect(r.batchMassG).toBe(0);
    const z = computeBatch(inputs(), [ing({ pctWw: 0 })], []);
    expect(z.sumPct).toBe(0);
    expect(z.batchMassG).toBe(0);
    expect(z.ingredients[0].massG).toBe(0);
    expect(Number.isFinite(z.blendDensityGMl)).toBe(true);
  });

  it("handles process loss at 0% and clamps at the 95% ceiling", () => {
    const zero = computeBatch(inputs({ processLossPct: 0 }), [ing()], []);
    expect(zero.batchVolumeMl).toBe(21000);
    const nearClamp = computeBatch(inputs({ processLossPct: 94.9 }), [ing()], []);
    expect(nearClamp.batchVolumeMl).toBeCloseTo(21000 / (1 - 0.949), 3);
    const over = computeBatch(inputs({ processLossPct: 99 }), [ing()], []);
    expect(over.inputs.processLossPct).toBeLessThan(95);
    expect(Number.isFinite(over.batchVolumeMl)).toBe(true);
  });

  it("rounds packs up and applies MOQ when it exceeds the requirement", () => {
    // 700 bottles × 30 ml → 21 L filled; 8% loss → ~22.83 L; 35% jojoba w/w.
    const jojoba = ing({ pctWw: 100, densityGMl: 0.865, packSize: 5, packUnit: "L", minOrderPacks: null });
    const r = computeBatch(inputs(), [jojoba], []);
    const line = r.ingredients[0];
    expect(line.requiredInPackUnit).toBeGreaterThan(0);
    expect(line.packs).toBe(Math.ceil((line.requiredInPackUnit as number) / 5));
    expect(line.purchasedInPackUnit).toBeCloseTo((line.packs as number) * 5, 9);
    expect(line.surplusInPackUnit).toBeCloseTo(
      (line.purchasedInPackUnit as number) - (line.requiredInPackUnit as number), 9);

    // MOQ dominates: tiny requirement, min 4 packs.
    const moq = computeBatch(inputs({ bottles: 10 }), [
      ing({ pctWw: 100, densityGMl: 0.9, packSize: 5, packUnit: "L", minOrderPacks: 4 }),
    ], []);
    expect(moq.ingredients[0].packs).toBe(4);
    expect(moq.ingredients[0].surplusPct).toBeGreaterThan(50);
  });

  it("kg pack units use order mass, not volume", () => {
    const r = computeBatch(inputs({ orderingBufferPct: 0 }), [
      ing({ pctWw: 100, densityGMl: 0.5, packSize: 1, packUnit: "kg" }),
    ], []);
    const line = r.ingredients[0];
    expect(line.requiredInPackUnit).toBeCloseTo(line.orderMassG / 1000, 9);
  });

  it("null pack size leaves pack fields null (raw quantity fallback)", () => {
    const r = computeBatch(inputs(), [ing({ packSize: null })], [comp({ packSize: null })]);
    expect(r.ingredients[0].packs).toBeNull();
    expect(r.ingredients[0].surplusInPackUnit).toBeNull();
    expect(r.components[0].packs).toBeNull();
  });

  it("components: ceil(bottles × units × buffer) then pack rounding", () => {
    const r = computeBatch(inputs(), [ing()], [comp({ unitsPerBottle: 1, packSize: 500, minOrderPacks: null })]);
    // 700 × 1.1 is 770 exactly in decimal; the FP artefact (770.0000000000001)
    // must not buy a phantom 771st unit.
    expect(r.components[0].requiredUnits).toBe(770);
    expect(r.components[0].packs).toBe(Math.ceil(770 / 500));
    expect(r.components[0].purchasedUnits).toBe(1000);
    expect(r.components[0].surplusUnits).toBe(230);
  });

  it("a missing density excludes the line's volume without corrupting the rest", () => {
    const r = computeBatch(inputs(), [
      ing({ pctWw: 50, densityGMl: 0.9 }),
      ing({ pctWw: 50, densityGMl: null }),
    ], []);
    expect(r.ingredients[1].volumeMl).toBeNull();
    expect(r.blendDensityGMl).toBeCloseTo(0.9, 9);
    expect(Number.isFinite(r.batchMassG)).toBe(true);
  });
});

describe("validateBatch", () => {
  it("flags PCT_SUM only when off by more than 0.005", () => {
    const off = validateBatch(computeBatch(inputs(), [ing({ pctWw: 99 })], []));
    expect(off.some((f) => f.code === "PCT_SUM")).toBe(true);
    const on = validateBatch(computeBatch(inputs(), [ing({ pctWw: 100 })], []));
    expect(on.some((f) => f.code === "PCT_SUM")).toBe(false);
  });

  it("drives range checks off min/max pct generically", () => {
    const flags = validateBatch(computeBatch(inputs(), [
      ing({ name: "Vit E", pctWw: 2.5, minPct: 0.5, maxPct: 2 }),
      ing({ name: "Rosemary", pctWw: 0.01, minPct: 0.02, maxPct: 0.1 }),
      ing({ pctWw: 97.49 }),
    ], []));
    expect(flags.filter((f) => f.code === "RANGE_HIGH")).toHaveLength(1);
    expect(flags.filter((f) => f.code === "RANGE_LOW")).toHaveLength(1);
  });

  it("AU_ORIGIN warns under 50% and reports the figure either way", () => {
    const under = validateBatch(computeBatch(inputs(), [
      ing({ pctWw: 40, isAuGrown: true }),
      ing({ pctWw: 60, isAuGrown: false }),
    ], []));
    const au = under.find((f) => f.code === "AU_ORIGIN");
    expect(au?.level).toBe("warn");
    const over = validateBatch(computeBatch(inputs(), [ing({ isAuGrown: true })], []));
    expect(over.find((f) => f.code === "AU_ORIGIN")?.level).toBe("ok");
  });

  it("INCI_ORDER appends sunflower last and mentions it is never dosed", () => {
    const flags = validateBatch(computeBatch(inputs(), [ing()], []));
    const inci = flags.find((f) => f.code === "INCI_ORDER");
    expect(inci?.message).toMatch(/Helianthus Annuus Seed Oil\./);
    expect(inci?.message).toMatch(/never dosed or ordered separately/);
  });

  it("SUPPLIER_UNLOCKED and DENSITY_UNVERIFIED list offenders; PACK_UNKNOWN and FILL_HEADROOM are info", () => {
    const flags = validateBatch(computeBatch(inputs(), [
      ing({ name: "Rosemary", supplierLocked: false, densitySource: "book" }),
    ], [comp({ name: "Dropper", supplierLocked: false })]));
    expect(flags.find((f) => f.code === "SUPPLIER_UNLOCKED")?.message).toMatch(/Rosemary, Dropper/);
    expect(flags.find((f) => f.code === "DENSITY_UNVERIFIED")?.message).toMatch(/Rosemary/);
    expect(flags.find((f) => f.code === "PACK_UNKNOWN")?.level).toBe("info");
    expect(flags.find((f) => f.code === "FILL_HEADROOM")?.level).toBe("info");
  });

  it("PACK_SURPLUS warns when surplus exceeds 50% of requirement", () => {
    const flags = validateBatch(computeBatch(inputs({ bottles: 10 }), [
      ing({ packSize: 5, packUnit: "L", minOrderPacks: 4 }),
    ], []));
    expect(flags.some((f) => f.code === "PACK_SURPLUS")).toBe(true);
  });
});

describe("snapshot immutability", () => {
  it("editing the master arrays after building snapshots leaves the snapshots unchanged", () => {
    const master = [ing({ name: "Jojoba", pctWw: 35 })];
    const comps = [comp()];
    const results = computeBatch(inputs(), master, comps);
    const snap = buildSnapshots(master, comps, results);

    master[0].pctWw = 32; // the master formula changes later…
    comps[0].unitsPerBottle = 2;

    expect(snap.formula_snapshot[0].pctWw).toBe(35); // …saved batch still shows 35
    expect(snap.components_snapshot[0].unitsPerBottle).toBe(1);
    expect(snap.results_snapshot.ingredients[0].pctWw).toBe(35);
  });
});
