import { useCallback, useEffect, useState } from "react";
import { sb, fmtDateTime } from "@/lib/crm";

// Batch 001 ledger waitlist (read-only). Signups arrive via /ledger →
// ledger-waitlist-signup edge function; admins get SELECT via RLS. Position is
// rank by created_at — the same number the signup form showed the person.
interface WaitlistRow {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

interface SyncFailure {
  id: string;
  email: string;
  destination: string;
  error: string | null;
  created_at: string;
  resolved_at: string | null;
}

const WaitlistAdmin = () => {
  const [total, setTotal] = useState<number | null>(null);
  const [recent, setRecent] = useState<WaitlistRow[]>([]);
  const [failures, setFailures] = useState<SyncFailure[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ count }, { data: rows }, { data: fails }] = await Promise.all([
      sb.from("ledger_waitlist").select("*", { count: "exact", head: true }),
      sb.from("ledger_waitlist").select("id, email, source, created_at").order("created_at", { ascending: false }).limit(20),
      sb.from("waitlist_sync_failures").select("id, email, destination, error, created_at, resolved_at").order("created_at", { ascending: false }).limit(50),
    ]);
    setTotal(count ?? 0);
    setRecent((rows as WaitlistRow[]) ?? []);
    setFailures((fails as SyncFailure[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unresolved = failures.filter((f) => !f.resolved_at);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-typewriter uppercase">Ledger waitlist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} on the list`}
          </p>
        </div>
        <button onClick={load} className="px-3 py-1.5 border border-foreground text-sm hover:bg-foreground hover:text-background transition-colors">
          Refresh
        </button>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        Batch 001 waitlist from <strong>/ledger</strong>. Read-only here — signups write via the edge function,
        which also pushes each profile to the Klaviyo list <strong>"Batch 001 Waitlist"</strong>. Position is the
        number the person was shown; it never changes.
      </p>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Position</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-typewriter">#{(total ?? 0) - i}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.source ?? "ledger"}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDateTime(r.created_at)}</td>
              </tr>
            ))}
            {!loading && recent.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No signups yet. The list starts at #1.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-lg font-typewriter uppercase">
          Klaviyo sync failures
          {unresolved.length > 0 && <span className="ml-2 text-destructive">({unresolved.length} unresolved)</span>}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
          A row here means the signup succeeded but the push to Klaviyo didn't — that person is on our list
          but not mailable until re-synced. Should stay empty once KLAVIYO_PRIVATE_KEY is set.
        </p>
        <div className="mt-3 border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Error</th>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((f) => (
                <tr key={f.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">{f.email}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-md truncate" title={f.error ?? ""}>{f.error ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDateTime(f.created_at)}</td>
                  <td className="px-3 py-2">
                    {f.resolved_at ? <span className="text-muted-foreground">Resolved</span> : <span className="text-destructive">Unresolved</span>}
                  </td>
                </tr>
              ))}
              {!loading && failures.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No sync failures. Good.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WaitlistAdmin;
