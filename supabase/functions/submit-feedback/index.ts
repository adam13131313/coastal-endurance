import { createClient } from "npm:@supabase/supabase-js@2";

// Public endpoint behind the site-wide feedback widget. Feedback can arrive at
// any moment — mid-order included — so this stays open to anonymous visitors:
// honeypot + per-IP rate limit, then straight into the comms log through
// ingest_comms_message. A match (email, then unambiguous name) files it on the
// customer's timeline; anything else waits in Admin -> Inbox. The response never
// says whether the sender matched a contact — that would leak who's in the CRM.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null) {
  return o != null && (ALLOWED_ORIGINS.includes(o) || /^https:\/\/coastal-endurance[a-z0-9-]*\.vercel\.app$/.test(o) || /^http:\/\/localhost(:\d+)?$/.test(o));
}
function cors(o: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(o) ? o! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

const isEmail = (s: unknown): s is string => typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Per-IP rate limit via the hit_rate_limit RPC (hashed IP; fails open on error).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rateLimited(admin: any, prefix: string, req: Request, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "").split(",")[0].trim() || "0.0.0.0";
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ce-rl-v1:" + ip));
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
    const { data } = await admin.rpc("hit_rate_limit", { p_key: `${prefix}:${hex}`, p_max: max, p_window_seconds: windowSeconds });
    return data === false;
  } catch {
    return false;
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

    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
    if (!message) return json({ error: "Say something first." }, 400);

    const email = isEmail(body?.email) ? String(body.email).trim().toLowerCase() : null;
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
    const page = typeof body?.page === "string" ? body.page.trim().slice(0, 200) : "";

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    if (await rateLimited(admin, "feedback", req, 5, 3600)) {
      return json({ error: "Too many messages — try again in a bit." }, 429);
    }

    const who = name || email;
    const { error } = await admin.rpc("ingest_comms_message", {
      p: {
        channel: email ? "email" : "other",
        source: "website",
        direction: "in",
        from_addr: email,
        subject: `Website feedback${who ? ` — ${who}` : ""}${page ? ` (${page})` : ""}`,
        body: message,
        created_by: "website",
        match_emails: email ? [email] : [],
        match_names: name ? [name] : [],
        raw: { page, name: name || null },
        attachments: [],
      },
    });
    if (error) {
      console.error("feedback ingest failed", error.message);
      return json({ error: "Couldn't save that — try again." }, 500);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("submit-feedback error", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
