import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sb, fmtDate } from "@/lib/crm";

// Newsletter subscribers ("Updates only. No noise."). Captured by the public
// `subscribe` function → newsletter_signups. Each signup gets a thank-you email
// and a one-click unsubscribe link. Bulk sending happens in Resend Broadcasts;
// this view is the working record + copy-emails + manual unsubscribe.
interface Signup {
  id: string;
  email: string;
  source: string | null;
  token: string;
  created_at: string;
  unsubscribed_at: string | null;
  welcomed_at: string | null;
}

const SubscribersAdmin = () => {
  const [rows, setRows] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showUnsub, setShowUnsub] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb
      .from("newsletter_signups")
      .select("id, email, source, token, created_at, unsubscribed_at, welcomed_at")
      .order("created_at", { ascending: false });
    setRows((data as Signup[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => rows.filter((r) => !r.unsubscribed_at), [rows]);
  const filtered = useMemo(() => {
    const base = showUnsub ? rows : active;
    const term = q.trim().toLowerCase();
    return term ? base.filter((r) => r.email.toLowerCase().includes(term) || (r.source ?? "").toLowerCase().includes(term)) : base;
  }, [rows, active, showUnsub, q]);

  const copyEmails = async () => {
    const list = active.map((r) => r.email).join(", ");
    if (!list) { toast.error("No active subscribers"); return; }
    try {
      await navigator.clipboard.writeText(list);
      toast.success(`Copied ${active.length} email${active.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const unsubscribe = async (row: Signup) => {
    if (!confirm(`Unsubscribe ${row.email}? They'll be removed from the list and future broadcasts.`)) return;
    setBusy(row.id);
    // Route through the edge function so Resend is flipped too (not just our row).
    const { data, error } = await supabase.functions.invoke("newsletter-unsubscribe", { body: { token: row.token } });
    setBusy(null);
    if (error || !(data as { ok?: boolean })?.ok) { toast.error("Failed to unsubscribe"); return; }
    toast.success(`${row.email} unsubscribed`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-typewriter uppercase">Subscribers</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${active.length} active${rows.length - active.length > 0 ? ` · ${rows.length - active.length} unsubscribed` : ""}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email…"
            className="px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <button onClick={copyEmails} className="px-3 py-1.5 border border-foreground text-sm hover:bg-foreground hover:text-background transition-colors">
            Copy emails
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        Signups arrive here from the site's subscribe boxes and get a thank-you email with a one-click unsubscribe.
        To send an actual update, use <strong>Resend → Broadcasts → "Coastal Endurance updates"</strong> — copy the active
        list above, or Resend already holds the same audience.
      </p>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={showUnsub} onChange={(e) => setShowUnsub(e.target.checked)} />
        Show unsubscribed
      </label>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Signed up</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.source ?? "website"}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.created_at)}</td>
                <td className="px-3 py-2">
                  {r.unsubscribed_at ? (
                    <span className="text-muted-foreground">Unsubscribed</span>
                  ) : (
                    <span className="text-foreground">Active</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {!r.unsubscribed_at && (
                    <button
                      onClick={() => unsubscribe(r)}
                      disabled={busy === r.id}
                      className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-50"
                    >
                      {busy === r.id ? "…" : "Unsubscribe"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No subscribers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscribersAdmin;
