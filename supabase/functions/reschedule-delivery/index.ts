import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
const isIsoDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  try {
    const email = emailFromAuth(req.headers.get("Authorization"));
    if (!email) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", email).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const deliveryId = typeof body?.deliveryId === "string" ? body.deliveryId : "";
    const scheduledFor = body?.scheduledFor;
    if (!deliveryId || !isIsoDate(scheduledFor)) return json({ error: "Bad request" }, 400);

    // Only reschedule shipments that haven't gone out yet.
    const { data: delivery } = await admin
      .from("order_deliveries")
      .select("id, status")
      .eq("id", deliveryId)
      .maybeSingle();
    if (!delivery) return json({ error: "Delivery not found" }, 404);
    if (delivery.status !== "scheduled") return json({ error: "That shipment has already gone out." }, 409);

    const { error } = await admin
      .from("order_deliveries")
      .update({ scheduled_for: scheduledFor })
      .eq("id", deliveryId)
      .eq("status", "scheduled");
    if (error) {
      console.error("reschedule failed", error);
      return json({ error: "Could not update the date." }, 500);
    }
    return json({ ok: true, scheduled_for: scheduledFor });
  } catch (e) {
    console.error("reschedule-delivery error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
