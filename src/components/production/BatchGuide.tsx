// The step-by-step for running a Field Oil batch, mapped to the tabs where each
// step is recorded. Condensed from the Production & QC guide; the two principles
// (oxidation + water) govern every choice below.

const PRINCIPLES = [
  {
    h: "Oxidation is the enemy",
    p: "The blend is mostly polyunsaturated actives (hemp, rosehip) that go rancid with heat, light, air and time. So: blend at room temperature (never heat), work out of direct light, mix gently (don't whip air in), and fill promptly — same day.",
  },
  {
    h: "Water is the enemy",
    p: "No water, no preservative — it's microbiologically safe only while it stays dry. Every surface that touches the product (vessel, stirrer, bottles, droppers) must be clean and completely dry. A single drop of water is a contamination risk.",
  },
];

const STEPS = [
  {
    n: 1,
    tab: "Materials",
    h: "Receive & release every raw material",
    items: [
      "Receive each delivery as a lot → it lands in quarantine.",
      "Run incoming QC: appearance, odour, best-before, COA on file.",
      "Hemp is the critical one — its peroxide value must be ≤ the spec (10 meq/kg) or the lot can't be released. This governs shelf life.",
      "Only released lots can be selected in a blend.",
    ],
  },
  {
    n: 2,
    tab: "Formula",
    h: "Work out your quantities",
    items: [
      "Enter how many bottles you want to make → the calculator gives the gram target for each ingredient.",
      "Make a few extra beyond your sellable target to cover fill losses and the retains you'll hold back.",
    ],
  },
  {
    n: 3,
    tab: "Batches",
    h: "Open the batch",
    items: [
      "New batch → enter bottles to make (auto-numbers FO-YYYYMMDD).",
      "This seeds the gram targets from the active formula and opens the batch record (the BMR).",
    ],
  },
  {
    n: 4,
    tab: "—",
    h: "Prep (before you weigh anything)",
    items: [
      "Vessel, stirrer, filler and tubing degreased, sanitised, and fully dried.",
      "Bottles and droppers clean and dry — no moisture.",
      "Calibrated scale for the majors; a fine 0.1 g balance for the rosemary (and ideally the Vitamin E).",
    ],
  },
  {
    n: 5,
    tab: "Batches",
    h: "Blend — order matters",
    items: [
      "Charge the stable base oils first: jojoba (reserve ~1% for the premix), macadamia, meadowfoam. Bring any cold-clouded oil to room temp gently — never direct heat.",
      "Make the antioxidant premix: the reserved jojoba + Vitamin E + rosemary, stirred until uniform (rosemary is tiny, so it must be pre-dispersed).",
      "Add the premix to the vessel, mix gently until homogeneous.",
      "Add the actives LAST: rosehip, then hemp. Mix just until uniform — minimise time, don't draw air in.",
      "In the Batches tab, record the actual grams weighed and pick the released lot used for each ingredient → this decrements lot quantities and builds the trace.",
    ],
  },
  {
    n: 6,
    tab: "Batches",
    h: "In-process QC",
    items: [
      "Appearance (uniform, no separation/sediment) and homogeneity (no streaking) must pass.",
      "Temperature stays ambient (confirm no heating).",
      "Weight reconciliation: actual total vs theoretical — the tab flags anything beyond ±2% to investigate before you fill.",
    ],
  },
  {
    n: 7,
    tab: "Batches",
    h: "Fill & pack",
    items: [
      "Fill each bottle to 30 ml. Minimise headspace — less trapped oxygen is the single biggest, free shelf-life lever.",
      "(Optional) a 1-second burst of food-grade argon into the headspace before capping; record if used.",
      "Seat the dropper, cap, check the seal, wipe, label. Stamp the batch number and best-before.",
      "Record the units filled (yield) in the Batches tab.",
    ],
  },
  {
    n: 8,
    tab: "Batches",
    h: "Finished QC",
    items: [
      "Appearance vs your retained reference, odour (no rancid note), fill check (30 ml ±5%), seal/dropper integrity, label correct.",
      "Every gating check must pass — the batch can't be released otherwise.",
      "Optional lab baselines for the first batch: finished peroxide value + microbial (TVC, yeast/mould).",
    ],
  },
  {
    n: 9,
    tab: "Retains",
    h: "Keep retains",
    items: [
      "Hold ≥3 sealed units from the batch, out of light, for the full best-before period — your reference standard, complaint reference, and stability feed.",
      "Log them in the Retains tab.",
    ],
  },
  {
    n: 10,
    tab: "Batches",
    h: "Release",
    items: [
      "Set the best-before and release the batch — allowed only once finished QC has passed. Who released it and when is recorded (self-release for now).",
      "The batch record locks (read-only) and the BMR is printable/exportable.",
      "Stock stays manual: use the recorded yield to update the store's stock by hand.",
    ],
  },
];

const BatchGuide = () => (
  <div className="max-w-[820px] space-y-10">
    <section>
      <h3 className="font-typewriter text-lg uppercase tracking-wider mb-2">How to run a batch</h3>
      <p className="text-sm font-body text-muted-foreground">
        Field Oil is an anhydrous cold-blend — no heating, no water, no emulsifying. Mechanically simple; two principles govern everything.
      </p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRINCIPLES.map((pr) => (
          <div key={pr.h} className="border border-foreground/50 p-4">
            <p className="font-typewriter text-xs uppercase tracking-widest mb-2">{pr.h}</p>
            <p className="text-sm font-body text-muted-foreground leading-relaxed">{pr.p}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="space-y-4">
      {STEPS.map((s) => (
        <div key={s.n} className="border border-border p-4">
          <div className="flex items-baseline gap-3">
            <span className="font-typewriter text-lg tabular-nums text-muted-foreground">{s.n}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h4 className="font-typewriter text-sm uppercase tracking-wider">{s.h}</h4>
                {s.tab !== "—" && (
                  <span className="text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{s.tab} tab</span>
                )}
              </div>
              <ul className="mt-2 space-y-1.5">
                {s.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-body text-muted-foreground leading-relaxed">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 mt-2 flex-shrink-0" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </section>

    <p className="text-xs font-body text-muted-foreground">
      Provisional pending the safety/claims assessment and the stability study (which sets the real best-before). Keep BMRs, COAs and release records for at least 5 years.
    </p>
  </div>
);

export default BatchGuide;
