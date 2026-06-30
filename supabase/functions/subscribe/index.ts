import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const AUDIENCE_NAME = "Coastal Endurance updates";

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null) {
  return o != null && (ALLOWED_ORIGINS.includes(o) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(o) || /^http:\/\/localhost(:\d+)?$/.test(o));
}
function cors(o: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(o) ? o! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}
const isEmail = (s: unknown): s is string => typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Cache the audience id across warm invocations.
let cachedAudienceId: string | null = null;

async function ensureAudience(): Promise<string | null> {
  if (!RESEND_API_KEY) return null;
  if (cachedAudienceId) return cachedAudienceId;
  const auth = { Authorization: `Bearer ${RESEND_API_KEY}` };
  try {
    const list = await fetch("https://api.resend.com/audiences", { headers: auth });
    if (list.ok) {
      const data = await list.json();
      const found = (data?.data ?? []).find((a: { name: string; id: string }) => a.name === AUDIENCE_NAME);
      if (found) return (cachedAudienceId = found.id);
    }
    const create = await fetch("https://api.resend.com/audiences", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name: AUDIENCE_NAME }),
    });
    if (create.ok) {
      const d = await create.json();
      return (cachedAudienceId = d.id ?? null);
    }
    console.warn("ensureAudience create failed", create.status, await create.text().catch(() => ""));
  } catch (e) {
    console.warn("ensureAudience error", e);
  }
  return null;
}

async function addToResend(email: string) {
  const audienceId = await ensureAudience();
  if (!audienceId) return;
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    // A duplicate contact is fine; just log anything unexpected.
    if (!res.ok) console.warn("resend add contact", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.warn("addToResend error", e);
  }
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  try {
    const body = await req.json().catch(() => ({}));
    // Honeypot: real users never fill this. If present, pretend success and drop.
    if (typeof body?.hp === "string" && body.hp.trim() !== "") return json({ ok: true });

    const email = isEmail(body?.email) ? body.email.trim().toLowerCase() : "";
    if (!email) return json({ error: "Enter a valid email" }, 400);
    const source = typeof body?.source === "string" ? body.source.slice(0, 40) : null;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Dedup: only insert if this email isn't already captured.
    const { data: existing } = await admin.from("newsletter_signups").select("id").eq("email", email).maybeSingle();
    if (!existing) {
      const { error } = await admin.from("newsletter_signups").insert({ email, source });
      if (error) console.warn("newsletter insert failed", error.message);
    }

    // Sync to the Resend audience (handles sending + unsubscribe later).
    await addToResend(email);

    return json({ ok: true });
  } catch (e) {
    console.error("subscribe error", e);
    // Don't surface internals; the email is likely captured regardless.
    return json({ ok: true });
  }
});
