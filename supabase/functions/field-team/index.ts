import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM_ADDRESS = "Coastal Endurance <noreply@coastalendurance.com>";
// One reusable coupon: A$78 off, once. One free single bottle; a bundle just
// gets $78 off. Created on first use so there's no manual Stripe setup.
const COUPON_ID = "field-team-bottle-78-aud";
const SITE = "https://coastalendurance.com";

const stripe = new Stripe(STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });

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
function emailFromAuth(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const parts = header.slice(7).trim().split(".");
  if (parts.length < 2) return null;
  try {
    const p = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const c = JSON.parse(atob(p.padEnd(Math.ceil(p.length / 4) * 4, "=")));
    return c?.role === "authenticated" && typeof c.email === "string" ? c.email : null;
  } catch {
    return null;
  }
}
const isEmail = (s: unknown): s is string => typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return "FIELD-" + [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

async function ensureCoupon(): Promise<void> {
  try {
    await stripe.coupons.retrieve(COUPON_ID);
  } catch {
    await stripe.coupons.create({
      id: COUPON_ID,
      amount_off: 7800,
      currency: "aud",
      duration: "once",
      name: "Field Team — one free bottle",
    });
  }
}

async function findPromo(code: string) {
  const list = await stripe.promotionCodes.list({ code, limit: 1 });
  return list.data[0] ?? null;
}

async function deactivate(code: string) {
  try {
    const p = await findPromo(code);
    if (p && p.active) await stripe.promotionCodes.update(p.id, { active: false });
  } catch (e) {
    console.warn("deactivate failed", code, e);
  }
}

async function sendCodeEmail(to: string, code: string) {
  if (!RESEND_API_KEY) return;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 28px">
      <p style="font-size:13px;font-weight:600;letter-spacing:3px;margin:0">COASTAL ENDURANCE</p>
      <hr style="border:none;border-top:1px solid #d6cfc4;margin:16px 0 24px"/>
      <h1 style="font-size:22px;margin:0 0 16px">You're on the Field Team</h1>
      <p style="font-size:15px;color:#333;line-height:1.6">Here's your code for a free bottle of Field Oil:</p>
      <p style="font-size:24px;letter-spacing:2px;font-weight:600;margin:16px 0;padding:14px 18px;border:1px solid #d6cfc4;text-align:center">${code}</p>
      <p style="font-size:15px;color:#333;line-height:1.6"><strong>Sign in first</strong> with Google at <a href="${SITE}/auth" style="color:#000">coastalendurance.com</a> using this email, then add a single bottle at <a href="${SITE}/product" style="color:#000">the product page</a> and enter this code at checkout. Signing in first means your order shows up in your account, with your Field Team badge.</p>
      <p style="font-size:15px;color:#333;line-height:1.6">The code covers one bottle and works once.</p>
      <p style="font-size:13px;color:#999;margin-top:24px">Coastal Endurance · Made in Australia</p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject: "Your Coastal Endurance field team code", html }),
  });
  if (!res.ok) console.error("field team email failed", res.status, await res.text().catch(() => ""));
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  try {
    const callerEmail = emailFromAuth(req.headers.get("Authorization"));
    if (!callerEmail) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", callerEmail).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const TABLE = "approved_field_team_members";

    // ---- LIST -------------------------------------------------------------
    if (action === "list") {
      const { data: rows } = await admin.from(TABLE).select("email, discount_code, created_at").order("created_at", { ascending: false });
      // Pull redemption status from Stripe for codes tied to our coupon.
      const status = new Map<string, { redeemed: boolean; active: boolean }>();
      try {
        let starting_after: string | undefined;
        for (let i = 0; i < 10; i++) {
          const page = await stripe.promotionCodes.list({ coupon: COUPON_ID, limit: 100, starting_after });
          for (const p of page.data) status.set(p.code, { redeemed: (p.times_redeemed ?? 0) > 0, active: p.active });
          if (!page.has_more) break;
          starting_after = page.data[page.data.length - 1]?.id;
        }
      } catch (e) {
        console.warn("promo status fetch failed", e);
      }
      const members = (rows ?? []).map((r) => ({
        email: r.email,
        code: r.discount_code,
        created_at: r.created_at,
        redeemed: r.discount_code ? status.get(r.discount_code)?.redeemed ?? false : false,
        active: r.discount_code ? status.get(r.discount_code)?.active ?? true : true,
      }));
      return json({ members });
    }

    // ---- ISSUE ------------------------------------------------------------
    if (action === "issue") {
      const email = isEmail(body?.email) ? body.email.trim().toLowerCase() : "";
      if (!email) return json({ error: "Enter a valid email" }, 400);
      await ensureCoupon();

      // If this email already had a code, retire it first.
      const { data: existing } = await admin.from(TABLE).select("id, discount_code").eq("email", email).maybeSingle();
      if (existing?.discount_code) await deactivate(existing.discount_code);

      // Create a unique single-use promotion code (retry on rare code collision).
      let code = "";
      for (let attempt = 0; attempt < 6; attempt++) {
        code = genCode();
        try {
          await stripe.promotionCodes.create({ coupon: COUPON_ID, code, max_redemptions: 1 });
          break;
        } catch (e) {
          if (attempt === 5) throw e;
          code = "";
        }
      }
      if (!code) return json({ error: "Could not generate a code, try again." }, 500);

      if (existing) {
        await admin.from(TABLE).update({ discount_code: code }).eq("id", existing.id);
      } else {
        await admin.from(TABLE).insert({ email, discount_code: code });
      }

      await sendCodeEmail(email, code).catch((e) => console.error("email error", e));
      return json({ code, email, emailed: !!RESEND_API_KEY });
    }

    // ---- RESEND -----------------------------------------------------------
    if (action === "resend") {
      const email = isEmail(body?.email) ? body.email.trim().toLowerCase() : "";
      const { data: row } = await admin.from(TABLE).select("discount_code").eq("email", email).maybeSingle();
      if (!row?.discount_code) return json({ error: "No code on file for that email" }, 404);
      await sendCodeEmail(email, row.discount_code);
      return json({ ok: true });
    }

    // ---- REVOKE -----------------------------------------------------------
    if (action === "revoke") {
      const email = isEmail(body?.email) ? body.email.trim().toLowerCase() : "";
      const { data: row } = await admin.from(TABLE).select("id, discount_code").eq("email", email).maybeSingle();
      if (row?.discount_code) await deactivate(row.discount_code);
      if (row) await admin.from(TABLE).delete().eq("id", row.id);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("field-team error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
