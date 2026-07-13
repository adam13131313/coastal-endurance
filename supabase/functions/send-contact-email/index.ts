import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated. Sends a one-off CRM email (invite, check-in, survey, etc.) to a
// contact via Resend and logs it on the contact's timeline. The admin composes and
// edits the text in the board before sending; we wrap it in the brand shell here.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDRESS = "Coastal Endurance <noreply@coastalendurance.com>";
const REPLY_TO = "hello@coastalendurance.com";

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

// Plain text (as edited by the admin) → simple branded HTML.
function brandWrap(text: string): string {
  const body = escapeHtml(text)
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
    const contactId = typeof body?.contactId === "string" ? body.contactId : "";
    const to = typeof body?.to === "string" && body.to.includes("@") ? body.to.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 200) : "";
    const text = typeof body?.text === "string" ? body.text.slice(0, 8000) : "";
    const eventType = typeof body?.eventType === "string" ? body.eventType.slice(0, 40) : "email_sent";
    if (!contactId || !to || !subject || !text.trim()) return json({ error: "Missing contactId, to, subject or text." }, 400);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to, reply_to: REPLY_TO, subject, html: brandWrap(text), text }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("resend send failed", res.status, detail);
      return json({ error: "Email failed to send." }, 502);
    }

    await admin.from("contact_events").insert({
      contact_id: contactId,
      type: eventType,
      note: `Sent: ${subject}`,
      meta: { subject, via: "app" },
      actor: caller,
    });

    return json({ ok: true });
  } catch (e) {
    console.error("send-contact-email error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
