import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AdminGuide from "@/components/AdminGuide";
import AdminDashboard from "@/components/AdminDashboard";
import PlanTracker from "@/components/PlanTracker";
import PipelineTracker from "@/components/PipelineTracker";
import ContentGenerator from "@/components/ContentGenerator";
import FieldTeamAdmin from "@/components/FieldTeamAdmin";
import SocialGuide from "@/components/SocialGuide";
import StaffBoard from "@/components/StaffBoard";
import StaffAssistant from "@/components/StaffAssistant";
import BrandGuide from "@/components/BrandGuide";
import ProductionAdmin from "@/components/ProductionAdmin";

interface OrderItem {
  id: string;
  product_name: string;
  variant_label: string;
  quantity: number;
  unit_price_cents: number;
  bottles_each: number;
}
interface Delivery {
  id: string;
  sequence: number;
  scheduled_for: string;
  status: string;
  tracking_number: string | null;
}
interface Order {
  id: string;
  created_at: string;
  email: string;
  phone: string | null;
  status: string;
  total_cents: number;
  currency: string;
  fulfillment_method: string | null;
  shipping_name: string | null;
  shipping_address: Record<string, unknown> | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  heard_about: string | null;
  order_items: OrderItem[];
  order_deliveries: Delivery[];
}

// `*` (rather than naming columns) keeps `phone` working before the generated
// types include it; we cast the result to our own Order shape below.
const ORDER_SELECT =
  "*, order_items ( id, product_name, variant_label, quantity, unit_price_cents, bottles_each ), " +
  "order_deliveries ( id, sequence, scheduled_for, status, tracking_number )";

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatAddress(a: Record<string, unknown> | null): string {
  if (!a) return "No address on file";
  const parts = ["line1", "line2", "city", "state", "postal_code", "country"]
    .map((k) => a[k])
    .filter((v) => typeof v === "string" && v.length > 0);
  return parts.join(", ");
}

// Grouped admin navigation (replaces the flat row of tabs).
const NAV_GROUPS = [
  { group: "Store", keys: ["overview", "dispatch", "orders", "field"] },
  { group: "Marketing", keys: ["plan", "pipeline", "content", "social"] },
  { group: "Production", keys: ["production"] },
  { group: "Team", keys: ["board", "assistant", "guide", "brand"] },
] as const;

const TAB_LABEL: Record<string, string> = {
  overview: "Overview", plan: "Plan", pipeline: "Pipeline", content: "Content",
  social: "Social", dispatch: "To ship", orders: "Orders", field: "Field team",
  production: "Production", board: "Staff board", assistant: "Assistant", guide: "Staff guide", brand: "Brand",
};

const Admin = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "plan" | "pipeline" | "content" | "social" | "dispatch" | "orders" | "field" | "production" | "board" | "assistant" | "guide" | "brand">("overview");
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [heard, setHeard] = useState<Record<string, string>>({});

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false });
    if (error) console.error("load orders failed", error);
    setOrders(((data as unknown) as Order[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: isAdmin } = await (supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: boolean | null }>;
      }).rpc("is_admin");
      if (!isAdmin) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      await loadOrders();
    })();
  }, [navigate, loadOrders]);

  const markFulfilled = async (id: string) => {
    setBusy(id);
    await supabase.from("orders").update({ status: "fulfilled", updated_at: new Date().toISOString() }).eq("id", id);
    await loadOrders();
    setBusy(null);
  };

  const shipDelivery = async (deliveryId: string) => {
    setBusy(deliveryId);
    const { data, error } = await supabase.functions.invoke("ship-delivery", {
      body: { deliveryId, trackingNumber: tracking[deliveryId] || "" },
    });
    if (error || (data as { error?: string })?.error) {
      toast.error("Couldn't mark shipped. Try again.");
    } else {
      toast.success("Marked shipped, customer emailed.");
    }
    await loadOrders();
    setBusy(null);
  };

  const rescheduleDelivery = async (deliveryId: string, current: string) => {
    const next = dates[deliveryId] ?? current;
    if (!next || next === current) return;
    setBusy(deliveryId);
    const { data, error } = await supabase.functions.invoke("reschedule-delivery", {
      body: { deliveryId, scheduledFor: next },
    });
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error || "Couldn't change the date.");
    } else {
      toast.success("Delivery date updated.");
    }
    await loadOrders();
    setBusy(null);
  };

  const saveHeard = async (id: string) => {
    setBusy(id);
    await supabase.from("orders").update({ heard_about: (heard[id] ?? "").trim() || null } as never).eq("id", id);
    await loadOrders();
    setBusy(null);
    toast.success("Saved.");
  };

  if (authorized === null || (authorized && loading)) {
    return (
      <main className="pt-24 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (authorized === false) {
    return (
      <main className="pt-24">
        <section className="section-padding">
          <div className="container-narrow text-center">
            <h1 className="text-3xl font-typewriter uppercase">Not authorised</h1>
            <p className="mt-4 font-body text-muted-foreground">This area is for store admins only.</p>
          </div>
        </section>
      </main>
    );
  }

  const today = todayISO();

  // Flatten every still-scheduled shipment across all orders, soonest first.
  const dispatch = orders
    .flatMap((o) => o.order_deliveries.filter((d) => d.status === "scheduled").map((d) => ({ d, o })))
    .sort((a, b) => a.d.scheduled_for.localeCompare(b.d.scheduled_for));

  const TrackShip = ({ id }: { id: string }) => (
    <span className="flex items-center gap-2">
      <input
        placeholder="tracking #"
        value={tracking[id] ?? ""}
        onChange={(e) => setTracking((t) => ({ ...t, [id]: e.target.value }))}
        className="px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground w-36"
      />
      <button onClick={() => shipDelivery(id)} disabled={busy === id} className="btn-outline text-xs px-3 py-1 disabled:opacity-50">
        {busy === id ? "…" : "Mark shipped"}
      </button>
    </span>
  );

  // Move a not-yet-shipped delivery to a new date (customer asked; staff actions it).
  const Reschedule = ({ id, current }: { id: string; current: string }) => (
    <span className="flex items-center gap-2">
      <input
        type="date"
        value={dates[id] ?? current}
        onChange={(e) => setDates((d) => ({ ...d, [id]: e.target.value }))}
        className="px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
      />
      <button
        onClick={() => rescheduleDelivery(id, current)}
        disabled={busy === id || (dates[id] ?? current) === current}
        className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        Save date
      </button>
    </span>
  );

  return (
    <main className="pt-24">
      <Helmet>
        <title>Orders — Admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="section-padding">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-typewriter uppercase">Admin</h1>
            <button onClick={loadOrders} className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Refresh
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            <aside className="md:w-48 md:shrink-0">
              <nav className="flex md:flex-col gap-x-2 gap-y-6 overflow-x-auto md:overflow-visible pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-border md:pr-6">
                {NAV_GROUPS.map((section) => (
                  <div key={section.group} className="shrink-0">
                    <p className="hidden md:block font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{section.group}</p>
                    <div className="flex md:flex-col gap-1">
                      {section.keys.map((k) => {
                        const label = k === "dispatch" ? `To ship (${dispatch.length})` : k === "orders" ? `Orders (${orders.length})` : TAB_LABEL[k];
                        return (
                          <button
                            key={k}
                            onClick={() => setTab(k)}
                            className={`text-left whitespace-nowrap px-3 py-1.5 text-sm font-typewriter uppercase tracking-wider transition-colors ${
                              tab === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0">

          {tab === "overview" && <AdminDashboard orders={orders} />}

          {tab === "plan" && <PlanTracker orders={orders} />}

          {tab === "pipeline" && <PipelineTracker orders={orders} />}

          {tab === "content" && <ContentGenerator />}

          {tab === "field" && <FieldTeamAdmin />}

          {tab === "production" && <ProductionAdmin />}

          {tab === "dispatch" && (
            dispatch.length === 0 ? (
              <p className="font-body text-muted-foreground">Nothing scheduled to ship. ✓</p>
            ) : (
              <div className="space-y-4">
                {dispatch.map(({ d, o }) => {
                  const overdue = d.scheduled_for < today;
                  return (
                    <div key={d.id} className={`border p-4 ${overdue ? "border-foreground" : "border-border"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-body font-medium">
                            {o.shipping_name || o.email}
                            <span className="ml-2 text-xs font-typewriter uppercase tracking-widest text-muted-foreground">
                              Shipment {d.sequence}
                            </span>
                          </p>
                          <p className="text-sm font-body text-muted-foreground mt-1">{formatAddress(o.shipping_address)}</p>
                          <p className="text-xs font-body text-muted-foreground mt-0.5">
                            {o.email}{o.phone ? ` · ${o.phone}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-body ${overdue ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {overdue ? "OVERDUE · " : ""}{d.scheduled_for}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <Reschedule id={d.id} current={d.scheduled_for} />
                        <TrackShip id={d.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === "orders" && (
            orders.length === 0 ? (
              <p className="font-body text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="space-y-6">
                {orders.map((o) => (
                  <div key={o.id} className="border border-border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-medium">
                          {o.shipping_name || o.email}
                          {o.fulfillment_method === "pickup" && (
                            <span className="ml-2 text-[10px] font-typewriter uppercase tracking-widest bg-foreground text-background px-1.5 py-0.5">Collect in person</span>
                          )}
                        </p>
                        <p className="text-sm font-body text-muted-foreground">
                          {o.fulfillment_method === "pickup" ? "Pickup — customer will contact you to arrange collection." : formatAddress(o.shipping_address)}
                        </p>
                        <p className="text-xs font-body text-muted-foreground mt-1">
                          {o.email}{o.phone ? ` · ${o.phone}` : ""} · {fmtDate(o.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-typewriter text-lg">{formatPrice(o.total_cents)} {o.currency}</p>
                        <span className={`inline-block mt-1 text-xs uppercase tracking-widest px-2 py-1 ${o.status === "fulfilled" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-1 text-sm font-body text-muted-foreground">
                      {o.order_items.map((it) => (
                        <li key={it.id}>
                          {it.quantity} × {it.product_name} ({it.variant_label}), {formatPrice(it.unit_price_cents * it.quantity)}
                        </li>
                      ))}
                    </ul>

                    {(o.utm_source || o.referrer) && (
                      <p className="mt-3 text-xs font-body text-muted-foreground">
                        {o.utm_source ? `Source: ${o.utm_source}${o.utm_medium ? ` / ${o.utm_medium}` : ""}${o.utm_campaign ? ` / ${o.utm_campaign}` : ""}` : ""}
                        {o.utm_source && o.referrer ? " · " : ""}
                        {o.referrer ? `Referrer: ${o.referrer}` : ""}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-typewriter uppercase tracking-widest text-muted-foreground shrink-0">How they heard</span>
                      <input
                        value={heard[o.id] ?? o.heard_about ?? ""}
                        onChange={(e) => setHeard((h) => ({ ...h, [o.id]: e.target.value }))}
                        placeholder="e.g. word of mouth, Instagram, a mate"
                        className="flex-1 px-2 py-1 border border-border bg-background text-sm font-body rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                      />
                      <button onClick={() => saveHeard(o.id)} disabled={busy === o.id} className="btn-outline text-xs px-3 py-1 disabled:opacity-50">Save</button>
                    </div>

                    {o.order_deliveries.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">Deliveries</p>
                        <div className="space-y-2">
                          {[...o.order_deliveries].sort((a, b) => a.sequence - b.sequence).map((d) => (
                            <div key={d.id} className="flex flex-wrap items-center gap-3 text-sm font-body">
                              <span className="w-24 shrink-0">Shipment {d.sequence}</span>
                              <span className="w-24 shrink-0 text-muted-foreground">{d.scheduled_for}</span>
                              <span className={`text-xs uppercase tracking-widest px-2 py-0.5 ${d.status === "shipped" || d.status === "delivered" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                                {d.status}
                              </span>
                              {d.status === "scheduled" ? <TrackShip id={d.id} /> : d.tracking_number && <span className="text-muted-foreground">#{d.tracking_number}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {o.status !== "fulfilled" && (
                      <div className="mt-4">
                        <button onClick={() => markFulfilled(o.id)} disabled={busy === o.id} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
                          {busy === o.id ? "…" : "Mark order fulfilled"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "board" && <StaffBoard />}

          {tab === "assistant" && <StaffAssistant />}

          {tab === "guide" && <AdminGuide />}

          {tab === "brand" && <BrandGuide />}

          {tab === "social" && <SocialGuide />}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Admin;
