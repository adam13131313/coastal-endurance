import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffNote {
  id: string;
  author_email: string | null;
  type: string;
  body: string;
  status: string;
  created_at: string;
}

const TYPES = ["issue", "request", "suggestion", "question"] as const;

// staff_notes isn't in the generated types until they're regenerated post-migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const StaffBoard = () => {
  const [notes, setNotes] = useState<StaffNote[]>([]);
  const [type, setType] = useState<string>("issue");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from("staff_notes").select("*").order("created_at", { ascending: false });
    setNotes((data as StaffNote[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await sb.from("staff_notes").insert({ type, body: body.trim(), author_email: session?.user?.email ?? null });
    setBusy(false);
    if (error) { toast.error("Couldn't post that."); return; }
    setBody(""); setType("issue"); toast.success("Posted to the board."); load();
  };

  const setStatus = async (id: string, status: string) => {
    await sb.from("staff_notes").update({ status }).eq("id", id);
    load();
  };

  const fmt = (s: string) => new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-[760px] space-y-8">
      <div className="border border-border p-5 space-y-3">
        <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">Post to the board</p>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`text-xs font-typewriter uppercase tracking-wider px-3 py-1.5 border ${type === t ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the issue, request, suggestion, or question…"
          rows={3}
          className="w-full px-3 py-2 border border-border bg-background text-sm font-body rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        <button onClick={add} disabled={busy || !body.trim()} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
          {busy ? "Posting…" : "Post"}
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="font-body text-muted-foreground text-sm">Nothing on the board yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className={`border border-border p-4 ${n.status === "resolved" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-typewriter uppercase tracking-widest px-2 py-0.5 bg-muted text-muted-foreground mr-2">{n.type}</span>
                  <span className="text-xs font-body text-muted-foreground">{n.author_email ?? "unknown"} · {fmt(n.created_at)}</span>
                </div>
                {n.status === "open" ? (
                  <button onClick={() => setStatus(n.id, "resolved")} className="text-xs font-body text-muted-foreground hover:text-foreground underline shrink-0">Resolve</button>
                ) : (
                  <button onClick={() => setStatus(n.id, "open")} className="text-xs font-body text-muted-foreground hover:text-foreground underline shrink-0">Reopen</button>
                )}
              </div>
              <p className="mt-2 text-sm font-body whitespace-pre-wrap">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffBoard;
