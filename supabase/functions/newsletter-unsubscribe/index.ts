import { createClient } from "npm:@supabase/supabase-js@2";

// Public, token-gated unsubscribe. Two callers:
//  1. The /unsubscribe page fetches it (POST { token }).
//  2. Mail providers (Gmail/Yahoo) send a header List-Unsubscribe one-click POST
//     straight to the URL with ?token=... and no auth — hence verify_jwt = false.
// The unguessable per-subscriber token is the credential. We mark our own row
// unsubscribed (source of truth for the admin list) AND flip the Resend audience
// contact so bulk broadcasts stop too.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const AUDIENCE_NAME = "Coastal Endurance updates";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

async function resendAudienceId(): Promise<string | null> {
  if (!RESEND_API_KEY) return null;
  try {
    const res = await fetch("https://api.resend.com/audiences", { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data ?? []).find((a: { name: string; id: string }) => a.name === AUDIENCE_NAME)?.id ?? null;
  } catch {
    return null;
  }
}

async function unsubscribeFromResend(email: string) {
  if (!RESEND_API_KEY) return;
  const audienceId = await resendAudienceId();
  if (!audienceId) return;
  try {
    // Resend accepts the email in the contact path; flag unsubscribed (keeps the record).
    await fetch(`https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ unsubscribed: true }),
    });
  } catch (e) {
    console.warn("resend unsubscribe error", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  let token = url.searchParams.get("token") ?? "";
  if (!token && req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.token === "string") token = body.token;
  }
  token = token.trim();

  const wantsJson = (req.headers.get("accept") ?? "").includes("application/json");
  const done = (ok: boolean) =>
    wantsJson
      ? new Response(JSON.stringify({ ok }), { status: ok ? 200 : 400, headers: { ...cors, "Content-Type": "application/json" } })
      : new Response(
          ok
            ? "You've been unsubscribed. You won't receive further updates from Coastal Endurance."
            : "This unsubscribe link is invalid or has expired.",
          { status: ok ? 200 : 400, headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } },
        );

  if (!token) return done(false);

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: row } = await admin.from("newsletter_signups").select("id, email").eq("token", token).maybeSingle();
    if (!row) return done(false);

    await admin.from("newsletter_signups").update({ unsubscribed_at: new Date().toISOString() }).eq("id", row.id);
    await unsubscribeFromResend(row.email);
    return done(true);
  } catch (e) {
    console.error("newsletter-unsubscribe error", e);
    return done(false);
  }
});
