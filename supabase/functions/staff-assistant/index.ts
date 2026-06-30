import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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

const SYSTEM = `You are the internal staff assistant for Coastal Endurance, an Australian men's skincare store that sells one product, Field Oil.

Facts about the operation:
- Field Oil sells as a single bottle ($78 AUD) or a prepaid 12-month bundle ($234): 4 bottles for the price of 3, shipped on a schedule the customer picks (default every 3 months). The bundle is paid once upfront.
- Staff fulfil orders in the admin area (/admin): the "To ship" tab is the dispatch queue (overdue items in bold); enter a tracking number and click "Mark shipped" to send and auto-email the customer their tracking. "Mark order fulfilled" closes an order once all shipments are sent.
- Refunds are done in Stripe (Payments > the order > Refund); the store then auto-marks the order refunded, cancels pending shipments, restocks the bottles, and emails admins. Staff should NOT change refunds by hand in the database.
- Stock, prices, and the staff (admins) list are edited in the Supabase dashboard (Table Editor: products.stock_quantity, product_variants.price_cents where 7800 = $78.00, admins).
- The store auto-emails: new-order alerts, low-stock alerts (<=10 bottles), a daily "shipments to send" digest, and refund confirmations.
- Systems: Vercel hosts the site, Supabase is the backend/database/logins, Stripe handles payments, Resend sends email, Google is sign-in.

Answer staff questions concisely and practically. If something requires an action you can't see (specific order data, real numbers), tell them which admin tab or console to look in. If you don't know, say so. Do not invent policies. Never use em dashes.`;

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

    if (!ANTHROPIC_API_KEY) return json({ error: "The assistant isn't configured yet (missing API key)." }, 503);

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const clean = messages
      .filter((m: unknown): m is { role: string; content: string } =>
        !!m && typeof (m as { content?: unknown }).content === "string" &&
        ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant"))
      .slice(-12)
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (clean.length === 0) return json({ error: "No message" }, 400);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: clean,
      }),
    });
    if (!res.ok) {
      console.error("anthropic error", res.status, await res.text().catch(() => ""));
      return json({ error: "The assistant is unavailable right now." }, 502);
    }
    const data = await res.json();
    const reply = (data?.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n").trim();
    return json({ reply: reply || "Sorry, I couldn't answer that." });
  } catch (e) {
    console.error("staff-assistant error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
