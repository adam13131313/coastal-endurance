// Field Oil financial model — v3 (bottoms-up: $78 retail, 700-unit batch, not
// GST-registered). Source: coastal_endurance_model_v3. These are the planning
// ASSUMPTIONS and derived unit economics; live actuals-vs-plan live in the
// Campaign tab (Plan tracker) and the admin `plan` table. To re-baseline the
// on-screen model, edit the constants below — every margin, break-even and P&L
// figure recomputes from them.

const PRICE = 78.0; // retail, GST-inclusive. Not GST-registered, so net = gross.
const YEAR1_UNITS = 700; // base-case volume — one production batch.
const FIXED_MONTHLY = 150; // Supabase / Vercel / Klaviyo / domain.

// Product COGS per unit — the inventoriable cost of one finished, packed bottle.
const PRODUCT_COGS: [string, number][] = [
  ["Finished oil blend, 30ml", 6.0],
  ["Amber bottle + glass dropper", 2.5],
  ["Stone paper label", 0.6],
  ["Kraft box", 1.2],
  ["A6 insert card", 0.3],
  ["C6 kraft envelope", 0.15],
  ["Kraft bubble mailer", 0.6],
  ["Jute twine + kraft wrap", 0.25],
  ["Fill / assembly labour", 2.4],
];

// Fulfilment per unit sold — period cost, incurred only on a sale.
const SHIPPING = 10.0; // outbound, absorbed (customer isn't charged).
const STRIPE_PCT = 0.0175;
const STRIPE_FIXED = 0.3;

// One-off setup (Year 1 only).
const SETUP: [string, number][] = [
  ["Formulation + stability / micro testing", 2500],
  ["Packaging + label design", 1500],
  ["Web build (Supabase / Vercel / Stripe)", 2500],
  ["Photography / content", 1000],
  ["Meta launch ad spend", 1500],
  ["Contingency", 1000],
];

const sum = (rows: [string, number][]) => rows.reduce((s, [, v]) => s + v, 0);
const money = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money0 = (n: number) => `$${Math.round(n).toLocaleString("en-AU")}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// Derived economics — all computed, never hardcoded, so the model stays consistent.
const productCogs = sum(PRODUCT_COGS); // $14.00
const stripeFee = PRICE * STRIPE_PCT + STRIPE_FIXED; // $1.665
const fulfilment = SHIPPING + stripeFee; // $11.67
const variableCost = productCogs + fulfilment; // $25.67 (matches plan.variable_cost_cents)

const grossProfitUnit = PRICE - productCogs; // $64.00
const grossMargin = grossProfitUnit / PRICE; // 82.1%
const contributionUnit = PRICE - variableCost; // $52.34
const contributionMargin = contributionUnit / PRICE; // 67.1%

const setupTotal = sum(SETUP); // $10,000
const fixedYear = FIXED_MONTHLY * 12; // $1,800
const breakevenUnits = Math.ceil((setupTotal + fixedYear) / contributionUnit); // ~226
const cashToLaunch = setupTotal + YEAR1_UNITS * productCogs + FIXED_MONTHLY * 3; // $20,250

const revenueY1 = PRICE * YEAR1_UNITS;
const cogsY1 = productCogs * YEAR1_UNITS;
const grossProfitY1 = revenueY1 - cogsY1;
const fulfilmentY1 = fulfilment * YEAR1_UNITS;
const contributionY1 = contributionUnit * YEAR1_UNITS;
const netAfterSetupY1 = contributionY1 - fixedYear - setupTotal;

const SCENARIOS = [500, 600, 700].map((units) => ({
  units,
  revenue: PRICE * units,
  contribution: contributionUnit * units,
  net: contributionUnit * units - fixedYear - setupTotal,
}));

const Tile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="border border-border p-4">
    <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-2 font-typewriter text-2xl text-foreground">{value}</p>
    {sub && <p className="mt-1 text-xs font-body text-muted-foreground">{sub}</p>}
  </div>
);

// A single line in a cost / P&L stack. `strong` bolds subtotals; `neg` shows the
// value as a deduction.
const Line = ({ label, value, strong, neg, top }: { label: string; value: number; strong?: boolean; neg?: boolean; top?: boolean }) => (
  <div className={`flex items-baseline justify-between py-1.5 ${top ? "border-t border-border mt-1 pt-2.5" : ""}`}>
    <span className={`font-body text-sm ${strong ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
    <span className={`font-body text-sm tabular-nums ${strong ? "text-foreground font-medium" : "text-muted-foreground"}`}>
      {neg ? `(${money(value)})` : money(value)}
    </span>
  </div>
);

const FinancialModel = () => {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="font-typewriter text-sm uppercase tracking-widest text-foreground">Financial model — assumptions</h3>
        <p className="mt-2 text-xs font-body text-muted-foreground max-w-[640px]">
          The base-case planning model (v3): {money0(PRICE)} retail, {YEAR1_UNITS}-unit batch, not GST-registered.
          These are targets and cost assumptions — track them against live sales in the Campaign tab.
        </p>
      </div>

      {/* Headline economics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Tile label="Retail price" value={money(PRICE)} sub="GST-inclusive, no GST remitted" />
        <Tile label="Contribution margin" value={money(contributionUnit)} sub={`${pct(contributionMargin)} per unit`} />
        <Tile label="Gross margin" value={pct(grossMargin)} sub={`${money(grossProfitUnit)}/unit after product COGS`} />
        <Tile label="Variable cost / unit" value={money(variableCost)} sub="product COGS + fulfilment" />
        <Tile label="Break-even" value={`${breakevenUnits} units`} sub="to cover Year-1 fixed + setup" />
        <Tile label="Cash to launch" value={money0(cashToLaunch)} sub="before any revenue" />
      </div>

      {/* Per-unit cost stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">Product COGS / unit</h4>
          <div>
            {PRODUCT_COGS.map(([label, value]) => (
              <Line key={label} label={label} value={value} />
            ))}
            <Line label="Subtotal — product COGS" value={productCogs} strong top />
          </div>

          <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2 mt-8">Fulfilment / unit sold</h4>
          <div>
            <Line label="Outbound shipping (absorbed)" value={SHIPPING} />
            <Line label={`Stripe processing (${(STRIPE_PCT * 100).toFixed(2)}% + ${money(STRIPE_FIXED)})`} value={stripeFee} />
            <Line label="Subtotal — fulfilment" value={fulfilment} strong top />
          </div>

          <div className="mt-3">
            <Line label="Total variable cost / unit" value={variableCost} strong top />
          </div>
        </div>

        {/* Unit economics + base-case P&L */}
        <div>
          <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">Unit economics</h4>
          <div>
            <Line label="Net revenue" value={PRICE} strong />
            <Line label="Less: product COGS" value={productCogs} neg />
            <Line label="Gross profit" value={grossProfitUnit} strong top />
            <span className="block text-right text-xs font-body text-muted-foreground">{pct(grossMargin)} gross margin</span>
            <Line label="Less: fulfilment" value={fulfilment} neg />
            <Line label="Contribution margin" value={contributionUnit} strong top />
            <span className="block text-right text-xs font-body text-muted-foreground">{pct(contributionMargin)} contribution margin</span>
          </div>

          <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2 mt-8">
            Year 1 — base case ({YEAR1_UNITS} units)
          </h4>
          <div>
            <Line label="Revenue" value={revenueY1} strong />
            <Line label="Less: product COGS" value={cogsY1} neg />
            <Line label="Gross profit" value={grossProfitY1} strong top />
            <Line label="Less: fulfilment" value={fulfilmentY1} neg />
            <Line label="Less: fixed (12 mo)" value={fixedYear} neg />
            <Line label="Less: one-off setup" value={setupTotal} neg />
            <Line label="Year 1 net (after setup)" value={netAfterSetupY1} strong top />
          </div>
        </div>
      </div>

      {/* Cash to launch */}
      <div className="max-w-[520px]">
        <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">Cash to launch (before revenue)</h4>
        <div>
          <Line label="One-off setup" value={setupTotal} />
          <Line label={`Inventory — full batch (${YEAR1_UNITS} × ${money(productCogs)} product COGS)`} value={YEAR1_UNITS * productCogs} />
          <Line label="First 3 months fixed" value={FIXED_MONTHLY * 3} />
          <Line label="Total cash to launch" value={cashToLaunch} strong top />
        </div>
        <p className="mt-2 text-xs font-body text-muted-foreground">
          Fulfilment (shipping + processing) is per-sale, not pre-paid, so it's excluded from launch cash.
        </p>
      </div>

      {/* Scenarios */}
      <div>
        <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Scenarios — units sold vs {YEAR1_UNITS} batch
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm font-body">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground font-normal">Metric</th>
                {SCENARIOS.map((s, i) => (
                  <th key={s.units} className="py-2 text-right font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground font-normal">
                    {i === SCENARIOS.length - 1 ? `Base ${s.units}` : s.units}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 text-muted-foreground">Revenue</td>
                {SCENARIOS.map((s) => <td key={s.units} className="py-2 text-right tabular-nums">{money0(s.revenue)}</td>)}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 text-muted-foreground">Contribution margin</td>
                {SCENARIOS.map((s) => <td key={s.units} className="py-2 text-right tabular-nums">{money0(s.contribution)}</td>)}
              </tr>
              <tr>
                <td className="py-2 text-foreground font-medium">Year 1 net (after fixed + setup)</td>
                {SCENARIOS.map((s) => <td key={s.units} className="py-2 text-right tabular-nums text-foreground font-medium">{money0(s.net)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs font-body text-muted-foreground">
          Absorbed shipping (${SHIPPING.toFixed(0)}/unit) is baked into variable cost. Model v3 · not GST-registered · edit assumptions in the code or the `plan` table.
        </p>
      </div>
    </div>
  );
};

export default FinancialModel;
