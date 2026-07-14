import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Markdown from "@/components/Markdown";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type Kind = "self" | "competitor" | "inspiration";
interface Competitor {
  id: string; name: string; kind: Kind; category: string | null; url: string | null;
  one_liner: string | null; our_position: string | null; profile: string | null; sort: number;
}

const BLANK = { name: "", kind: "competitor" as Kind, category: "", url: "", one_liner: "", our_position: "", profile: "" };

const CompetitorsAdmin = () => {
  const [rows, setRows] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<typeof BLANK>(BLANK);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("competitors").select("*").order("sort").order("name");
    setRows((data as Competitor[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (c: Competitor) => {
    setEditing(c.id); setOpen(c.id);
    setDraft({ name: c.name, kind: c.kind, category: c.category ?? "", url: c.url ?? "", one_liner: c.one_liner ?? "", our_position: c.our_position ?? "", profile: c.profile ?? "" });
  };

  const save = async (id: string | null) => {
    if (!draft.name.trim()) { toast.error("Name is required."); return; }
    setBusy(id ?? "add");
    const payload = {
      name: draft.name.trim(), kind: draft.kind, category: draft.category.trim() || null, url: draft.url.trim() || null,
      one_liner: draft.one_liner.trim() || null, our_position: draft.our_position.trim() || null, profile: draft.profile.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = id
      ? await sb.from("competitors").update(payload).eq("id", id)
      : await sb.from("competitors").insert({ ...payload, sort: (rows.at(-1)?.sort ?? rows.length) + 1 });
    setBusy(null);
    if (error) { toast.error("Couldn't save."); return; }
    toast.success("Saved.");
    setEditing(null); setAdding(false); setDraft(BLANK);
    load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading…</p>;

  const self = rows.find((r) => r.kind === "self");
  const competitors = rows.filter((r) => r.kind === "competitor");
  const inspirations = rows.filter((r) => r.kind === "inspiration");

  const EditForm = ({ id }: { id: string | null }) => (
    <div className="mt-4 pt-4 border-t border-border space-y-2">
      <div className="flex flex-wrap gap-2">
        <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" className="flex-1 min-w-[180px] px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        <select value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as Kind }))} className="px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground">
          <option value="competitor">Competitor</option>
          <option value="inspiration">Inspiration</option>
          <option value="self">Our position</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} placeholder="Category" className="flex-1 min-w-[160px] px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        <input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="URL" className="flex-1 min-w-[160px] px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
      </div>
      <input value={draft.one_liner} onChange={(e) => setDraft((d) => ({ ...d, one_liner: e.target.value }))} placeholder="One-liner" className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
      <textarea value={draft.our_position} rows={3} onChange={(e) => setDraft((d) => ({ ...d, our_position: e.target.value }))} placeholder="Our position relative to them" className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
      <textarea value={draft.profile} rows={12} onChange={(e) => setDraft((d) => ({ ...d, profile: e.target.value }))} placeholder="Full profile (markdown)" className="w-full px-2 py-1.5 border border-border bg-background text-sm font-mono rounded-none focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed" />
      <div className="flex gap-2">
        <button onClick={() => save(id)} disabled={busy === (id ?? "add")} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === (id ?? "add") ? "…" : "Save"}</button>
        <button onClick={() => { setEditing(null); setAdding(false); setDraft(BLANK); }} className="text-xs font-body text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );

  const Card = ({ c }: { c: Competitor }) => (
    <div className="border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-body font-medium">
            {c.name}
            {c.category && <span className="ml-2 text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{c.category}</span>}
          </p>
          {c.one_liner && <p className="mt-1 text-sm font-body text-muted-foreground leading-relaxed">{c.one_liner}</p>}
          {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs font-body text-muted-foreground underline underline-offset-2 hover:text-foreground">{c.url.replace(/^https?:\/\//, "")}</a>}
        </div>
      </div>
      {c.our_position && (
        <div className="mt-3 border-l-2 border-foreground pl-3">
          <p className="font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Our position</p>
          <p className="text-sm font-body">{c.our_position}</p>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {c.profile && <button onClick={() => setOpen(open === c.id ? null : c.id)} className="btn-outline text-xs px-3 py-1.5">{open === c.id && editing !== c.id ? "Close" : "Read profile"}</button>}
        <button onClick={() => startEdit(c)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">Edit</button>
      </div>
      {open === c.id && editing !== c.id && c.profile && (
        <div className="mt-4 pt-4 border-t border-border"><Markdown>{c.profile}</Markdown></div>
      )}
      {editing === c.id && <EditForm id={c.id} />}
    </div>
  );

  return (
    <div className="max-w-[820px] space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-2xl font-typewriter uppercase">Positioning &amp; competitors</h2>
          <p className="mt-1 text-sm font-body text-muted-foreground">Where we sit, who's around us, and what we take from them. Ready reference — edit freely.</p>
        </div>
        {!adding && <button onClick={() => { setAdding(true); setDraft(BLANK); }} className="btn-outline text-xs px-3 py-1.5">+ Add</button>}
      </div>

      {adding && <div className="border border-dashed border-border p-4"><EditForm id={null} /></div>}

      {/* Our positioning */}
      {self && (
        <section className="border border-foreground p-5">
          <p className="font-typewriter text-xs uppercase tracking-widest mb-1">Our positioning</p>
          {self.one_liner && <p className="text-sm font-body font-medium">{self.one_liner}</p>}
          {self.profile && <div className="mt-3"><Markdown>{self.profile}</Markdown></div>}
          <button onClick={() => startEdit(self)} className="mt-2 text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">Edit</button>
          {editing === self.id && <EditForm id={self.id} />}
        </section>
      )}

      {/* Competitors */}
      <section>
        <h3 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground mb-3">Competitors</h3>
        <div className="space-y-3">{competitors.map((c) => <Card key={c.id} c={c} />)}</div>
      </section>

      {/* Inspiration */}
      {inspirations.length > 0 && (
        <section>
          <h3 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground mb-3">Brand inspiration</h3>
          <div className="space-y-3">{inspirations.map((c) => <Card key={c.id} c={c} />)}</div>
        </section>
      )}
    </div>
  );
};

export default CompetitorsAdmin;
