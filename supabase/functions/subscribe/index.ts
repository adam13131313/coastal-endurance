import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const AUDIENCE_NAME = "Coastal Endurance updates";
const SITE = "https://coastalendurance.com";
// List welcome: brand-named sender on the verified hello@ address, replies welcome.
const FROM_ADDRESS = "Coastal Endurance <hello@coastalendurance.com>";

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

// Short thank-you that reiterates the promise. Every send carries a real
// unsubscribe link + a List-Unsubscribe header so Gmail/Yahoo one-click works
// and this stays out of spam.
async function sendWelcome(email: string, token: string) {
  if (!RESEND_API_KEY) return;
  const unsubPage = `${SITE}/unsubscribe?token=${encodeURIComponent(token)}`;
  const unsubPost = `${SUPABASE_URL}/functions/v1/newsletter-unsubscribe?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 28px">
      <p style="font-size:13px;font-weight:600;letter-spacing:3px;margin:0">COASTAL ENDURANCE</p>
      <hr style="border:none;border-top:1px solid #d6cfc4;margin:16px 0 24px"/>
      <p style="font-size:15px;color:#333;line-height:1.6">You're on the list. Thanks.</p>
      <p style="font-size:15px;color:#333;line-height:1.6"><strong>Updates only. No noise.</strong> New products, restocks, and nothing else. You'll hear from us when there's something worth the email — not before.</p>
      <p style="font-size:15px;color:#333;line-height:1.6">That's the whole promise.</p>
      <p style="font-size:15px;color:#333;line-height:1.6">Adam<br/><span style="color:#999">Coastal Endurance · Made in Australia</span></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px"/>
      <p style="font-size:12px;color:#999;line-height:1.5">You're getting this because you subscribed at coastalendurance.com. <a href="${unsubPage}" style="color:#999">Unsubscribe</a> any time.</p>
    </div>`;
  const text = `You're on the list. Thanks.\n\nUpdates only. No noise. New products, restocks, and nothing else. You'll hear from us when there's something worth the email — not before.\n\nThat's the whole promise.\n\nAdam\nCoastal Endurance · Made in Australia\n\nUnsubscribe any time: ${unsubPage}`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: email,
        reply_to: "hello@coastalendurance.com",
        subject: "You're on the list",
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${unsubPost}>, <${unsubPage}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!res.ok) console.warn("welcome email failed", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.warn("sendWelcome error", e);
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

    // Abuse guard: cap signups per IP.
    if (await rateLimited(admin, "subscribe", req, 5, 60)) {
      return json({ error: "Too many requests. Please try again shortly." }, 429);
    }

    // Dedup on email. Decide whether this signup earns a welcome:
    //  - brand new email            → insert, welcome once
    //  - previously unsubscribed    → reactivate (clear unsubscribed_at), welcome again
    //  - already active + welcomed  → no-op (never double-email a returning form submit)
    const { data: existing } = await admin
      .from("newsletter_signups")
      .select("id, token, unsubscribed_at, welcomed_at")
      .eq("email", email)
      .maybeSingle();

    let welcomeToken: string | null = null;
    if (!existing) {
      const { data: inserted, error } = await admin
        .from("newsletter_signups")
        .insert({ email, source })
        .select("token")
        .single();
      if (error) console.warn("newsletter insert failed", error.message);
      else welcomeToken = inserted?.token ?? null;
    } else if (existing.unsubscribed_at || !existing.welcomed_at) {
      await admin.from("newsletter_signups").update({ unsubscribed_at: null }).eq("id", existing.id);
      welcomeToken = existing.token;
    }

    if (welcomeToken) {
      await sendWelcome(email, welcomeToken).catch((e) => console.warn("welcome error", e));
      await admin.from("newsletter_signups").update({ welcomed_at: new Date().toISOString() }).eq("email", email);
    }

    // Sync to the Resend audience (bulk broadcasts + their unsubscribe handling).
    await addToResend(email);

    return json({ ok: true });
  } catch (e) {
    console.error("subscribe error", e);
    // Don't surface internals; the email is likely captured regardless.
    return json({ ok: true });
  }
});
