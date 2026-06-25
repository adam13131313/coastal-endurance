import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  variant_label: string;
  quantity: number;
  unit_price_cents: number;
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
  status: string;
  total_cents: number;
  currency: string;
  shipping_name: string | null;
  shipping_address: Record<string, unknown> | null;
  order_items: OrderItem[];
  order_deliveries: Delivery[];
}

const ORDER_SELECT =
  "id, created_at, email, status, total_cents, currency, shipping_name, shipping_address, " +
  "order_items ( id, product_name, variant_label, quantity, unit_price_cents ), " +
  "order_deliveries ( id, sequence, scheduled_for, status, tracking_number )";

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const Admin = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<Record<string, string>>({});

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
      // SECURITY DEFINER rpc; cast until generated types include it.
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
    await supabase.from("orders").update({ status: "fulfilled", updated_at: new Date().toISOString() }).eq("id", id);
    loadOrders();
  };

  const markShipped = async (deliveryId: string) => {
    await supabase
      .from("order_deliveries")
      .update({ status: "shipped", shipped_at: new Date().toISOString(), tracking_number: tracking[deliveryId] || null })
      .eq("id", deliveryId);
    loadOrders();
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

  const statusClasses = (s: string) =>
    s === "fulfilled" ? "bg-foreground text-background" : "bg-muted text-muted-foreground";

  return (
    <main className="pt-24">
      <Helmet>
        <title>Orders — Admin</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="section-padding">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-typewriter uppercase">Orders</h1>
            <button onClick={loadOrders} className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="font-body text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((o) => (
                <div key={o.id} className="border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-body font-medium">{o.shipping_name || o.email}</p>
                      <p className="text-sm font-body text-muted-foreground">{o.email}</p>
                      <p className="text-xs font-body text-muted-foreground mt-1">{fmtDate(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-typewriter text-lg">{formatPrice(o.total_cents)} {o.currency}</p>
                      <span className={`inline-block mt-1 text-xs uppercase tracking-widest px-2 py-1 ${statusClasses(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1 text-sm font-body">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="text-muted-foreground">
                        {it.quantity} × {it.product_name} ({it.variant_label}) — {formatPrice(it.unit_price_cents * it.quantity)}
                      </li>
                    ))}
                  </ul>

                  {o.order_deliveries.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">Deliveries</p>
                      <div className="space-y-2">
                        {[...o.order_deliveries].sort((a, b) => a.sequence - b.sequence).map((d) => (
                          <div key={d.id} className="flex flex-wrap items-center gap-3 text-sm font-body">
                            <span className="w-28 shrink-0">Shipment {d.sequence}</span>
                            <span className="w-28 shrink-0 text-muted-foreground">{d.scheduled_for}</span>
                            <span className={`text-xs uppercase tracking-widest px-2 py-0.5 ${d.status === "shipped" || d.status === "delivered" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                              {d.status}
                            </span>
                            {d.status === "scheduled" ? (
                              <span className="flex items-center gap-2">
                                <input
                                  placeholder="tracking #"
                                  value={tracking[d.id] ?? ""}
                                  onChange={(e) => setTracking((t) => ({ ...t, [d.id]: e.target.value }))}
                                  className="px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground w-36"
                                />
                                <button onClick={() => markShipped(d.id)} className="btn-outline text-xs px-3 py-1">
                                  Mark shipped
                                </button>
                              </span>
                            ) : (
                              d.tracking_number && <span className="text-muted-foreground">#{d.tracking_number}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {o.status !== "fulfilled" && (
                    <div className="mt-4">
                      <button onClick={() => markFulfilled(o.id)} className="btn-primary text-xs px-4 py-2">
                        Mark order fulfilled
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Admin;
