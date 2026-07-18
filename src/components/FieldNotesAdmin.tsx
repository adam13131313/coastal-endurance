import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Markdown from "@/components/Markdown";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface Note {
  id: string;
  slug: string;
  title: string;
  standfirst: string | null;
  body: string;
  published: boolean;
  published_at: string | null;
  updated_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);

const BLANK = { title: "", slug: "", standfirst: "", body: "" };

const FieldNotesAdmin = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(BLANK);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("field_notes").select("*").order("published_at", { ascending: false, nullsFirst: true });
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (n: Note) => {
    setEditing(n.id); setOpen(n.id); setAdding(false);
    setDraft({ title: n.title, slug: n.slug, standfirst: n.standfirst ?? "", body: n.body });
  };

  const save = async (id: string | null) => {
    if (!draft.title.trim() || !draft.body.trim()) { toast.error("A note needs a title and a body."); return; }
    const slug = draft.slug.trim() || slugify(draft.title);
    setBusy(id ?? "add");
    const payload = { title: draft.title.trim(), slug, standfirst: draft.standfirst.trim() || null, body: draft.body, updated_at: new Date().toISOString() };
    const { error } = id
      ? await sb.from("field_notes").update(payload).eq("id", id)
      : await sb.from("field_notes").insert(payload);
    setBusy(null);
    if (error) { toast.error(String(error.message).includes("duplicate") ? "That slug is taken." : "Couldn't save."); return; }
    toast.success("Saved.");
    setEditing(null); setAdding(false); setDraft(BLANK);
    load();
  };

  const togglePublish = async (n: Note) => {
    setBusy(n.id);
    const publishing = !n.published;
    const { error } = await sb.from("field_notes").update({
      published: publishing,
      published_at: publishing ? (n.published_at ?? new Date().toISOString()) : n.published_at,
      updated_at: new Date().toISOString(),
    }).eq("id", n.id);
    setBusy(null);
    if (error) { toast.error("Couldn't update."); return; }
    toast.success(publishing ? `Published — live at /field-notes/${n.slug}` : "Unpublished.");
    load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading notes…</p>;

  const Form = ({ id }: { id: string | null }) => (
    <div className="mt-4 pt-4 border-t border-border space-y-2">
      <div className="flex flex-wrap gap-2">
        <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Title" className="flex-1 min-w-[200px] px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        <input value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} placeholder="slug (blank = from title)" className="w-56 px-2 py-1.5 border border-border bg-background text-sm font-mono rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
      </div>
      <input value={draft.standfirst} onChange={(e) => setDraft((d) => ({ ...d, standfirst: e.target.value }))} placeholder="Standfirst — one line under the title" className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
      <textarea value={draft.body} rows={16} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="Body (markdown)" className="w-full px-3 py-2 border border-border bg-background text-sm font-mono rounded-none focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed" />
      <div className="flex gap-2">
        <button onClick={() => save(id)} disabled={busy === (id ?? "add")} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === (id ?? "add") ? "…" : "Save"}</button>
        <button onClick={() => { setEditing(null); setAdding(false); setDraft(BLANK); }} className="text-xs font-body text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-[820px] space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-2xl font-typewriter uppercase">Field Notes</h2>
          <p className="mt-1 text-sm font-body text-muted-foreground">The public journal at /field-notes. Drafts stay private until you publish. Signed "Adam Hyde, Founder" — keep it in your voice.</p>
        </div>
        {!adding && <button onClick={() => { setAdding(true); setEditing(null); setDraft(BLANK); }} className="btn-outline text-xs px-3 py-1.5">+ New note</button>}
      </div>

      {adding && <div className="border border-dashed border-border p-4"><Form id={null} /></div>}

      <div className="space-y-3">
        {notes.map((n) => (
          <div key={n.id} className="border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-body font-medium">
                  {n.title}
                  <span className={`ml-2 text-[10px] font-typewriter uppercase tracking-widest px-1.5 py-0.5 ${n.published ? "bg-foreground text-background" : "border border-border text-muted-foreground"}`}>
                    {n.published ? "Live" : "Draft"}
                  </span>
                </p>
                {n.standfirst && <p className="mt-1 text-sm font-body text-muted-foreground leading-relaxed">{n.standfirst}</p>}
                <p className="mt-1 text-xs font-mono text-muted-foreground">/field-notes/{n.slug}</p>
              </div>
              <button onClick={() => togglePublish(n)} disabled={busy === n.id} className="btn-outline text-xs px-3 py-1.5 shrink-0 disabled:opacity-50">
                {n.published ? "Unpublish" : "Publish"}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setOpen(open === n.id ? null : n.id); setEditing(null); }} className="btn-outline text-xs px-3 py-1.5">{open === n.id && editing !== n.id ? "Close" : "Preview"}</button>
              <button onClick={() => startEdit(n)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">Edit</button>
            </div>
            {open === n.id && editing !== n.id && (
              <div className="mt-4 pt-4 border-t border-border"><Markdown>{n.body}</Markdown></div>
            )}
            {editing === n.id && <Form id={n.id} />}
          </div>
        ))}
        {notes.length === 0 && <p className="font-body text-muted-foreground">No notes yet.</p>}
      </div>
    </div>
  );
};

export default FieldNotesAdmin;
