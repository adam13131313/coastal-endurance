import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  sb, fmtDateTime, threadKey, messageWho,
  CHANNEL_LABEL, SOURCE_LABEL,
  type Contact, type CommsMessage,
} from "@/lib/crm";

// INBOX — everything that arrived on its own but couldn't be matched to a
// customer. Nothing is guessed onto the wrong person: an unrecognised sender
// waits here until a human says who it is.
//
// WhatsApp exports arrive as a batch of messages from one chat, so they're
// grouped by thread — filing the chat files every message in it at once.

const inputCls =
  "w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground";

interface Group {
  key: string;
  who: string;
  channel: string;
  source: string;
  messages: CommsMessage[];
  latest: string;
}

const CommsInbox = ({ onGo }: { onGo?: (tab: string) => void }) => {
  const [messages, setMessages] = useState<CommsMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [q, setQ] = useState<Record<string, string>>({});
  const [showIgnored, setShowIgnored] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [m, c] = await Promise.all([
      sb.from("comms_messages")
        .select("*")
        .in("status", ["unfiled", "ignored"])
        .order("occurred_at", { ascending: false })
        .limit(500),
      sb.from("contacts").select("*").order("created_at", { ascending: false }),
    ]);
    setMessages((m.data as CommsMessage[]) ?? []);
    setContacts((c.data as Contact[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const wanted = messages.filter((m) => (showIgnored ? m.status === "ignored" : m.status === "unfiled"));
    const map = new Map<string, Group>();
    for (const m of wanted) {
      const key = threadKey(m);
      const existing = map.get(key);
      if (existing) {
        existing.messages.push(m);
        if (m.occurred_at > existing.latest) existing.latest = m.occurred_at;
      } else {
        map.set(key, {
          key, who: messageWho(m), channel: m.channel, source: m.source,
          messages: [m], latest: m.occurred_at,
        });
      }
    }
    const out = [...map.values()];
    for (const g of out) g.messages.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
    return out.sort((a, b) => b.latest.localeCompare(a.latest));
  }, [messages, showIgnored]);

  // File every message in a thread against one contact.
  const fileGroup = async (g: Group, contactId: string) => {
    setBusy(g.key);
    for (const m of g.messages) {
      const { error } = await sb.rpc("file_comms_message", { p_message_id: m.id, p_contact_id: contactId });
      if (error) { setBusy(null); toast.error("Couldn't file that."); return; }
    }
    setBusy(null);
    setOpenKey(null);
    toast.success(`Filed ${g.messages.length} message${g.messages.length === 1 ? "" : "s"}.`);
    await load();
  };

  // Make a contact out of what the message itself tells us, then file to it.
  const createAndFile = async (g: Group) => {
    const first = g.messages[0];
    const raw = (first.raw ?? {}) as Record<string, unknown>;
    const email = first.direction === "in" ? first.from_addr : first.to_addr;
    const name = (typeof raw.correspondent_name === "string" && raw.correspondent_name)
      || (typeof raw.counterparty === "string" && raw.counterparty)
      || null;
    const phone = g.channel === "whatsapp" && typeof raw.counterparty === "string" && /\d/.test(raw.counterparty)
      ? raw.counterparty : null;

    if (!email && !phone) {
      toast.error("No email or phone in this message — open a customer and file it there.");
      return;
    }
    setBusy(g.key);
    // A WhatsApp-only contact still needs the email key the table is built on;
    // a placeholder keeps it findable and obviously incomplete until we know more.
    const contactEmail = (email ?? `whatsapp-${(phone ?? "").replace(/[^0-9]/g, "")}@unknown.local`).toLowerCase();
    const { data, error } = await sb.from("contacts")
      .insert({ email: contactEmail, name, phone, source: g.channel === "whatsapp" ? "whatsapp" : "inbound_email" })
      .select("id").single();

    if (error) {
      // Already exists (they were added between page load and this click) — use it.
      const { data: found } = await sb.from("contacts").select("id").eq("email", contactEmail).maybeSingle();
      if (!found) { setBusy(null); toast.error("Couldn't create that contact."); return; }
      setBusy(null);
      await fileGroup(g, (found as { id: string }).id);
      return;
    }
    setBusy(null);
    await fileGroup(g, (data as { id: string }).id);
  };

  const setStatus = async (g: Group, status: "ignored" | "unfiled") => {
    setBusy(g.key);
    const { error } = await sb.from("comms_messages")
      .update({ status }).in("id", g.messages.map((m) => m.id));
    setBusy(null);
    if (error) { toast.error("Couldn't update that."); return; }
    toast.success(status === "ignored" ? "Ignored." : "Back in the queue.");
    await load();
  };

  const matchesFor = (g: Group) => {
    const needle = (q[g.key] ?? "").trim().toLowerCase();
    if (!needle) return [];
    return contacts.filter((c) =>
      c.email.toLowerCase().includes(needle) || (c.name ?? "").toLowerCase().includes(needle)
    ).slice(0, 6);
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading the inbox…</p>;

  const unfiledCount = messages.filter((m) => m.status === "unfiled").length;
  const ignoredCount = messages.filter((m) => m.status === "ignored").length;

  return (
    <div className="max-w-[880px] space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-typewriter uppercase">Inbox</h2>
        <p className="text-sm font-body text-muted-foreground">
          {unfiledCount} to file{ignoredCount > 0 ? ` · ${ignoredCount} ignored` : ""}
        </p>
      </div>

      <p className="text-sm font-body text-muted-foreground max-w-[640px]">
        Messages forwarded to the CRM address that didn't match anyone in Customers.
        Say who each one is and it moves onto their timeline; ignore the rest.
      </p>

      {ignoredCount > 0 && (
        <button
          onClick={() => setShowIgnored(!showIgnored)}
          className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {showIgnored ? "← Back to the queue" : `Show ignored (${ignoredCount}) →`}
        </button>
      )}

      {groups.length === 0 ? (
        <p className="font-body text-muted-foreground">
          {showIgnored ? "Nothing ignored." : "Nothing waiting. ✓"}
        </p>
      ) : (
        <div className="border border-border divide-y divide-border">
          {groups.map((g) => {
            const open = openKey === g.key;
            const preview = g.messages[g.messages.length - 1];
            return (
              <div key={g.key}>
                <button
                  onClick={() => setOpenKey(open ? null : g.key)}
                  className="w-full text-left p-3 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[10px] font-typewriter uppercase tracking-widest bg-secondary px-1.5 py-0.5">
                      {CHANNEL_LABEL[g.channel] ?? g.channel}
                    </span>
                    <span className="font-body text-sm font-medium">{g.who}</span>
                    {g.messages.length > 1 && (
                      <span className="text-[10px] font-typewriter uppercase tracking-widest border border-border px-1.5 py-0.5">
                        {g.messages.length} messages
                      </span>
                    )}
                    <span className="ml-auto text-xs font-body text-muted-foreground">{fmtDateTime(g.latest)}</span>
                  </div>
                  {preview.subject && <p className="mt-1 text-sm font-body">{preview.subject}</p>}
                  <p className="mt-1 text-[13px] font-body text-muted-foreground line-clamp-2">{preview.body}</p>
                </button>

                {open && (
                  <div className="px-3 pb-4 space-y-3 bg-secondary/20">
                    {/* The messages themselves, oldest first. */}
                    <div className="border border-border divide-y divide-border bg-background max-h-80 overflow-y-auto">
                      {g.messages.map((m) => (
                        <div key={m.id} className="px-3 py-2 text-[13px] font-body">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-typewriter uppercase tracking-widest text-[10px]">
                              {m.direction === "in" ? "IN" : "OUT"}
                            </span>
                            <span>{fmtDateTime(m.occurred_at)}</span>
                            <span className="ml-auto">{SOURCE_LABEL[m.source] ?? m.source}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                          {m.attachments?.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {m.attachments.map((a) => a.filename).filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {showIgnored ? (
                      <button
                        onClick={() => setStatus(g, "unfiled")}
                        disabled={busy === g.key}
                        className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        Put back in the queue
                      </button>
                    ) : (
                      <>
                        <div>
                          <input
                            value={q[g.key] ?? ""}
                            onChange={(e) => setQ({ ...q, [g.key]: e.target.value })}
                            placeholder="Who is this? Search name or email…"
                            className={inputCls}
                          />
                          {matchesFor(g).length > 0 && (
                            <div className="border border-border divide-y divide-border mt-1 bg-background">
                              {matchesFor(g).map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => fileGroup(g, c.id)}
                                  disabled={busy === g.key}
                                  className="w-full text-left px-2 py-1.5 text-xs font-body hover:bg-secondary/50 disabled:opacity-50"
                                >
                                  {c.name || c.email}
                                  {c.name && <span className="text-muted-foreground"> · {c.email}</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => createAndFile(g)}
                            disabled={busy === g.key}
                            className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            {busy === g.key ? "…" : "New customer from this"}
                          </button>
                          <button
                            onClick={() => setStatus(g, "ignored")}
                            disabled={busy === g.key}
                            className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            Ignore
                          </button>
                          {onGo && (
                            <button
                              onClick={() => onGo("customers")}
                              className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground"
                            >
                              Open customers →
                            </button>
                          )}
                        </div>
                      </>
                    )}
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

export default CommsInbox;
