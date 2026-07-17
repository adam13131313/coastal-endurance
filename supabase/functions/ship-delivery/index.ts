import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDRESS = "Coastal Endurance <noreply@coastalendurance.com>";

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

    const { data: delivery, error: dErr } = await admin
      .from("order_deliveries")
      .update({ status: "shipped", shipped_at: new Date().toISOString(), tracking_number: tracking || null })
      .eq("id", deliveryId)
      .select("id, sequence, order_id")
      .maybeSingle();

    if (dErr || !delivery) {
      console.error("ship update failed", dErr);
      return json({ error: "Update failed" }, 500);
    }

    // Notify the customer their shipment is on the way.
    const { data: order } = await admin.from("orders").select("email").eq("id", delivery.order_id).maybeSingle();
    if (RESEND_API_KEY && order?.email) {
      const trackingLine = tracking
        ? `<p style="font-size:15px;color:#333">Tracking number: <strong>${tracking}</strong></p>`
        : "";
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 28px">
          <p style="font-size:13px;font-weight:600;letter-spacing:3px;margin:0">COASTAL ENDURANCE</p>
          <hr style="border:none;border-top:1px solid #d6cfc4;margin:16px 0 24px"/>
          <h1 style="font-size:22px;margin:0 0 16px">Your Field Oil 001 is on its way</h1>
          <p style="font-size:15px;color:#333;line-height:1.6">Shipment ${delivery.sequence} of your order has been dispatched.</p>
          ${trackingLine}
          <p style="font-size:13px;color:#999;margin-top:24px">Coastal Endurance · Made in Australia</p>
        </div>`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM_ADDRESS, to: order.email, subject: "Your Coastal Endurance order has shipped", html }),
        });
      } catch (e) {
        console.error("shipped email failed", e);
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error("ship-delivery error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
