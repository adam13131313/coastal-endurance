import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import { FT_STAGE_LABEL } from "@/lib/crm";

// The "Today" cockpit: every needs-action signal on one screen — dispatch queue,
// low stock, campaign pace, field-team follow-ups due, open staff notes — so
// running the day doesn't mean opening five tabs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface DashOrder {
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  order_items: { bottles_each: number; quantity: number }[];
  order_deliveries: { status: string; scheduled_for: string }[];
}

const CAMPAIGN = { targetBottles: 200, targetFieldTeam: 15, start: "2026-07-01", end: "2026-09-06" };
const LOW_STOCK_AT = 15;

interface FtRow {
  id: string; stage: string; status: string; stage_entered_at: string;
  contacts: { name: string | null; email: string };
}
interface ProductRow { id: string; name: string; stock_quantity: number; active: boolean }

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

// Stage-based follow-up rules: what's due, and when it becomes due.
function dueAction(r: FtRow): { action: string; overdue: boolean } | null {
  const d = daysSince(r.stage_entered_at);
  switch (r.stage) {
    case "prospect": return { action: "Send the invite", overdue: d >= 3 };
    case "invited": return d >= 4 ? { action: "No reply — nudge or mark lost", overdue: d >= 7 } : null;
    case "confirmed": return { action: "Issue their code", overdue: d >= 2 };
    case "code_sent": return d >= 5 ? { action: "Not redeemed — send a nudge", overdue: d >= 10 } : null;
    case "trialling": return d >= 21 ? { action: "Send the day-21 survey", overdue: d >= 28 } : d >= 5 ? { action: "Send the day-5 check-in", overdue: false } : null;
    case "feedback": return { action: "Send the content ask", overdue: d >= 7 };
    default: return null;
  }
}

const AdminCockpit = ({ orders, onGo }: { orders: DashOrder[]; onGo: (tab: string) => void }) => {
  const [ft, setFt] = useState<FtRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [openNotes, setOpenNotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [f, p, n] = await Promise.all([
      sb.from("contact_pipelines").select("id, stage, status, stage_entered_at, contacts(name, email)").eq("pipeline", "field_team").eq("status", "active"),
      sb.from("products").select("id, name, stock_quantity, active").eq("active", true),
      sb.from("staff_notes").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]);
    setFt((f.data as FtRow[]) ?? []);
    setProducts((p.data as ProductRow[]) ?? []);
    setOpenNotes(n.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const m = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const paidish = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");

    // Dispatch
    const scheduled = paidish.flatMap((o) => o.order_deliveries.filter((d) => d.status === "scheduled"));
    const overdueShipments = scheduled.filter((d) => d.scheduled_for < today).length;
    const dueThisWeek = scheduled.filter((d) => d.scheduled_for >= today && d.scheduled_for <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length;

    // Campaign pace
    const start = new Date(CAMPAIGN.start); const end = new Date(CAMPAIGN.end); const now = new Date();
    const inWindow = paidish.filter((o) => new Date(o.created_at) >= start);
    const bottles = inWindow.reduce((s, o) => s + o.order_items.reduce((t, it) => t + it.bottles_each * it.quantity, 0), 0);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
    const needPerDay = daysLeft > 0 ? Math.max(0, CAMPAIGN.targetBottles - bottles) / daysLeft : 0;

    // Last 7 days sales
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const lastWeek = paidish.filter((o) => new Date(o.created_at) >= weekAgo);
    const weekRevenue = lastWeek.reduce((s, o) => s + o.total_cents, 0);

    return { overdueShipments, dueThisWeek, bottles, daysLeft, needPerDay, weekOrders: lastWeek.length, weekRevenue };
  }, [orders]);

  const ftDue = useMemo(
    () => ft
      .map((r) => ({ r, due: dueAction(r) }))
      .filter((x): x is { r: FtRow; due: { action: string; overdue: boolean } } => x.due !== null)
      .sort((a, b) => Number(b.due.overdue) - Number(a.due.overdue)),
    [ft],
  );
  const ftConfirmed = ft.filter((r) => ["confirmed", "code_sent", "trialling", "feedback", "advocate"].includes(r.stage)).length;
  const lowStock = products.filter((p) => p.stock_quantity <= LOW_STOCK_AT);

  if (loading) return <p className="font-body text-muted-foreground">Loading…</p>;

  const nothingNeedsYou = m.overdueShipments === 0 && ftDue.length === 0 && lowStock.length === 0 && openNotes === 0;

  return (
    <div className="max-w-[880px] space-y-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-typewriter uppercase">Today</h2>
        <span className="text-xs font-body text-muted-foreground">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Campaign" value={`${m.bottles} / ${CAMPAIGN.targetBottles}`} sub={`${m.needPerDay.toFixed(1)}/day needed · ${m.daysLeft}d left`} onClick={() => onGo("campaign")} />
        <Stat label="Field team" value={`${ftConfirmed} / ${CAMPAIGN.targetFieldTeam}`} sub={`${ftDue.length} follow-up${ftDue.length === 1 ? "" : "s"} due`} onClick={() => onGo("field")} alert={ftDue.some((x) => x.due.overdue)} />
        <Stat label="To ship" value={`${m.overdueShipments + m.dueThisWeek}`} sub={m.overdueShipments ? `${m.overdueShipments} OVERDUE` : "next 7 days"} onClick={() => onGo("dispatch")} alert={m.overdueShipments > 0} />
        <Stat label="Last 7 days" value={`${m.weekOrders} orders`} sub={formatPrice(m.weekRevenue)} onClick={() => onGo("orders")} />
      </div>

      {nothingNeedsYou && (
        <p className="border border-border p-4 font-body text-muted-foreground">Nothing needs you right now. ✓</p>
      )}

      {/* Low stock */}
      {lowStock.length > 0 && (
        <section className="border border-destructive p-4">
          <h3 className="font-typewriter text-xs uppercase tracking-widest text-destructive mb-2">Low stock</h3>
          {lowStock.map((p) => (
            <p key={p.id} className="font-body text-sm">{p.name}: <span className="font-medium">{p.stock_quantity} left</span></p>
          ))}
          <button onClick={() => onGo("stock")} className="mt-2 text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">Open stock →</button>
        </section>
      )}

      {/* Needs you list */}
      {ftDue.length > 0 && (
        <section>
          <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">Field team — needs you</h3>
          <div className="border border-border divide-y divide-border">
            {ftDue.map(({ r, due }) => (
              <button key={r.id} onClick={() => onGo("field")} className="w-full text-left p-3 flex flex-wrap items-center gap-x-4 gap-y-1 hover:bg-secondary/40 transition-colors">
                <span className="font-body text-sm font-medium w-44 shrink-0 truncate">{r.contacts.name || r.contacts.email}</span>
                <span className="text-xs font-typewriter uppercase tracking-widest text-muted-foreground w-24 shrink-0">{FT_STAGE_LABEL[r.stage] ?? r.stage}</span>
                <span className={`text-sm font-body ${due.overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>{due.action}{due.overdue ? " · overdue" : ""}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Staff notes */}
      {openNotes > 0 && (
        <button onClick={() => onGo("board")} className="text-sm font-body text-muted-foreground hover:text-foreground">
          {openNotes} open note{openNotes === 1 ? "" : "s"} on the staff board →
        </button>
      )}
    </div>
  );
};

const Stat = ({ label, value, sub, onClick, alert }: { label: string; value: string; sub: string; onClick: () => void; alert?: boolean }) => (
  <button onClick={onClick} className={`text-left border p-3 transition-colors hover:border-foreground ${alert ? "border-destructive" : "border-border"}`}>
    <p className="font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-typewriter text-xl mt-0.5 tabular-nums">{value}</p>
    <p className={`text-xs font-body mt-0.5 ${alert ? "text-destructive font-medium" : "text-muted-foreground"}`}>{sub}</p>
  </button>
);

export default AdminCockpit;
