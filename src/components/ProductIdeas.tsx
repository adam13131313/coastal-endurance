import { useCallback, useEffect, useState } from "react";
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
  sort: number;
  created_at: string;
}

const STATUSES: Idea["status"][] = ["idea", "exploring", "planned", "parked"];
const STATUS_LABEL: Record<Idea["status"], string> = { idea: "Idea", exploring: "Exploring", planned: "Planned", parked: "Parked" };

const ProductIdeas = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

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

  if (loading) return <p className="font-body text-muted-foreground">Loading ideas…</p>;

  return (
    <div className="max-w-[820px] space-y-8">
      <div>
        <h2 className="text-2xl font-typewriter uppercase">Product ideas</h2>
        <p className="mt-1 text-sm font-body text-muted-foreground">The pipeline of future products. Every one: 100% natural, performance-optimised, equipment-maintenance not cosmetics.</p>
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
                </p>
                {idea.description && <p className="mt-1 text-sm font-body text-muted-foreground leading-relaxed">{idea.description}</p>}
              </div>
              <select value={idea.status} onChange={(e) => setStatus(idea, e.target.value as Idea["status"])} disabled={busy === idea.id}
                className="text-xs font-typewriter uppercase tracking-wider px-2 py-1 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground shrink-0">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={noteDraft[idea.id] ?? idea.notes ?? ""}
                onChange={(e) => setNoteDraft((d) => ({ ...d, [idea.id]: e.target.value }))}
                placeholder="Notes (formulation thoughts, suppliers, priority…)"
                className="flex-1 text-xs px-2 py-1.5 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              <button onClick={() => saveNote(idea)} disabled={busy === idea.id} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50">Save</button>
            </div>
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
