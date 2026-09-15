import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated. Sends the reviewed shipping notification for one delivery — the
// admin edits the draft (from ship-delivery) in the dispatch modal and this is
// the explicit "send" click. The recipient is always the order's own email
// (never caller-supplied), and every attempt is logged to email_send_log.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Same rationale as send-contact-email: a real, replied-to address reads and
// lands better than noreply@.
const FROM_ADDRESS = "Coastal Endurance <hello@coastalendurance.com>";
const REPLY_TO = "hello@coastalendurance.com";
const TEMPLATE_NAME = "shipping_confirmation";

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null): boolean {
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

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Plain text (as edited by the admin) → simple branded HTML, with bare URLs
// turned into links so the tracking link is clickable.
function brandWrap(text: string): string {
  const body = escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:#333">${u}</a>`)
    .split(/\n{2,}/)
    .map((para) => `<p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 28px">
      <p style="font-size:13px;font-weight:600;letter-spacing:3px;margin:0">COASTAL ENDURANCE</p>
      <hr style="border:none;border-top:1px solid #d6cfc4;margin:16px 0 24px"/>
      ${body}
      <p style="font-size:13px;color:#999;margin-top:24px">Coastal Endurance · Made in Australia</p>
    </div>`;
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  try {
    const caller = emailFromAuth(req.headers.get("Authorization"));
    if (!caller) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", caller).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    if (!RESEND_API_KEY) return json({ error: "Email isn't configured (RESEND_API_KEY missing)." }, 500);

    const body = await req.json().catch(() => ({}));
    const deliveryId = typeof body?.deliveryId === "string" ? body.deliveryId : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 200) : "";
    const text = typeof body?.text === "string" ? body.text.slice(0, 8000) : "";
    if (!deliveryId || !subject || !text.trim()) return json({ error: "Missing deliveryId, subject or text." }, 400);

    const { data: delivery } = await admin
      .from("order_deliveries")
      .select("id, order_id, tracking_number, orders!inner ( email )")
      .eq("id", deliveryId)
      .maybeSingle();
    const to = (delivery as { orders?: { email?: string } } | null)?.orders?.email?.trim() || "";
    if (!delivery || !to.includes("@")) return json({ error: "Delivery not found or the order has no email." }, 404);

    const log = async (status: "sent" | "failed", messageId: string | null, errorMessage?: string) => {
      const { error: logErr } = await admin.from("email_send_log").insert({
        message_id: messageId,
        template_name: TEMPLATE_NAME,
        recipient_email: to,
        status,
        error_message: errorMessage ?? null,
        metadata: { delivery_id: delivery.id, order_id: delivery.order_id, tracking_number: delivery.tracking_number, subject, sent_by: caller },
      });
      if (logErr) console.error("email_send_log insert failed", logErr);
    };

    let res: Response;
    try {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_ADDRESS, to, reply_to: REPLY_TO, subject, html: brandWrap(text), text }),
      });
    } catch (e) {
      await log("failed", null, String(e));
      return json({ error: "Email failed to send." }, 502);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("resend send failed", res.status, detail);
      await log("failed", null, `HTTP ${res.status}: ${detail.slice(0, 500)}`);
      return json({ error: "Email failed to send." }, 502);
    }
    const sent = await res.json().catch(() => null) as { id?: string } | null;
    await log("sent", sent?.id ?? null);

    // Best effort: file it on the contact's CRM timeline too, if they exist there.
    try {
      const { data: contact } = await admin.from("contacts").select("id").eq("email", to.toLowerCase()).maybeSingle();
      if (contact) {
        await admin.from("contact_events").insert({
          contact_id: contact.id,
          type: "email_sent",
          note: `Sent: ${subject}`,
          meta: { subject, via: "app", context: "shipping", delivery_id: delivery.id },
          actor: caller,
        });
      }
    } catch (e) {
      console.error("contact_events insert failed", e);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("send-order-email error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
