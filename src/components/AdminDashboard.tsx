import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Structural shape of what the dashboard needs from each order (Admin passes its
// richer Order objects, which are compatible).
interface DashOrder {
  status: string;
  total_cents: number;
  created_at: string;
  order_items: { quantity: number; bottles_each: number }[];
  order_deliveries: { scheduled_for: string; status: string }[];
}

const MS_WEEK = 7 * 86400000;
const FILL = "hsl(var(--foreground))";

const Tile = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="border border-border p-4">
    <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="mt-2 font-typewriter text-2xl text-foreground">{value}</p>
    {sub && <p className="mt-1 text-xs font-body text-muted-foreground">{sub}</p>}
  </div>
);

const AdminDashboard = ({ orders }: { orders: DashOrder[] }) => {
  const [stock, setStock] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("stock_quantity")
      .eq("slug", "field-oil")
      .maybeSingle()
      .then(({ data }) => setStock(data?.stock_quantity ?? null));
  }, []);

  const m = useMemo(() => {
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);
    const weekAheadISO = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    const paid = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
    const revenue = paid.reduce((s, o) => s + o.total_cents, 0);
    const revenueMonth = paid
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, o) => s + o.total_cents, 0);
    const bottlesSold = paid.reduce(
      (s, o) => s + o.order_items.reduce((t, it) => t + it.bottles_each * it.quantity, 0),
      0,
    );
    const aov = paid.length ? Math.round(revenue / paid.length) : 0;

    const scheduled = paid.flatMap((o) => o.order_deliveries.filter((d) => d.status === "scheduled"));
    const overdue = scheduled.filter((d) => d.scheduled_for < todayISO).length;
    const dueWeek = scheduled.filter((d) => d.scheduled_for >= todayISO && d.scheduled_for <= weekAheadISO).length;

    // Revenue, last 12 weeks (oldest → newest).
    const weeks = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getTime() - (11 - i) * MS_WEEK);
      return { label: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }), revenue: 0 };
    });
    for (const o of paid) {
      const diff = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / MS_WEEK);
      if (diff >= 0 && diff < 12) weeks[11 - diff].revenue += o.total_cents / 100;
    }

    // Upcoming shipments, next 6 months.
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-AU", { month: "short" }), count: 0 };
    });
    for (const d of scheduled) {
      const dt = new Date(d.scheduled_for);
      const m2 = months.find((x) => x.key === `${dt.getFullYear()}-${dt.getMonth()}`);
      if (m2) m2.count += 1;
    }

    return {
      revenue, revenueMonth, ordersCount: paid.length, bottlesSold, aov,
      shipmentsOwed: scheduled.length, overdue, dueWeek, weeks, months,
    };
  }, [orders]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Revenue" value={formatPrice(m.revenue)} sub={`${formatPrice(m.revenueMonth)} this month`} />
        <Tile label="Paid orders" value={m.ordersCount} />
        <Tile label="Bottles sold" value={m.bottlesSold} />
        <Tile label="Avg order" value={formatPrice(m.aov)} />
        <Tile label="Stock on hand" value={stock ?? "—"} />
        <Tile label="Shipments owed" value={m.shipmentsOwed} sub="scheduled, unshipped" />
        <Tile label="Overdue" value={m.overdue} />
        <Tile label="Due this week" value={m.dueWeek} />
      </div>

      {m.ordersCount === 0 && (
        <p className="text-sm font-body text-muted-foreground">No paid orders yet — figures populate once sales come in.</p>
      )}

      <div>
        <h3 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-4">Revenue, last 12 weeks (AUD)</h3>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={m.weeks} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="revenue" fill={FILL} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-4">Upcoming shipments, next 6 months</h3>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={m.months} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
              <Tooltip formatter={(v: number) => [v, "Shipments"]} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="count" fill={FILL} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs font-body text-muted-foreground">Your future fulfilment load — bundle bottles you've already been paid for.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
