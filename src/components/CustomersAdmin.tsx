import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sb, fmtDate, fmtDateTime, type Contact, type ContactEvent } from "@/lib/crm";
import { formatPrice } from "@/lib/catalog";

// Customers: contacts (auto-populated from orders, field team, signups). Each is
// a page you can open, edit, and keep a full communications history on: emails,
// WhatsApp, calls and notes, all on one timeline. "Account" = they've created a
// login; "Guest" = ordered/added without one.
interface OrderLite { id: string; email: string; status: string; total_cents: number; currency: string; created_at: string }
interface CommsMessage {
  id: string; channel: string; direction: string; from_addr: string | null; to_addr: string | null;
  subject: string | null; body: string; occurred_at: string; created_by: string | null;
}

const inputCls = "w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground";
const CHANNELS = ["email", "whatsapp", "call", "sms", "other"];
const chLabel: Record<string, string> = { email: "Email", whatsapp: "WhatsApp", call: "Call", sms: "SMS", other: "Msg" };

const CustomersAdmin = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [msgsByContact, setMsgsByContact] = useState<Map<string, CommsMessage[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const [draft, setDraft] = useState<Partial<Contact> & { tagsText?: string } | null>(null);

  // Log-a-message form
  const [msg, setMsg] = useState({ channel: "email", direction: "in", subject: "", body: "", when: "" });
  const [assignQ, setAssignQ] = useState("");
  const [assignExtra, setAssignExtra] = useState<string[]>([]); // extra contact ids

  const load = useCallback(async () => {
    setLoading(true);
    const [c, o, e, m] = await Promise.all([
      sb.from("contacts").select("*").order("created_at", { ascending: false }),
      sb.from("orders").select("id, email, status, total_cents, currency, created_at").in("status", ["paid", "fulfilled", "refunded"]).order("created_at", { ascending: false }),
      sb.from("contact_events").select("*").order("created_at", { ascending: false }).limit(1000),
      sb.from("comms_message_contacts").select("contact_id, comms_messages(*)"),
    ]);
    setContacts((c.data as Contact[]) ?? []);
    setOrders((o.data as OrderLite[]) ?? []);
    setEvents((e.data as ContactEvent[]) ?? []);
    const mm = new Map<string, CommsMessage[]>();
    for (const row of (m.data as { contact_id: string; comms_messages: CommsMessage }[]) ?? []) {
      if (!row.comms_messages) continue;
      if (!mm.has(row.contact_id)) mm.set(row.contact_id, []);
      mm.get(row.contact_id)!.push(row.comms_messages);
    }
    setMsgsByContact(mm);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ordersByEmail = useMemo(() => {
    const map = new Map<string, OrderLite[]>();
    for (const o of orders) {
      const k = o.email.toLowerCase();
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(o);
    }
    return map;
  }, [orders]);

  const eventsByContact = useMemo(() => {
    const map = new Map<string, ContactEvent[]>();
    for (const e of events) {
      if (!map.has(e.contact_id)) map.set(e.contact_id, []);
      map.get(e.contact_id)!.push(e);
    }
    return map;
  }, [events]);

  const ltv = (c: Contact) =>
    (ordersByEmail.get(c.email.toLowerCase()) ?? []).filter((o) => o.status !== "refunded").reduce((s, o) => s + o.total_cents, 0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((c) => c.email.toLowerCase().includes(needle) || (c.name ?? "").toLowerCase().includes(needle) || (c.source ?? "").toLowerCase().includes(needle));
  }, [contacts, q]);

  const openCustomer = (c: Contact) => {
    setViewingId(c.id);
    setDraft({ ...c, tagsText: (c.tags ?? []).join(", ") });
    setNoteDraft("");
    setMsg({ channel: "email", direction: "in", subject: "", body: "", when: "" });
    setAssignExtra([]); setAssignQ("");
  };

  const saveDetails = async () => {
    if (!draft || !viewingId) return;
    if (!draft.email?.trim() || !draft.email.includes("@")) { toast.error("A valid email is required."); return; }
    setBusy(true);
    const { error } = await sb.from("contacts").update({
      name: draft.name?.trim() || null, email: draft.email.trim(), phone: draft.phone?.trim() || null,
      source: draft.source?.trim() || null, country: draft.country?.trim() || null,
      preferred_currency: draft.preferred_currency || "AUD", marketing_consent: !!draft.marketing_consent,
      tags: (draft.tagsText ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      notes: draft.notes?.trim() || null, updated_at: new Date().toISOString(),
    }).eq("id", viewingId);
    setBusy(false);
    if (error) { toast.error(String(error.message).includes("duplicate") ? "That email belongs to another contact." : "Couldn't save."); return; }
    toast.success("Saved."); await load();
  };

  const addNote = async () => {
    if (!viewingId || !noteDraft.trim()) return;
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await sb.from("contact_events").insert({ contact_id: viewingId, type: "note", note: noteDraft.trim(), meta: {}, actor: userData?.user?.email ?? "admin" });
    setBusy(false);
    if (error) { toast.error("Couldn't add the note."); return; }
    setNoteDraft(""); toast.success("Note added."); await load();
  };

  const saveMessage = async () => {
    if (!viewingId || !msg.body.trim()) { toast.error("Add the message text."); return; }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: created, error } = await sb.from("comms_messages").insert({
      channel: msg.channel, direction: msg.direction,
      subject: msg.subject.trim() || null, body: msg.body.trim(),
      occurred_at: msg.when ? new Date(msg.when).toISOString() : new Date().toISOString(),
      created_by: userData?.user?.email ?? "admin",
    }).select("id").single();
    if (error || !created) { setBusy(false); toast.error("Couldn't save the message."); return; }
    const ids = [...new Set([viewingId, ...assignExtra])];
    const { error: linkErr } = await sb.from("comms_message_contacts").insert(ids.map((cid) => ({ message_id: (created as { id: string }).id, contact_id: cid })));
    setBusy(false);
    if (linkErr) { toast.error("Saved, but assigning failed."); }
    else toast.success(`Logged${ids.length > 1 ? ` and assigned to ${ids.length} customers` : ""}.`);
    setMsg({ channel: "email", direction: "in", subject: "", body: "", when: "" });
    setAssignExtra([]); setAssignQ("");
    await load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading customers…</p>;

  const buyers = contacts.filter((c) => (ordersByEmail.get(c.email.toLowerCase()) ?? []).some((o) => o.status !== "refunded")).length;
  const members = contacts.filter((c) => c.user_id).length;

  // -------------------------------------------------------------- detail page
  if (viewingId && draft) {
    const c = contacts.find((x) => x.id === viewingId);
    const co = c ? ordersByEmail.get(c.email.toLowerCase()) ?? [] : [];
    const hasAccount = !!c?.user_id;

    // Merge events + messages into one timeline (newest first).
    type Item = { at: number; render: JSX.Element; key: string };
    const items: Item[] = [];
    for (const e of eventsByContact.get(viewingId) ?? []) {
      items.push({ at: new Date(e.created_at).getTime(), key: `e-${e.id}`, render: (
        <div className="px-3 py-2 text-xs font-body">
          <span className="text-foreground">{e.note || e.type.replace(/_/g, " ")}</span>
          <span className="text-muted-foreground"> · {fmtDateTime(e.created_at)}{e.actor ? ` · ${e.actor}` : ""}</span>
        </div>
      ) });
    }
    for (const m of msgsByContact.get(viewingId) ?? []) {
      items.push({ at: new Date(m.occurred_at).getTime(), key: `m-${m.id}`, render: (
        <div className="px-3 py-2 text-sm font-body">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-typewriter uppercase tracking-widest bg-secondary px-1.5 py-0.5">{chLabel[m.channel] ?? m.channel} {m.direction === "in" ? "IN" : "OUT"}</span>
            {m.subject && <span className="font-medium">{m.subject}</span>}
            <span className="text-xs text-muted-foreground ml-auto">{fmtDateTime(m.occurred_at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-[13px]">{m.body}</p>
        </div>
      ) });
    }
    items.sort((a, b) => b.at - a.at);

    const assignMatches = assignQ.trim()
      ? contacts.filter((x) => x.id !== viewingId && !assignExtra.includes(x.id) &&
          (x.email.toLowerCase().includes(assignQ.toLowerCase()) || (x.name ?? "").toLowerCase().includes(assignQ.toLowerCase()))).slice(0, 5)
      : [];

    return (
      <div className="max-w-[760px] space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setViewingId(null); setDraft(null); }} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">← All customers</button>
          <span className={`text-[10px] font-typewriter uppercase tracking-widest px-2 py-0.5 ${hasAccount ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}>{hasAccount ? "Account" : "Guest"}</span>
        </div>

        <div>
          <h2 className="text-2xl font-typewriter uppercase">{draft.name || draft.email}</h2>
          <p className="mt-1 text-sm font-body text-muted-foreground">
            Added {c ? fmtDate(c.created_at) : "—"}
            {co.length > 0 ? ` · ${co.length} order${co.length === 1 ? "" : "s"} · ${formatPrice(ltv(c as Contact))} lifetime` : " · no orders"}
          </p>
        </div>

        {/* Editable details */}
        <div className="border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <L label="Name"><input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} /></L>
          <L label="Email"><input value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputCls} /></L>
          <L label="Phone"><input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputCls} /></L>
          <L label="Source / how you know them"><input value={draft.source ?? ""} onChange={(e) => setDraft({ ...draft, source: e.target.value })} className={inputCls} /></L>
          <L label="Country"><input value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className={inputCls} /></L>
          <L label="Preferred currency">
            <select value={draft.preferred_currency ?? "AUD"} onChange={(e) => setDraft({ ...draft, preferred_currency: e.target.value })} className={inputCls}>
              <option value="AUD">AUD</option><option value="GBP">GBP</option><option value="USD">USD</option>
            </select>
          </L>
          <L label="Tags (comma-separated)"><input value={draft.tagsText ?? ""} onChange={(e) => setDraft({ ...draft, tagsText: e.target.value })} className={inputCls} placeholder="advisor, vip…" /></L>
          <label className="flex items-center gap-2 text-sm font-body md:pt-6">
            <input type="checkbox" checked={!!draft.marketing_consent} onChange={(e) => setDraft({ ...draft, marketing_consent: e.target.checked })} /> Marketing consent
          </label>
          <div className="md:col-span-2">
            <L label="Standing notes (about this customer)"><textarea value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={3} className={inputCls} /></L>
          </div>
          <div className="md:col-span-2"><button onClick={saveDetails} disabled={busy} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy ? "…" : "Save details"}</button></div>
        </div>

        {/* Log a message */}
        <div className="border border-border p-4 space-y-2">
          <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">Log a message</p>
          <div className="flex flex-wrap gap-2">
            <select value={msg.channel} onChange={(e) => setMsg({ ...msg, channel: e.target.value })} className={`${inputCls} w-32`}>
              {CHANNELS.map((ch) => <option key={ch} value={ch}>{chLabel[ch]}</option>)}
            </select>
            <select value={msg.direction} onChange={(e) => setMsg({ ...msg, direction: e.target.value })} className={`${inputCls} w-40`}>
              <option value="in">Received (in)</option><option value="out">Sent (out)</option>
            </select>
            <input type="datetime-local" value={msg.when} onChange={(e) => setMsg({ ...msg, when: e.target.value })} className={`${inputCls} w-56`} title="When (blank = now)" />
          </div>
          {msg.channel === "email" && <input value={msg.subject} onChange={(e) => setMsg({ ...msg, subject: e.target.value })} placeholder="Subject (optional)" className={inputCls} />}
          <textarea value={msg.body} onChange={(e) => setMsg({ ...msg, body: e.target.value })} rows={4} placeholder="Paste the message, or type what was said…" className={inputCls} />
          {/* Multi-assign */}
          <div>
            <input value={assignQ} onChange={(e) => setAssignQ(e.target.value)} placeholder="Also assign to another customer (search name/email)…" className={inputCls} />
            {assignMatches.length > 0 && (
              <div className="border border-border divide-y divide-border mt-1">
                {assignMatches.map((x) => (
                  <button key={x.id} onClick={() => { setAssignExtra([...assignExtra, x.id]); setAssignQ(""); }} className="w-full text-left px-2 py-1.5 text-xs font-body hover:bg-secondary/50">{x.name || x.email} <span className="text-muted-foreground">{x.name ? x.email : ""}</span></button>
                ))}
              </div>
            )}
            {assignExtra.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {assignExtra.map((id) => {
                  const x = contacts.find((z) => z.id === id);
                  return <span key={id} className="text-[11px] font-body border border-border px-1.5 py-0.5">{x?.name || x?.email}<button onClick={() => setAssignExtra(assignExtra.filter((z) => z !== id))} className="ml-1 text-muted-foreground hover:text-destructive">×</button></span>;
                })}
              </div>
            )}
          </div>
          <button onClick={saveMessage} disabled={busy || !msg.body.trim()} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy ? "…" : "Log message"}</button>
        </div>

        {/* Quick note */}
        <div className="border border-border p-4">
          <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Quick note to the timeline</p>
          <div className="flex flex-wrap gap-2">
            <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="A quick internal note…" className={`${inputCls} flex-1 min-w-[220px]`} />
            <button onClick={addNote} disabled={busy || !noteDraft.trim()} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">Add note</button>
          </div>
        </div>

        {/* Orders */}
        {co.length > 0 && (
          <div>
            <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Orders</p>
            <div className="border border-border divide-y divide-border">
              {co.map((o) => <p key={o.id} className="px-3 py-2 text-sm font-body flex justify-between"><span>{fmtDate(o.created_at)}</span><span className="tabular-nums">{formatPrice(o.total_cents)} {o.currency} · {o.status}</span></p>)}
            </div>
          </div>
        )}

        {/* Unified timeline */}
        <div>
          <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Communications & activity</p>
          {items.length === 0 ? <p className="text-sm font-body text-muted-foreground">Nothing yet.</p> : (
            <div className="border border-border divide-y divide-border">{items.map((it) => <div key={it.key}>{it.render}</div>)}</div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------- list
  return (
    <div className="max-w-[880px] space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-typewriter uppercase">Customers</h2>
        <p className="text-sm font-body text-muted-foreground">{contacts.length} contacts · {buyers} with orders · {members} with accounts</p>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, source…" className="w-full max-w-md px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
      {filtered.length === 0 ? (
        <p className="font-body text-muted-foreground">{contacts.length === 0 ? "No contacts yet — they appear automatically from orders, the field team, and signups." : "No match."}</p>
      ) : (
        <div className="border border-border divide-y divide-border">
          {filtered.map((c) => {
            const co = ordersByEmail.get(c.email.toLowerCase()) ?? [];
            const value = ltv(c);
            return (
              <button key={c.id} onClick={() => openCustomer(c)} className="w-full text-left p-3 flex flex-wrap items-center gap-x-3 gap-y-1 hover:bg-secondary/40 transition-colors">
                <span className="font-body text-sm font-medium w-52 shrink-0 truncate">{c.name || c.email}</span>
                <span className="text-xs font-body text-muted-foreground w-52 shrink-0 truncate">{c.name ? c.email : ""}</span>
                <span className={`text-[10px] font-typewriter uppercase tracking-widest px-1.5 py-0.5 ${c.user_id ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}>{c.user_id ? "Account" : "Guest"}</span>
                {c.source && <span className="text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{c.source}</span>}
                <span className="ml-auto text-sm font-body tabular-nums">{co.length > 0 ? `${co.length} order${co.length === 1 ? "" : "s"} · ${formatPrice(value)}` : "—"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm"><span className="block font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>{children}</label>
);

export default CustomersAdmin;
