import { createClient } from "npm:@supabase/supabase-js@2";

// Marks a delivery shipped and returns a DRAFT of the customer notification for
// the admin to review, edit and explicitly send (via send-order-email). This
// function itself never emails the customer.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Fallback copy if the shipping_confirmation template is missing from
// email_templates (kept in sync with the seeded template).
const DEFAULT_SUBJECT = "Your Coastal Endurance order has shipped";
const DEFAULT_BODY = `Hi {{first_name}},

Shipment {{sequence}} of your order was posted on {{shipped_on}}.

Tracking number: {{tracking_number}}
Track it here: {{tracking_url}}

Sent with Australia Post. Tracking can take up to 24 hours to show its first scan. Standard delivery is usually a few business days within Australia; international orders take longer and may pass through customs on arrival.`;

const ALLOWED_ORIGINS = [
  "https://coastalendurance.com",
  "https://www.coastalendurance.com",
];

function originAllowed(origin: string | null): boolean {
  return (
    origin != null &&
    (ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/coastal-endurance[a-z0-9-]*\.vercel\.app$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin))
  );
}
function corsHeadersFor(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(origin) ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

// "2026-09-11" → "11 September 2026" (built from the string, no timezone math).
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function niceDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// Email of the signed-in caller (from their Supabase JWT), if authenticated.
function emailFromAuth(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const parts = header.slice(7).trim().split(".");
  if (parts.length < 2) return null;
  try {
    const p = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const claims = JSON.parse(atob(p.padEnd(Math.ceil(p.length / 4) * 4, "=")));
    return claims?.role === "authenticated" && typeof claims.email === "string" ? claims.email : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("Origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const email = emailFromAuth(req.headers.get("Authorization"));
    if (!email) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Caller must be an admin.
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", email).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const deliveryId = typeof body?.deliveryId === "string" ? body.deliveryId : "";
    const tracking = typeof body?.trackingNumber === "string" ? body.trackingNumber.trim() : "";
    if (!deliveryId) return json({ error: "Missing deliveryId" }, 400);

    // Optional actual dispatch date (YYYY-MM-DD) — staff may record a shipment
    // a day or two after posting it. Defaults to today in Australia (the
    // function runs in UTC, which lags Australian dates by up to 11 hours).
    const todayAu = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
    let shippedOn = todayAu;
    if (body?.shippedOn != null) {
      const s = typeof body.shippedOn === "string" ? body.shippedOn.trim() : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(Date.parse(`${s}T00:00:00Z`))) {
        return json({ error: "Invalid shipped-on date" }, 400);
      }
      if (s > todayAu) return json({ error: "Shipped-on date can't be in the future" }, 400);
      shippedOn = s;
    }
    // Midday Sydney time, so the stored timestamp reads as the same calendar
    // day whether it's rendered in UTC or an Australian timezone.
    const shippedAt = shippedOn === todayAu ? new Date().toISOString() : `${shippedOn}T02:00:00.000Z`;

    const { data: delivery, error: dErr } = await admin
      .from("order_deliveries")
      .update({ status: "shipped", shipped_at: shippedAt, tracking_number: tracking || null })
      .eq("id", deliveryId)
      .select("id, sequence, order_id")
      .maybeSingle();

    if (dErr || !delivery) {
      console.error("ship update failed", dErr);
      return json({ error: "Update failed" }, 500);
    }

    // Build the notification DRAFT for the admin to review — no email is sent here.
    const { data: order } = await admin
      .from("orders")
      .select("email, shipping_name")
      .eq("id", delivery.order_id)
      .maybeSingle();

    let draft: { to: string; subject: string; text: string } | null = null;
    if (order?.email) {
      const { data: tpl } = await admin
        .from("email_templates")
        .select("subject, body")
        .eq("key", "shipping_confirmation")
        .eq("active", true)
        .maybeSingle();

      const firstName = (order.shipping_name ?? "").trim().split(/\s+/)[0] || "there";
      // Australia Post tracking deep-link (their carrier). The article ID also
      // works for international AusPost lodgements.
      const trackUrl = tracking
        ? `https://auspost.com.au/mypost/track/#/details/${encodeURIComponent(tracking)}`
        : "";

      let body = tpl?.body || DEFAULT_BODY;
      if (!tracking) {
        // No tracking yet: drop the tracking lines rather than leaving blanks.
        body = body
          .split("\n")
          .filter((l) => !/\{\{\s*tracking/.test(l) && !/Australia Post/.test(l))
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trimEnd();
        body += "\n\nWe'll follow up with tracking details shortly.";
      }
      const fill = (s: string) =>
        s
          .replace(/\{\{\s*first_name\s*\}\}/g, firstName)
          .replace(/\{\{\s*sequence\s*\}\}/g, String(delivery.sequence))
          .replace(/\{\{\s*shipped_on\s*\}\}/g, niceDate(shippedOn))
          .replace(/\{\{\s*tracking_number\s*\}\}/g, tracking)
          .replace(/\{\{\s*tracking_url\s*\}\}/g, trackUrl);

      draft = { to: order.email, subject: fill(tpl?.subject || DEFAULT_SUBJECT), text: fill(body) };
    }

    return json({ ok: true, draft });
  } catch (e) {
    console.error("ship-delivery error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
