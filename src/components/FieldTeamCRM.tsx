import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  sb, FT_STAGES, FT_STAGE_LABEL, CONFIRMED_STAGES, LOST_REASONS, interpolate, fmtDate, fmtDateTime,
  type FieldTeamRow, type ContactEvent, type EmailTemplate,
} from "@/lib/crm";
import CommsLibrary from "@/components/CommsLibrary";

const TARGET = 15;

const FieldTeamCRM = () => {
  const [rows, setRows] = useState<FieldTeamRow[]>([]);
  const [events, setEvents] = useState<Record<string, ContactEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", source: "" });
  const [compose, setCompose] = useState<{ row: FieldTeamRow; tpl: EmailTemplate; subject: string; body: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: tpls } = await sb.from("email_templates").select("*").eq("active", true).order("sort", { ascending: true });
    setTemplates((tpls as EmailTemplate[]) ?? []);
    const { data } = await sb
      .from("contact_pipelines")
      .select("*, contacts(*)")
      .eq("pipeline", "field_team")
      .order("created_at", { ascending: true });
    const list = (data as FieldTeamRow[]) ?? [];
    setRows(list);
    const ids = list.map((r) => r.contact_id);
    if (ids.length) {
      const { data: ev } = await sb.from("contact_events").select("*").in("contact_id", ids).order("created_at", { ascending: false });
      const byContact: Record<string, ContactEvent[]> = {};
      for (const e of (ev as ContactEvent[]) ?? []) (byContact[e.contact_id] ??= []).push(e);
      setEvents(byContact);
    } else {
      setEvents({});
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const adminEmail = useCallback(async () => (await supabase.auth.getSession()).data.session?.user?.email ?? "admin", []);

  const logEvent = useCallback(async (contactId: string, type: string, note: string | null, meta: Record<string, unknown> = {}) => {
    await sb.from("contact_events").insert({ contact_id: contactId, type, note, meta, actor: await adminEmail() });
  }, [adminEmail]);

  const active = useMemo(() => rows.filter((r) => r.status === "active"), [rows]);
  const lost = useMemo(() => rows.filter((r) => r.status === "lost"), [rows]);
  const confirmedCount = active.filter((r) => CONFIRMED_STAGES.has(r.stage)).length;
  const byStage = useCallback((stage: string) => active.filter((r) => r.stage === stage), [active]);

  const addProspect = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@")) { toast.error("Enter a valid email."); return; }
    setBusy("add");
    try {
      const { data: contact, error: cErr } = await sb
        .from("contacts")
        .upsert({ email, name: form.name.trim() || null, source: "field_team" }, { onConflict: "email" })
        .select("id")
        .maybeSingle();
      if (cErr || !contact) throw cErr || new Error("no contact");
      const { error: pErr } = await sb.from("contact_pipelines").insert({ contact_id: contact.id, pipeline: "field_team", stage: "prospect" });
      if (pErr && !String(pErr.message).includes("duplicate")) throw pErr;
      await logEvent(contact.id, "note", `Added as prospect${form.source ? ` (${form.source.trim()})` : ""}`, {});
      toast.success("Prospect added.");
      setForm({ name: "", email: "", source: "" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that.");
    } finally {
      setBusy(null);
    }
  };

  const setStage = async (row: FieldTeamRow, stage: string) => {
    if (stage === row.stage) return;
    setBusy(row.id);
    await sb.from("contact_pipelines").update({ stage, status: "active", stage_entered_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
    await logEvent(row.contact_id, "stage_change", `→ ${FT_STAGE_LABEL[stage] ?? stage}`, {});
    setBusy(null);
    load();
  };

  const markLost = async (row: FieldTeamRow, reason: string) => {
    setBusy(row.id);
    await sb.from("contact_pipelines").update({ status: "lost", lost_reason: reason, updated_at: new Date().toISOString() }).eq("id", row.id);
    await logEvent(row.contact_id, "note", `Marked lost: ${reason}`, {});
    setBusy(null);
    load();
  };

  const reactivate = async (row: FieldTeamRow) => {
    setBusy(row.id);
    await sb.from("contact_pipelines").update({ status: "active", lost_reason: null, updated_at: new Date().toISOString() }).eq("id", row.id);
    await logEvent(row.contact_id, "note", "Reactivated", {});
    setBusy(null);
    load();
  };

  const issueCode = async (row: FieldTeamRow) => {
    setBusy(row.id);
    try {
      const { data, error } = await supabase.functions.invoke("field-team", { body: { action: "issue", email: row.contacts.email } });
      if (error || (data as { error?: string })?.error) throw new Error((data as { error?: string })?.error || "Issue failed");
      const code = (data as { code?: string })?.code;
      await sb.from("contact_pipelines").update({ stage: "code_sent", status: "active", stage_entered_at: new Date().toISOString(), meta: { ...row.meta, discount_code: code }, updated_at: new Date().toISOString() }).eq("id", row.id);
      await logEvent(row.contact_id, "code_issued", `Code ${code} issued + emailed`, { discount_code: code });
      toast.success(`Code ${code} issued and emailed.`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't issue a code.");
    } finally {
      setBusy(null);
    }
  };

  const saveNote = async (row: FieldTeamRow) => {
    const text = (noteDraft[row.id] ?? "").trim();
    if (!text) return;
    setBusy(row.id);
    await logEvent(row.contact_id, "note", text, {});
    setNoteDraft((d) => ({ ...d, [row.id]: "" }));
    setBusy(null);
    load();
  };

  const openCompose = (row: FieldTeamRow, tpl: EmailTemplate) => {
    const extras = { code: (row.meta?.discount_code as string | undefined) ?? null };
    setCompose({ row, tpl, subject: interpolate(tpl.subject, row.contacts, extras), body: interpolate(tpl.body, row.contacts, extras) });
  };

  const advanceAfterSend = async (row: FieldTeamRow, tpl: EmailTemplate) => {
    if (tpl.stage_on_send && row.stage !== tpl.stage_on_send) {
      const now = new Date().toISOString();
      await sb.from("contact_pipelines").update({ stage: tpl.stage_on_send, status: "active", stage_entered_at: now, updated_at: now }).eq("id", row.id);
      await logEvent(row.contact_id, "stage_change", `→ ${FT_STAGE_LABEL[tpl.stage_on_send] ?? tpl.stage_on_send}`, {});
    }
  };

  const sendViaApp = async () => {
    if (!compose) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: { contactId: compose.row.contact_id, to: compose.row.contacts.email, subject: compose.subject, text: compose.body, eventType: compose.tpl.event_type },
      });
      if (error || (data as { error?: string })?.error) throw new Error((data as { error?: string })?.error || "Send failed");
      await advanceAfterSend(compose.row, compose.tpl);
      toast.success(`Emailed ${compose.row.contacts.email}.`);
      setCompose(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send.");
    } finally {
      setSending(false);
    }
  };

  const copyCompose = async () => {
    if (!compose) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${compose.subject}\n\n${compose.body}`);
      toast.success("Copied — paste it into your own email.");
    } catch {
      toast.error("Couldn't copy.");
    }
  };

  const markSentManually = async () => {
    if (!compose) return;
    setSending(true);
    await logEvent(compose.row.contact_id, compose.tpl.event_type, `Sent manually: ${compose.subject}`, { subject: compose.subject, via: "manual" });
    await advanceAfterSend(compose.row, compose.tpl);
    toast.success("Logged as sent.");
    setCompose(null);
    setSending(false);
    load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading pipeline…</p>;

  if (showLibrary) return <CommsLibrary onBack={() => { setShowLibrary(false); load(); }} />;

  return (
    <div className="space-y-8">
      {/* Header: progress + funnel */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-typewriter uppercase">Field Team</h2>
            <button onClick={() => setShowLibrary(true)} className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border px-2 py-0.5">Comms library</button>
          </div>
          <p className="mt-1 text-sm font-body text-muted-foreground">
            {confirmedCount} of {TARGET} confirmed · {active.length} in pipeline{lost.length ? ` · ${lost.length} lost` : ""}
          </p>
          <div className="h-2 bg-muted w-64 mt-2">
            <div className="h-2 bg-foreground" style={{ width: `${Math.min(100, (confirmedCount / TARGET) * 100)}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-typewriter uppercase tracking-widest text-muted-foreground">
          {FT_STAGES.map((s) => <span key={s.key}>{s.label}: <span className="text-foreground">{byStage(s.key).length}</span></span>)}
        </div>
      </div>

      {/* Add prospect */}
      <div className="border border-border p-4 flex flex-wrap items-end gap-3">
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} w="w-40" />
        <Field label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} w="w-56" />
        <Field label="How you know them" value={form.source} onChange={(v) => setForm((f) => ({ ...f, source: v }))} w="w-52" />
        <button onClick={addProspect} disabled={busy === "add"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "add" ? "…" : "Add prospect"}</button>
      </div>

      {/* Board */}
      <div className="overflow-x-auto pb-3">
        <div className="flex gap-3 min-w-max">
          {FT_STAGES.map((s) => (
            <div key={s.key} className="w-64 shrink-0">
              <div className="mb-2">
                <p className="font-typewriter text-xs uppercase tracking-widest">{s.label} <span className="text-muted-foreground">({byStage(s.key).length})</span></p>
                <p className="text-[11px] font-body text-muted-foreground">{s.hint}</p>
              </div>
              <div className="space-y-2">
                {byStage(s.key).map((row) => (
                  <Card
                    key={row.id} row={row} busy={busy === row.id} expanded={expanded === row.id}
                    events={events[row.contact_id] ?? []}
                    noteDraft={noteDraft[row.id] ?? ""}
                    onToggle={() => setExpanded(expanded === row.id ? null : row.id)}
                    onStage={(st) => setStage(row, st)}
                    onIssue={() => issueCode(row)}
                    onLost={(reason) => markLost(row, reason)}
                    templates={templates}
                    onCompose={(tpl) => openCompose(row, tpl)}
                    onNoteChange={(v) => setNoteDraft((d) => ({ ...d, [row.id]: v }))}
                    onSaveNote={() => saveNote(row)}
                  />
                ))}
                {byStage(s.key).length === 0 && <p className="text-xs font-body text-muted-foreground/60 border border-dashed border-border p-3">—</p>}
              </div>
            </div>
          ))}

          {/* Lost column */}
          {lost.length > 0 && (
            <div className="w-64 shrink-0">
              <p className="font-typewriter text-xs uppercase tracking-widest mb-2 text-muted-foreground">Lost ({lost.length})</p>
              <div className="space-y-2">
                {lost.map((row) => (
                  <div key={row.id} className="border border-border p-3 opacity-70">
                    <p className="font-body text-sm font-medium">{row.contacts.name || row.contacts.email}</p>
                    <p className="text-xs font-body text-muted-foreground">{row.lost_reason}</p>
                    <button onClick={() => reactivate(row)} disabled={busy === row.id} className="mt-2 text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">Reactivate</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !sending && setCompose(null)}>
          <div className="bg-background border border-border w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-typewriter text-sm uppercase tracking-widest">{compose.tpl.label}</h3>
              <span className="text-xs font-body text-muted-foreground">to {compose.row.contacts.email}</span>
            </div>
            <label className="block text-sm mb-3">
              <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Subject</span>
              <input value={compose.subject} onChange={(e) => setCompose((c) => c && { ...c, subject: e.target.value })}
                className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
            </label>
            <label className="block text-sm mb-4">
              <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Message (edit freely)</span>
              <textarea value={compose.body} onChange={(e) => setCompose((c) => c && { ...c, body: e.target.value })} rows={11}
                className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed" />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={sendViaApp} disabled={sending} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{sending ? "…" : "Send via app"}</button>
              <button onClick={copyCompose} disabled={sending} className="btn-outline text-xs px-3 py-2 disabled:opacity-50">Copy</button>
              <button onClick={markSentManually} disabled={sending} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50">Mark as sent</button>
              <button onClick={() => setCompose(null)} disabled={sending} className="ml-auto text-xs font-body text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <p className="mt-3 text-[11px] font-body text-muted-foreground">Send via app = we email it (reply-to hello@) and log it. Copy = paste into your own email, then Mark as sent to log it.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Card ----------------------------------------------------------------
const Card = ({
  row, busy, expanded, events, noteDraft, templates, onToggle, onStage, onIssue, onLost, onCompose, onNoteChange, onSaveNote,
}: {
  row: FieldTeamRow; busy: boolean; expanded: boolean; events: ContactEvent[]; noteDraft: string; templates: EmailTemplate[];
  onToggle: () => void; onStage: (s: string) => void; onIssue: () => void; onLost: (reason: string) => void;
  onCompose: (tpl: EmailTemplate) => void;
  onNoteChange: (v: string) => void; onSaveNote: () => void;
}) => {
  const c = row.contacts;
  const code = row.meta?.discount_code;
  return (
    <div className="border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onToggle} className="text-left min-w-0">
          <p className="font-body text-sm font-medium truncate">{c.name || c.email}</p>
          <p className="text-[11px] font-body text-muted-foreground truncate">{c.email}</p>
        </button>
        {busy && <span className="text-xs text-muted-foreground">…</span>}
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {code && <Chip>Code ✓</Chip>}
        {c.source && c.source !== "field_team" && <Chip>{c.source}</Chip>}
        {c.country && <Chip>{c.country}</Chip>}
      </div>

      {/* Move stage */}
      <select
        value={row.stage}
        onChange={(e) => onStage(e.target.value)}
        disabled={busy}
        className="mt-2 w-full text-xs px-2 py-1 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
      >
        {FT_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>

      {/* Quick actions */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(row.stage === "confirmed" || row.stage === "code_sent") && (
          <button onClick={onIssue} disabled={busy} className="text-[11px] font-typewriter uppercase tracking-wider btn-outline px-2 py-1 disabled:opacity-50">
            {code ? "Resend code" : "Issue code"}
          </button>
        )}
        <select
          value=""
          onChange={(e) => { const t = templates.find((x) => x.key === e.target.value); if (t) onCompose(t); e.target.value = ""; }}
          disabled={busy || templates.length === 0}
          className="text-[11px] font-typewriter uppercase tracking-wider px-2 py-1 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
        >
          <option value="">Email ▾</option>
          {templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <LostButton onLost={onLost} disabled={busy} />
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="flex gap-2">
            <input
              value={noteDraft}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Log a note / reply…"
              className="flex-1 text-xs px-2 py-1 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <button onClick={onSaveNote} disabled={busy} className="text-[11px] font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50">Log</button>
          </div>
          <ul className="space-y-1">
            {events.slice(0, 12).map((e) => (
              <li key={e.id} className="text-[11px] font-body text-muted-foreground leading-snug">
                <span className="text-foreground">{e.note || e.type.replace(/_/g, " ")}</span> · {fmtDateTime(e.created_at)}
              </li>
            ))}
            {events.length === 0 && <li className="text-[11px] font-body text-muted-foreground/60">No activity yet.</li>}
          </ul>
          <p className="text-[11px] font-body text-muted-foreground/60">Added {fmtDate(c.created_at)}</p>
        </div>
      )}
    </div>
  );
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{children}</span>
);

const LostButton = ({ onLost, disabled }: { onLost: (r: string) => void; disabled: boolean }) => {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} disabled={disabled} className="text-[11px] font-typewriter uppercase tracking-wider text-muted-foreground hover:text-destructive disabled:opacity-50">Lost</button>;
  return (
    <select
      autoFocus
      defaultValue=""
      onChange={(e) => { if (e.target.value) onLost(e.target.value); setOpen(false); }}
      onBlur={() => setOpen(false)}
      className="text-[11px] px-1 py-1 border border-border bg-background rounded-none focus:outline-none"
    >
      <option value="" disabled>Reason…</option>
      {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
};

const Field = ({ label, value, onChange, w }: { label: string; value: string; onChange: (v: string) => void; w: string }) => (
  <label className="text-sm">
    <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} className={`${w} px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground`} />
  </label>
);

export default FieldTeamCRM;
