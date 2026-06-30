import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Member {
  email: string;
  code: string | null;
  created_at: string;
  redeemed: boolean;
  active: boolean;
}

const call = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("field-team", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

const FieldTeamAdmin = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list" });
      setMembers(data?.members ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issue = async () => {
    if (!email.trim() || issuing) return;
    setIssuing(true);
    setError("");
    setNotice("");
    try {
      const data = await call({ action: "issue", email });
      setNotice(`Code ${data.code} issued${data.emailed ? ` and emailed to ${data.email}` : ` for ${data.email}`}.`);
      setEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not issue a code.");
    } finally {
      setIssuing(false);
    }
  };

  const resend = async (m: Member) => {
    setBusy(m.email);
    setError("");
    setNotice("");
    try {
      await call({ action: "resend", email: m.email });
      setNotice(`Re-sent ${m.code} to ${m.email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend.");
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (m: Member) => {
    if (!confirm(`Revoke ${m.email}'s code? Their code will stop working and they'll be removed from this list.`)) return;
    setBusy(m.email);
    setError("");
    setNotice("");
    try {
      await call({ action: "revoke", email: m.email });
      setMembers((prev) => prev.filter((x) => x.email !== m.email));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-[820px] space-y-8">
      <div>
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-1">Field team</h2>
        <p className="text-xs font-body text-muted-foreground">
          Add members one at a time. Each gets a single-use code for one free bottle (A$78 off), emailed automatically. They redeem it at checkout.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-body">
          <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Member email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && issue()}
            placeholder="name@example.com"
            className="w-72 px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </label>
        <button
          onClick={issue}
          disabled={issuing || !email.trim()}
          className="font-typewriter text-xs uppercase tracking-widest border border-foreground px-5 py-2 text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {issuing ? "Generating…" : "Generate code"}
        </button>
      </div>

      {notice && <p className="font-body text-sm text-foreground">{notice}</p>}
      {error && <p className="font-body text-sm text-destructive">{error}</p>}

      <div>
        <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">Members ({members.length})</h3>
        {loading ? (
          <p className="font-body text-muted-foreground text-sm">Loading…</p>
        ) : members.length === 0 ? (
          <p className="font-body text-muted-foreground text-sm">No field team members yet.</p>
        ) : (
          <div className="border border-border divide-y divide-border text-sm font-body">
            <div className="grid grid-cols-[1fr_120px_90px_140px] gap-2 p-2 text-xs font-typewriter uppercase tracking-wider text-muted-foreground">
              <span>Email</span><span>Code</span><span>Status</span><span className="text-right">Actions</span>
            </div>
            {members.map((m) => (
              <div key={m.email} className="grid grid-cols-[1fr_120px_90px_140px] gap-2 p-2 items-center">
                <span className="truncate">{m.email}</span>
                <span className="font-typewriter text-xs">{m.code}</span>
                <span className="text-xs">
                  {!m.active ? (
                    <span className="text-muted-foreground">Revoked</span>
                  ) : m.redeemed ? (
                    <span className="text-foreground">Redeemed ✓</span>
                  ) : (
                    <span className="text-muted-foreground">Issued</span>
                  )}
                </span>
                <span className="flex justify-end gap-3 text-xs">
                  <button onClick={() => resend(m)} disabled={busy === m.email} className="text-muted-foreground hover:text-foreground disabled:opacity-40">Resend</button>
                  <button onClick={() => revoke(m)} disabled={busy === m.email} className="text-destructive hover:underline disabled:opacity-40">Revoke</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldTeamAdmin;
