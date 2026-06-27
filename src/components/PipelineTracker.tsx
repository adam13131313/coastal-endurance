import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PipeOrder {
  status: string;
  total_cents: number;
  utm_source: string | null;
  utm_medium: string | null;
  referrer: string | null;
  heard_about: string | null;
  order_items: { bottles_each: number; quantity: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;
const FILL = "hsl(var(--foreground))";

function channelOf(o: PipeOrder): string {
  if (o.utm_source) return o.utm_source.toLowerCase();
  if (o.referrer) {
    try {
      return new URL(o.referrer).hostname.replace(/^www\./, "");
    } catch {
      return "referral";
    }
  }
  return "direct / unknown";
}

const unitsOf = (o: PipeOrder) => o.order_items.reduce((t, it) => t + it.bottles_each * it.quantity, 0);

const PipelineTracker = ({ orders }: { orders: PipeOrder[] }) => {
  const [target, setTarget] = useState(700);
  const [visitRate, setVisitRate] = useState(2); // visit -> purchase %
  const [reachRate, setReachRate] = useState(1.5); // impression -> visit %

  useEffect(() => {
    sb.from("plan").select("year1_units").eq("id", 1).maybeSingle().then(({ data }: { data: { year1_units: number | null } | null }) => {
      if (data?.year1_units) setTarget(data.year1_units);
    });
  }, []);

  const d = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
    const channelMap = new Map<string, { orders: number; units: number; revenue: number }>();
    for (const o of paid) {
      const ch = channelOf(o);
      const e = channelMap.get(ch) ?? { orders: 0, units: 0, revenue: 0 };
      e.orders += 1;
      e.units += unitsOf(o);
      e.revenue += o.total_cents;
      channelMap.set(ch, e);
    }
    const channels = [...channelMap.entries()].map(([channel, v]) => ({ channel, ...v })).sort((a, b) => b.units - a.units);

    const heardMap = new Map<string, number>();
    for (const o of paid) {
      if (o.heard_about) {
        const k = o.heard_about.trim();
        heardMap.set(k, (heardMap.get(k) ?? 0) + unitsOf(o));
      }
    }
    const heard = [...heardMap.entries()].map(([label, units]) => ({ label, units })).sort((a, b) => b.units - a.units);

    const soldUnits = paid.reduce((s, o) => s + unitsOf(o), 0);
    return { channels, heard, soldUnits };
  }, [orders]);

  const remaining = Math.max(target - d.soldUnits, 0);
  const visitsNeeded = visitRate > 0 ? Math.round(remaining / (visitRate / 100)) : 0;
  const reachNeeded = reachRate > 0 ? Math.round(visitsNeeded / (reachRate / 100)) : 0;

  return (
    <div className="max-w-[820px] space-y-12">
      <section>
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-1">Where sales come from</h2>
        <p className="text-xs font-body text-muted-foreground mb-4">Auto-tagged from UTM links and referrers. Tag your marketing links with ?utm_source=… so they land here.</p>
        {d.channels.length === 0 ? (
          <p className="font-body text-muted-foreground text-sm">No sales yet.</p>
        ) : (
          <>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={d.channels} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
                  <Tooltip formatter={(v: number) => [v, "Units"]} cursor={{ fill: "hsl(var(--muted))" }} />
                  <Bar dataKey="units" fill={FILL} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 border border-border divide-y divide-border text-sm font-body">
              <div className="grid grid-cols-4 p-2 text-xs font-typewriter uppercase tracking-wider text-muted-foreground">
                <span>Channel</span><span className="text-right">Orders</span><span className="text-right">Units</span><span className="text-right">Revenue</span>
              </div>
              {d.channels.map((c) => (
                <div key={c.channel} className="grid grid-cols-4 p-2">
                  <span>{c.channel}</span>
                  <span className="text-right text-muted-foreground">{c.orders}</span>
                  <span className="text-right text-muted-foreground">{c.units}</span>
                  <span className="text-right text-muted-foreground">{formatPrice(c.revenue)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-1">How they heard (manual)</h2>
        <p className="text-xs font-body text-muted-foreground mb-4">From the field you fill in per order. Captures word-of-mouth that tagging can't.</p>
        {d.heard.length === 0 ? (
          <p className="font-body text-muted-foreground text-sm">Nothing recorded yet.</p>
        ) : (
          <div className="border border-border divide-y divide-border text-sm font-body">
            {d.heard.map((h) => (
              <div key={h.label} className="flex justify-between p-2">
                <span>{h.label}</span>
                <span className="text-muted-foreground">{h.units} units</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-1">Reach needed to hit target</h2>
        <p className="text-xs font-body text-muted-foreground mb-4">A planning estimate. Edit the conversion rates to match reality once you have analytics.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="border border-border p-3">
            <p className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Target units</p>
            <p className="mt-1 font-typewriter text-xl text-foreground">{target}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Sold</p>
            <p className="mt-1 font-typewriter text-xl text-foreground">{d.soldUnits}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Remaining</p>
            <p className="mt-1 font-typewriter text-xl text-foreground">{remaining}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-5">
          <label className="text-sm font-body">
            <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Visit → purchase %</span>
            <input type="number" step="0.1" value={visitRate} onChange={(e) => setVisitRate(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
          <label className="text-sm font-body">
            <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Impression → visit %</span>
            <input type="number" step="0.1" value={reachRate} onChange={(e) => setReachRate(parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="border border-foreground p-4">
            <p className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Site visits still needed</p>
            <p className="mt-1 font-typewriter text-2xl text-foreground">{visitsNeeded.toLocaleString()}</p>
          </div>
          <div className="border border-foreground p-4">
            <p className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Impressions / reach needed</p>
            <p className="mt-1 font-typewriter text-2xl text-foreground">{reachNeeded.toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-3 text-xs font-body text-muted-foreground">
          To sell the remaining {remaining} units at a {visitRate}% visit-to-purchase rate, you need ~{visitsNeeded.toLocaleString()} visits, which at a {reachRate}% reach-to-visit rate means ~{reachNeeded.toLocaleString()} impressions across your channels.
        </p>
      </section>
    </div>
  );
};

export default PipelineTracker;
