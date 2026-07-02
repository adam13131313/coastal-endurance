import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";

interface DashOrder {
  status: string;
  total_cents: number;
  created_at: string;
  order_items: { bottles_each: number; quantity: number }[];
}
interface Plan {
  start_date: string | null;
  year1_units: number | null;
  year1_revenue_cents: number | null;
  variable_cost_cents: number | null;
  launch_cash_cents: number | null;
}

// plan isn't in the generated types until regenerated post-migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const Row = ({ label, actual, target, value, sub }: { label: string; actual: string; target: string; value: number; sub?: string }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <span className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-body">
        <span className="text-foreground font-medium">{actual}</span>
        <span className="text-muted-foreground"> / {target} ({pct(value, 100) >= 0 ? value : 0}%)</span>
      </span>
    </div>
    <div className="h-2 bg-muted w-full mt-2">
      <div className="h-2 bg-foreground" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
    {sub && <p className="mt-1.5 text-xs font-body text-muted-foreground">{sub}</p>}
  </div>
);

// Father's Day campaign: two goals — sell 200 bottles and recruit 20 Field Team
// members for the free trial, by launch day.
const CAMPAIGN = {
  label: "Father's Day campaign",
  targetBottles: 200,
  targetFieldTeam: 20,
  start: "2026-07-01",
  end: "2026-09-06", // Father's Day AU
};

const CampaignTracker = ({ orders }: { orders: DashOrder[] }) => {
  const [fieldTeamCount, setFieldTeamCount] = useState<number | null>(null);

  useEffect(() => {
    sb.from("approved_field_team_members")
      .select("email", { count: "exact", head: true })
      .then(({ count }: { count: number | null }) => setFieldTeamCount(count ?? 0));
  }, []);

  const m = useMemo(() => {
    const start = new Date(CAMPAIGN.start);
    const end = new Date(CAMPAIGN.end);
    const now = new Date();
    const paid = orders.filter(
      (o) => (o.status === "paid" || o.status === "fulfilled") && new Date(o.created_at) >= start,
    );
    const bottles = paid.reduce((s, o) => s + o.order_items.reduce((t, it) => t + it.bottles_each * it.quantity, 0), 0);
    const revenue = paid.reduce((s, o) => s + o.total_cents, 0);
    const dayMs = 86400000;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs));
    const daysGone = Math.min(totalDays, Math.max(0, (now.getTime() - start.getTime()) / dayMs));
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / dayMs));
    const evenPace = (CAMPAIGN.targetBottles / totalDays) * daysGone;
    const needPerDay = daysLeft > 0 ? Math.max(0, CAMPAIGN.targetBottles - bottles) / daysLeft : 0;
    return { bottles, revenue, orderCount: paid.length, daysLeft, evenPace, needPerDay };
  }, [orders]);

  const delta = Math.round(m.bottles - m.evenPace);
  const done = m.bottles >= CAMPAIGN.targetBottles;
  const ft = fieldTeamCount ?? 0;

  return (
    <div className="space-y-7 border border-foreground p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground">
          {CAMPAIGN.label}
        </h2>
        <span className="text-xs font-body text-muted-foreground">{m.daysLeft} days to Father's Day</span>
      </div>
      <Row
        label="Bottles sold"
        actual={`${m.bottles}`}
        target={`${CAMPAIGN.targetBottles}`}
        value={pct(m.bottles, CAMPAIGN.targetBottles)}
        sub={
          done
            ? "Target hit. ✓"
            : `${delta >= 0 ? `${delta} ahead of` : `${-delta} behind`} even pace · need ${m.needPerDay.toFixed(1)}/day from today · ${m.orderCount} orders · ${formatPrice(m.revenue)}`
        }
      />
      <Row
        label="Field Team recruited"
        actual={`${ft}`}
        target={`${CAMPAIGN.targetFieldTeam}`}
        value={pct(ft, CAMPAIGN.targetFieldTeam)}
        sub={
          fieldTeamCount === null
            ? "Loading…"
            : ft >= CAMPAIGN.targetFieldTeam
              ? "Target hit. ✓"
              : `${CAMPAIGN.targetFieldTeam - ft} to go · issue codes in the Field team tab`
        }
      />
    </div>
  );
};

const PlanTracker = ({ orders }: { orders: DashOrder[] }) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    sb.from("plan").select("*").eq("id", 1).maybeSingle().then(({ data }: { data: Plan | null }) => {
      setPlan(data);
      setLoaded(true);
    });
  }, []);

  const m = useMemo(() => {
    if (!plan) return null;
    const start = plan.start_date ? new Date(plan.start_date) : null;
    const paid = orders.filter(
      (o) => (o.status === "paid" || o.status === "fulfilled") && (!start || new Date(o.created_at) >= start),
    );
    const units = paid.reduce((s, o) => s + o.order_items.reduce((t, it) => t + it.bottles_each * it.quantity, 0), 0);
    const revenue = paid.reduce((s, o) => s + o.total_cents, 0);
    const contribution = revenue - units * (plan.variable_cost_cents ?? 0);
    const now = new Date();
    const ms = start ? now.getTime() - start.getTime() : 0;
    const monthsElapsed = start ? Math.max(0, Math.min(ms / (30.44 * 86400000), 12)) : 0;
    return { start, units, revenue, contribution, monthsElapsed, started: !start || ms >= 0 };
  }, [plan, orders]);

  if (!loaded) return <p className="font-body text-muted-foreground text-sm">Loading plan…</p>;
  if (!plan || plan.year1_units == null) {
    return (
      <div className="max-w-[760px] space-y-8">
        <CampaignTracker orders={orders} />
        <p className="font-body text-muted-foreground text-sm">No plan targets set yet. (They live in the admin-only `plan` table.)</p>
      </div>
    );
  }

  const targetUnits = plan.year1_units ?? 0;
  const targetRev = plan.year1_revenue_cents ?? 0;
  const targetContribution = targetRev - targetUnits * (plan.variable_cost_cents ?? 0);
  const launch = plan.launch_cash_cents ?? 0;
  const expectedUnits = targetUnits * Math.min(m!.monthsElapsed / 12, 1);
  const paceDelta = Math.round(m!.units - expectedUnits);
  const monthNo = Math.min(Math.floor(m!.monthsElapsed) + 1, 12);

  const paceText = !m!.started
    ? `Year 1 starts ${plan.start_date}`
    : m!.monthsElapsed < 0.1
      ? "Just getting started"
      : paceDelta >= 0
        ? `On track — ${paceDelta} ahead of an even pace`
        : `${-paceDelta} behind an even pace`;

  return (
    <div className="max-w-[760px] space-y-8">
      <CampaignTracker orders={orders} />

      <div className="flex items-baseline justify-between">
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground">Year 1 vs plan</h2>
        {m!.started && <span className="text-xs font-body text-muted-foreground">Month {monthNo} of 12</span>}
      </div>

      <div className="space-y-7">
        <Row
          label="Units sold"
          actual={`${m!.units}`}
          target={`${targetUnits}`}
          value={pct(m!.units, targetUnits)}
          sub={paceText}
        />
        <Row
          label="Revenue"
          actual={formatPrice(m!.revenue)}
          target={formatPrice(targetRev)}
          value={pct(m!.revenue, targetRev)}
        />
        <Row
          label="Contribution margin (est.)"
          actual={formatPrice(m!.contribution)}
          target={formatPrice(targetContribution)}
          value={pct(m!.contribution, targetContribution)}
          sub="Revenue less units × variable cost per unit."
        />
        <Row
          label="Cash to launch recovered"
          actual={formatPrice(Math.max(m!.contribution, 0))}
          target={formatPrice(launch)}
          value={pct(Math.max(m!.contribution, 0), launch)}
          sub={m!.contribution >= launch && launch > 0 ? "In the black ✓" : "Cumulative contribution vs cash to launch."}
        />
      </div>

      <p className="text-xs font-body text-muted-foreground">
        Targets from your financial model (v3). Edit them in the Supabase `plan` table; figures stay private (not in the public site code).
      </p>
    </div>
  );
};

export default PlanTracker;
