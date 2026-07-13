import { useCallback, useEffect, useMemo, useState } from "react";
import { sb, fmtDate, fmtDateTime, type Contact, type ContactEvent } from "@/lib/crm";
import { formatPrice } from "@/lib/catalog";

// Customers: the contacts list (auto-populated from orders + field team + signups),
// searchable, with per-contact order history / LTV and the activity timeline.
interface OrderLite { id: string; email: string; status: string; total_cents: number; currency: string; created_at: string }

const CustomersAdmin = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, o, e] = await Promise.all([
      sb.from("contacts").select("*").order("created_at", { ascending: false }),
      sb.from("orders").select("id, email, status, total_cents, currency, created_at").in("status", ["paid", "fulfilled", "refunded"]).order("created_at", { ascending: false }),
      sb.from("contact_events").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setContacts((c.data as Contact[]) ?? []);
    setOrders((o.data as OrderLite[]) ?? []);
    setEvents((e.data as ContactEvent[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ordersByEmail = useMemo(() => {
    const m = new Map<string, OrderLite[]>();
    for (const o of orders) {
      const k = o.email.toLowerCase();
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(o);
    }
    return m;
  }, [orders]);

  const eventsByContact = useMemo(() => {
    const m = new Map<string, ContactEvent[]>();
    for (const e of events) {
      if (!m.has(e.contact_id)) m.set(e.contact_id, []);
      m.get(e.contact_id)!.push(e);
    }
    return m;
  }, [events]);

  const ltv = (c: Contact) =>
    (ordersByEmail.get(c.email) ?? []).filter((o) => o.status !== "refunded").reduce((s, o) => s + o.total_cents, 0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((c) => c.email.includes(needle) || (c.name ?? "").toLowerCase().includes(needle) || (c.source ?? "").includes(needle));
  }, [contacts, q]);

  if (loading) return <p className="font-body text-muted-foreground">Loading customers…</p>;

  const buyers = contacts.filter((c) => (ordersByEmail.get(c.email) ?? []).some((o) => o.status !== "refunded")).length;

  return (
    <div className="max-w-[880px] space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-typewriter uppercase">Customers</h2>
        <p className="text-sm font-body text-muted-foreground">{contacts.length} contact{contacts.length === 1 ? "" : "s"} · {buyers} with orders</p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name, email, source…"
        className="w-full max-w-md px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
      />

      {filtered.length === 0 ? (
        <p className="font-body text-muted-foreground">
          {contacts.length === 0 ? "No contacts yet — they appear automatically from orders, the field team, and signups." : "No match."}
        </p>
      ) : (
        <div className="border border-border divide-y divide-border">
          {filtered.map((c) => {
            const co = ordersByEmail.get(c.email) ?? [];
            const value = ltv(c);
            const open = expanded === c.id;
            const ev = eventsByContact.get(c.id) ?? [];
            return (
              <div key={c.id}>
                <button onClick={() => setExpanded(open ? null : c.id)} className="w-full text-left p-3 flex flex-wrap items-center gap-x-4 gap-y-1 hover:bg-secondary/40 transition-colors">
                  <span className="font-body text-sm font-medium w-56 shrink-0 truncate">{c.name || c.email}</span>
                  <span className="text-xs font-body text-muted-foreground w-56 shrink-0 truncate">{c.name ? c.email : ""}</span>
                  <span className="text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{c.source ?? "—"}</span>
                  {c.country && <span className="text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{c.country}</span>}
                  <span className="ml-auto text-sm font-body tabular-nums">{co.length > 0 ? `${co.length} order${co.length === 1 ? "" : "s"} · ${formatPrice(value)}` : "—"}</span>
                </button>
                {open && (
                  <div className="px-3 pb-4 pt-1 space-y-3 bg-secondary/20">
                    <p className="text-xs font-body text-muted-foreground">
                      Added {fmtDate(c.created_at)} · currency {c.preferred_currency} · marketing consent: {c.marketing_consent ? "yes" : "no"}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                    {co.length > 0 && (
                      <div>
                        <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Orders</p>
                        {co.map((o) => (
                          <p key={o.id} className="text-sm font-body">
                            {fmtDate(o.created_at)} · {formatPrice(o.total_cents)} {o.currency} · {o.status}
                          </p>
                        ))}
                      </div>
                    )}
                    {ev.length > 0 && (
                      <div>
                        <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Activity</p>
                        <ul className="space-y-0.5">
                          {ev.slice(0, 10).map((e) => (
                            <li key={e.id} className="text-xs font-body text-muted-foreground">
                              <span className="text-foreground">{e.note || e.type.replace(/_/g, " ")}</span> · {fmtDateTime(e.created_at)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.notes && <p className="text-xs font-body text-muted-foreground">Notes: {c.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomersAdmin;
