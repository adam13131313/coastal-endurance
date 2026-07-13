import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface Idea {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "idea" | "exploring" | "planned" | "parked";
  notes: string | null;
  brief: string | null;
  sort: number;
  created_at: string;
}

const STATUSES: Idea["status"][] = ["idea", "exploring", "planned", "parked"];
const STATUS_LABEL: Record<Idea["status"], string> = { idea: "Idea", exploring: "Exploring", planned: "Planned", parked: "Parked" };

// Brand-styled markdown for the exploration briefs.
const md = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className="font-typewriter text-xl uppercase tracking-wider mt-2 mb-3" {...p} />,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="font-typewriter text-sm uppercase tracking-widest mt-6 mb-2" {...p} />,
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mt-4 mb-2" {...p} />,
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc pl-5 space-y-1.5 mb-3 font-body text-sm text-muted-foreground" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="list-decimal pl-5 space-y-1.5 mb-3 font-body text-sm text-muted-foreground" {...p} />,
  strong: (p: React.HTMLAttributes<HTMLElement>) => <strong className="text-foreground font-medium" {...p} />,
  hr: () => <hr className="border-border my-5" />,
  table: (p: React.TableHTMLAttributes<HTMLTableElement>) => <div className="overflow-x-auto mb-4"><table className="w-full text-sm border border-border" {...p} /></div>,
  th: (p: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="text-left font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground border border-border px-2.5 py-1.5" {...p} />,
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="font-body text-muted-foreground border border-border px-2.5 py-1.5 align-top" {...p} />,
  em: (p: React.HTMLAttributes<HTMLElement>) => <em className="italic" {...p} />,
};

const ProductIdeas = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [openBrief, setOpenBrief] = useState<string | null>(null);
  const [editingBrief, setEditingBrief] = useState<string | null>(null);
  const [briefDraft, setBriefDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("product_ideas").select("*").order("status").order("sort");
    setIdeas((data as Idea[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title.trim()) { toast.error("Give it a title."); return; }
    setBusy("add");
    const { error } = await sb.from("product_ideas").insert({
      title: form.title.trim(), description: form.description.trim() || null, category: form.category.trim() || null,
      sort: (ideas.at(-1)?.sort ?? ideas.length) + 1,
    } as never);
    setBusy(null);
    if (error) { toast.error("Couldn't add that."); return; }
    toast.success("Idea added.");
    setForm({ title: "", description: "", category: "" });
    load();
  };

  const setStatus = async (idea: Idea, status: Idea["status"]) => {
    setBusy(idea.id);
    await sb.from("product_ideas").update({ status, updated_at: new Date().toISOString() }).eq("id", idea.id);
    setBusy(null);
    load();
  };

  const saveNote = async (idea: Idea) => {
    const text = (noteDraft[idea.id] ?? idea.notes ?? "").trim();
    setBusy(idea.id);
    await sb.from("product_ideas").update({ notes: text || null, updated_at: new Date().toISOString() }).eq("id", idea.id);
    setBusy(null);
    toast.success("Saved.");
    load();
  };

  const startEditBrief = (idea: Idea) => {
    setEditingBrief(idea.id);
    setOpenBrief(idea.id);
    setBriefDraft(idea.brief ?? `# ${idea.title}\n### Product Idea — Initial Exploration\n\n## Concept\n\n\n## Why it fits\n\n\n## Key risks\n\n\n## Open questions\n\n1. \n\n## Recommendation and next trigger\n\n`);
  };

  const saveBrief = async (idea: Idea) => {
    setBusy(idea.id);
    const { error } = await sb.from("product_ideas").update({ brief: briefDraft.trim() || null, updated_at: new Date().toISOString() }).eq("id", idea.id);
    setBusy(null);
    if (error) { toast.error("Couldn't save the brief."); return; }
    toast.success("Brief saved.");
    setEditingBrief(null);
    load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading ideas…</p>;

  return (
    <div className="max-w-[820px] space-y-8">
      <div>
        <h2 className="text-2xl font-typewriter uppercase">Product ideas</h2>
        <p className="mt-1 text-sm font-body text-muted-foreground">The pipeline of future products. Every one: 100% natural, performance-optimised, equipment-maintenance not cosmetics. Attach an exploration brief to give an idea depth.</p>
      </div>

      {/* Add */}
      <div className="border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} w="w-64" />
          <Field label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} w="w-40" />
        </div>
        <label className="block text-sm">
          <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">What is it?</span>
          <textarea value={form.description} rows={2} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        </label>
        <button onClick={add} disabled={busy === "add"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "add" ? "…" : "Add idea"}</button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {ideas.map((idea) => (
          <div key={idea.id} className="border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-body font-medium">
                  {idea.title}
                  {idea.category && <span className="ml-2 text-[10px] font-typewriter uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">{idea.category}</span>}
                  {idea.brief && <span className="ml-2 text-[10px] font-typewriter uppercase tracking-widest bg-foreground text-background px-1.5 py-0.5">Brief</span>}
                </p>
                {idea.description && <p className="mt-1 text-sm font-body text-muted-foreground leading-relaxed">{idea.description}</p>}
              </div>
              <select value={idea.status} onChange={(e) => setStatus(idea, e.target.value as Idea["status"])} disabled={busy === idea.id}
                className="text-xs font-typewriter uppercase tracking-wider px-2 py-1 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground shrink-0">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <input
                value={noteDraft[idea.id] ?? idea.notes ?? ""}
                onChange={(e) => setNoteDraft((d) => ({ ...d, [idea.id]: e.target.value }))}
                placeholder="Quick note (suppliers, priority…)"
                className="flex-1 min-w-[200px] text-xs px-2 py-1.5 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              <button onClick={() => saveNote(idea)} disabled={busy === idea.id} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50">Save</button>
              {idea.brief ? (
                <button onClick={() => setOpenBrief(openBrief === idea.id ? null : idea.id)} className="btn-outline text-xs px-3 py-1.5">
                  {openBrief === idea.id ? "Close brief" : "Read brief"}
                </button>
              ) : (
                <button onClick={() => startEditBrief(idea)} className="btn-outline text-xs px-3 py-1.5">Add brief</button>
              )}
            </div>

            {/* Brief: read or edit */}
            {openBrief === idea.id && (
              <div className="mt-4 pt-4 border-t border-border">
                {editingBrief === idea.id ? (
                  <div className="space-y-2">
                    <textarea value={briefDraft} rows={22} onChange={(e) => setBriefDraft(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background text-sm font-mono rounded-none focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed" />
                    <div className="flex gap-2">
                      <button onClick={() => saveBrief(idea)} disabled={busy === idea.id} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === idea.id ? "…" : "Save brief"}</button>
                      <button onClick={() => setEditingBrief(null)} className="text-xs font-body text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>
                    <p className="text-[11px] font-body text-muted-foreground">Markdown: # headings, **bold**, lists, tables.</p>
                  </div>
                ) : (
                  <div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{idea.brief ?? ""}</ReactMarkdown>
                    <button onClick={() => startEditBrief(idea)} className="mt-2 text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">Edit brief</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {ideas.length === 0 && <p className="font-body text-muted-foreground">No ideas yet.</p>}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, w }: { label: string; value: string; onChange: (v: string) => void; w: string }) => (
  <label className="text-sm">
    <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} className={`${w} px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground`} />
  </label>
);

export default ProductIdeas;
