import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, Package, LogOut } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  preferred_currency: string | null;
}

interface OrderItemRow {
  product_name: string;
  variant_label: string;
  quantity: number;
  unit_price_cents: number;
}
interface DeliveryRow {
  sequence: number;
  scheduled_for: string;
  status: string;
  tracking_number: string | null;
}
interface Order {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  order_items: OrderItemRow[];
  order_deliveries: DeliveryRow[];
}

type Tab = "orders" | "profile";

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupaUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fieldTeam, setFieldTeam] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable profile fields
  const [formData, setFormData] = useState({
    display_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    preferred_currency: "AUD",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [profileRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).single(),
      supabase.from("orders").select("id, status, total_cents, currency, created_at, order_items ( product_name, variant_label, quantity, unit_price_cents ), order_deliveries ( sequence, scheduled_for, status, tracking_number )").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      setFormData({
        display_name: profileRes.data.display_name || "",
        phone: profileRes.data.phone || "",
        address_line1: profileRes.data.address_line1 || "",
        address_line2: profileRes.data.address_line2 || "",
        city: profileRes.data.city || "",
        state: profileRes.data.state || "",
        postal_code: profileRes.data.postal_code || "",
        country: profileRes.data.country || "",
        preferred_currency: profileRes.data.preferred_currency || "AUD",
      });
    }
    if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[]);
    setLoading(false);

    // Field team badge: are they on the list? (checks their own email)
    supabase.functions.invoke("field-team-status").then(({ data }) => {
      setFieldTeam(!!(data as { member?: boolean })?.member);
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: formData.display_name || null,
        phone: formData.phone || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postal_code || null,
        country: formData.country || null,
        preferred_currency: formData.preferred_currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
      fetchData();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "orders", label: "Orders", icon: <Package className="w-4 h-4" /> },
    { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <main className="pt-20">
        <section className="section-padding">
          <div className="container-narrow text-center text-muted-foreground">Loading...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-20">
      <section className="section-padding">
        <div className="container-narrow">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-display">{profile?.display_name || user?.email}</h1>
                  {fieldTeam && (
                    <span className="text-[10px] font-typewriter uppercase tracking-widest bg-foreground text-background px-2 py-0.5">
                      Field Team
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Address</label>
                <input
                  type="text"
                  placeholder="Line 1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                <input
                  type="text"
                  placeholder="Line 2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-5 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-AU", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </p>
                          <p className="font-medium mt-1">
                            ${(order.total_cents / 100).toFixed(2)} {order.currency}
                          </p>
                        </div>
                        <span className="text-xs uppercase tracking-widest px-3 py-1 bg-muted text-muted-foreground">
                          {order.status}
                        </span>
                      </div>

                      {order.order_items?.length > 0 && (
                        <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                          {order.order_items.map((it, i) => (
                            <li key={i}>{it.quantity} × {it.product_name} ({it.variant_label})</li>
                          ))}
                        </ul>
                      )}

                      {order.order_deliveries?.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Delivery schedule</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {[...order.order_deliveries].sort((a, b) => a.sequence - b.sequence).map((d, i) => (
                              <li key={i} className="flex justify-between gap-4">
                                <span>Bottle {d.sequence}: {d.scheduled_for}</span>
                                <span>
                                  {d.status === "shipped" || d.status === "delivered"
                                    ? (d.tracking_number ? `Shipped · #${d.tracking_number}` : "Shipped")
                                    : d.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </main>
  );
};

export default Account;
