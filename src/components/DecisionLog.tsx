import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface Decision {
  id: string;
  title: string;
  decision: string;
  rationale: string | null;
  status: "decided" | "under_review" | "superseded";
  decided_on: string;
  review_on: string | null;
  review_notes: string | null;
  created_at: string;
}

const STATUSES: Decision["status"][] = ["decided", "under_review", "superseded"];
const STATUS_LABEL: Record<Decision["status"], string> = { decided: "Decided", under_review: "Under review", superseded: "Superseded" };

const localToday = () => new Date().toLocaleDateString("en-CA");

const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

const DecisionLog = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", decision: "", rationale: "", review_on: "" });
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("decisions").select("*").order("review_on", { ascending: true, nullsFirst: false });
    setDecisions((data as Decision[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title.trim() || !form.decision.trim()) { toast.error("Needs a title and the decision itself."); return; }
    setBusy("add");
    const { error } = await sb.from("decisions").insert({
      title: form.title.trim(),
      decision: form.decision.trim(),
      rationale: form.rationale.trim() || null,
      review_on: form.review_on || null,
    } as never);
    setBusy(null);
    if (error) { toast.error("Couldn't add that."); return; }
    toast.success("Decision logged.");
    setForm({ title: "", decision: "", rationale: "", review_on: "" });
    load();
  };

  const setStatus = async (d: Decision, status: Decision["status"]) => {
    setBusy(d.id);
    await sb.from("decisions").update({ status, updated_at: new Date().toISOString() }).eq("id", d.id);
    setBusy(null);
    load();
  };

  const setReviewOn = async (d: Decision, review_on: string) => {
    setBusy(d.id);
    await sb.from("decisions").update({ review_on: review_on || null, updated_at: new Date().toISOString() }).eq("id", d.id);
    setBusy(null);
    load();
  };

  const saveNote = async (d: Decision) => {
    const text = (noteDraft[d.id] ?? d.review_notes ?? "").trim();
    setBusy(d.id);
    await sb.from("decisions").update({ review_notes: text || null, updated_at: new Date().toISOString() }).eq("id", d.id);
    setBusy(null);
    toast.success("Saved.");
    load();
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading decisions…</p>;

  const today = localToday();

  return (
    <div className="max-w-[820px] space-y-8">
      <div>
        <h2 className="text-2xl font-typewriter uppercase">Decision log</h2>
        <p className="mt-1 text-sm font-body text-muted-foreground">
          Decide now, review later. Each entry records what was decided and why, with a date to re-examine it.
          Pair an entry with a scheduled Claude Routine so the review actually happens — then re-affirm (new date) or mark it superseded.
        </p>
      </div>

      {/* Add */}
      <div className="border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} w="w-72" />
          <label className="text-sm">
            <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Review on</span>
            <input type="date" value={form.review_on} min={today} onChange={(e) => setForm((f) => ({ ...f, review_on: e.target.value }))}
              className="px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
          </label>
        </div>
        <Area label="The decision" value={form.decision} onChange={(v) => setForm((f) => ({ ...f, decision: v }))} />
        <Area label="Rationale (and what would change it)" value={form.rationale} onChange={(v) => setForm((f) => ({ ...f, rationale: v }))} />
        <button onClick={add} disabled={busy === "add"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "add" ? "…" : "Log decision"}</button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {decisions.map((d) => {
          const overdue = d.status !== "superseded" && d.review_on !== null && d.review_on <= today;
          return (
            <div key={d.id} className={`border p-4 ${overdue ? "border-foreground" : "border-border"} ${d.status === "superseded" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-body font-medium">
                    {d.title}
                    {overdue && <span className="ml-2 text-[10px] font-typewriter uppercase tracking-widest bg-foreground text-background px-1.5 py-0.5">Review due</span>}
                  </p>
                  <p className="mt-0.5 text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">
                    Decided {fmt(d.decided_on)}{d.review_on && ` · Review ${fmt(d.review_on)}`}
                  </p>
                </div>
                <select value={d.status} onChange={(e) => setStatus(d, e.target.value as Decision["status"])} disabled={busy === d.id}
                  className="text-xs font-typewriter uppercase tracking-wider px-2 py-1 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground shrink-0">
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>

              <p className="mt-3 text-sm font-body leading-relaxed">{d.decision}</p>
              {d.rationale && <p className="mt-2 text-sm font-body text-muted-foreground leading-relaxed">{d.rationale}</p>}

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  value={noteDraft[d.id] ?? d.review_notes ?? ""}
                  onChange={(e) => setNoteDraft((n) => ({ ...n, [d.id]: e.target.value }))}
                  placeholder="Review notes (what the review found, links…)"
                  className="flex-1 min-w-[200px] text-xs px-2 py-1.5 border border-border bg-background rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                <button onClick={() => saveNote(d)} disabled={busy === d.id} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50">Save</button>
                <label className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Re-review
                  <input type="date" value={d.review_on ?? ""} min={today} onChange={(e) => setReviewOn(d, e.target.value)} disabled={busy === d.id}
                    className="px-2 py-1 border border-border bg-background text-xs font-body rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
                </label>
              </div>
            </div>
          );
        })}
        {decisions.length === 0 && <p className="font-body text-muted-foreground">No decisions logged yet.</p>}
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

const Area = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="block text-sm">
    <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    <textarea value={value} rows={2} onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
  </label>
);

export default DecisionLog;
