import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { sb, type EmailTemplate } from "@/lib/crm";

// Edit the CRM email templates (subject + body). {{first_name}} is filled per contact
// when you compose. Admin-only (RLS). This is the "communications library".
const CommsLibrary = ({ onBack }: { onBack: () => void }) => {
  const [rows, setRows] = useState<EmailTemplate[]>([]);
  const [draft, setDraft] = useState<Record<string, { label: string; subject: string; body: string; active: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState({ key: "", label: "", subject: "", body: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("email_templates").select("*").order("sort", { ascending: true });
    const list = (data as EmailTemplate[]) ?? [];
    setRows(list);
    setDraft(Object.fromEntries(list.map((t) => [t.id, { label: t.label, subject: t.subject, body: t.body, active: t.active }])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (t: EmailTemplate) => {
    const d = draft[t.id];
    if (!d) return;
    setBusy(t.id);
    const { error } = await sb.from("email_templates").update({
      label: d.label.trim() || t.label, subject: d.subject, body: d.body, active: d.active, updated_at: new Date().toISOString(),
    }).eq("id", t.id);
    setBusy(null);
    if (error) { toast.error("Couldn't save."); return; }
    toast.success(`Saved "${d.label || t.label}".`);
    load();
  };

  const addTemplate = async () => {
    const key = adding.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!key || !adding.label.trim()) { toast.error("Add a key and a label."); return; }
    setBusy("add");
    const { error } = await sb.from("email_templates").insert({
      key, label: adding.label.trim(), subject: adding.subject || "Subject", body: adding.body || "Hi {{first_name}},\n\n", sort: (rows.at(-1)?.sort ?? 0) + 1,
    });
    setBusy(null);
    if (error) { toast.error(String(error.message).includes("duplicate") ? "That key already exists." : "Couldn't add."); return; }
    toast.success("Template added.");
    setAdding({ key: "", label: "", subject: "", body: "" });
    load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading templates…</p>;

  return (
    <div className="max-w-[720px] space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-typewriter uppercase">Comms library</h2>
        <button onClick={onBack} className="text-sm font-body text-muted-foreground hover:text-foreground">← Back to pipeline</button>
      </div>
      <p className="text-sm font-body text-muted-foreground">
        Edit the wording sent from the pipeline. <code className="text-foreground">{"{{first_name}}"}</code> is replaced with each person's first name when you compose, and <code className="text-foreground">{"{{code}}"}</code> with their issued free-bottle code. You can still tweak any email before it sends.
      </p>

      <div className="space-y-5">
        {rows.map((t) => {
          const d = draft[t.id];
          if (!d) return null;
          return (
            <div key={t.id} className="border border-border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  value={d.label}
                  onChange={(e) => setDraft((s) => ({ ...s, [t.id]: { ...s[t.id], label: e.target.value } }))}
                  className="font-typewriter text-sm uppercase tracking-wider bg-background border-b border-border focus:outline-none focus:border-foreground px-1"
                />
                <label className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                  <input type="checkbox" checked={d.active} onChange={(e) => setDraft((s) => ({ ...s, [t.id]: { ...s[t.id], active: e.target.checked } }))} />
                  Active
                </label>
              </div>
              <label className="block text-sm">
                <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Subject</span>
                <input value={d.subject} onChange={(e) => setDraft((s) => ({ ...s, [t.id]: { ...s[t.id], subject: e.target.value } }))}
                  className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
              </label>
              <label className="block text-sm">
                <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Body</span>
                <textarea value={d.body} rows={8} onChange={(e) => setDraft((s) => ({ ...s, [t.id]: { ...s[t.id], body: e.target.value } }))}
                  className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed" />
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => save(t)} disabled={busy === t.id} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === t.id ? "…" : "Save"}</button>
                {t.stage_on_send && <span className="text-[11px] font-body text-muted-foreground">Advances stage → {t.stage_on_send}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add a template */}
      <details className="border border-dashed border-border p-4">
        <summary className="text-sm font-typewriter uppercase tracking-wider text-muted-foreground cursor-pointer">+ New template</summary>
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input placeholder="key (e.g. reminder)" value={adding.key} onChange={(e) => setAdding((a) => ({ ...a, key: e.target.value }))} className="flex-1 px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
            <input placeholder="Label" value={adding.label} onChange={(e) => setAdding((a) => ({ ...a, label: e.target.value }))} className="flex-1 px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </div>
          <input placeholder="Subject" value={adding.subject} onChange={(e) => setAdding((a) => ({ ...a, subject: e.target.value }))} className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          <textarea placeholder="Body (use {{first_name}})" rows={4} value={adding.body} onChange={(e) => setAdding((a) => ({ ...a, body: e.target.value }))} className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          <button onClick={addTemplate} disabled={busy === "add"} className="btn-outline text-xs px-4 py-2 disabled:opacity-50">{busy === "add" ? "…" : "Add template"}</button>
        </div>
      </details>
    </div>
  );
};

export default CommsLibrary;
