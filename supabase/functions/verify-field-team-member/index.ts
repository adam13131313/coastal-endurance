import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { createClient } from "npm:@supabase/supabase-js@2";
import { FieldTeamDiscountEmail } from "../_shared/email-templates/field-team-discount.tsx";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SITE_NAME = "Coastal Endurance";
const SENDER_DOMAIN = "notify.coastalendurance.com";
const FROM_DOMAIN = "coastalendurance.com";
const EMAIL_SUBJECT = "Your Coastal Endurance field team discount";

// Don't re-send a discount email to the same address more than once per cooldown.
// Prevents an attacker from email-bombing an approved member's inbox.
const RESEND_COOLDOWN_MINUTES = 10;

const ALLOWED_ORIGINS = [
  "https://coastalendurance.com",
  "https://www.coastalendurance.com",
];

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed =
    origin != null &&
    (ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function isValidEmail(s: string) {
  return typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("Origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!isValidEmail(email)) {
      return json({ error: "Invalid email" }, 400);
    }

    // Generic response used whether or not the email is approved, so the
    // endpoint can't be used to enumerate which emails are field team members.
    const genericOk = { ok: true };

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await admin
      .from("approved_field_team_members")
      .select("discount_code")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("verify-field-team-member query error", error);
      return json({ error: "Lookup failed" }, 500);
    }

    // Not approved (or no code assigned): return the same generic response and send nothing.
    if (!data?.discount_code) {
      return json(genericOk);
    }

    // Cooldown: skip the send if we already emailed this address recently.
    const cutoff = new Date(Date.now() - RESEND_COOLDOWN_MINUTES * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("email_send_log")
      .select("id")
      .eq("recipient_email", email)
      .eq("template_name", "field_team_discount")
      .in("status", ["pending", "sent"])
      .gte("created_at", cutoff)
      .limit(1)
      .maybeSingle();

    if (recent) {
      return json(genericOk);
    }

    const html = await renderAsync(
      React.createElement(FieldTeamDiscountEmail, {
        siteName: SITE_NAME,
        discountCode: data.discount_code,
      }),
    );
    const text = await renderAsync(
      React.createElement(FieldTeamDiscountEmail, {
        siteName: SITE_NAME,
        discountCode: data.discount_code,
      }),
      { plainText: true },
    );

    const messageId = crypto.randomUUID();

    await admin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "field_team_discount",
      recipient_email: email,
      status: "pending",
    });

    const { error: enqueueError } = await admin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        run_id: crypto.randomUUID(),
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: EMAIL_SUBJECT,
        html,
        text,
        purpose: "transactional",
        label: "field_team_discount",
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue field team discount email", enqueueError);
      await admin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "field_team_discount",
        recipient_email: email,
        status: "failed",
        error_message: "Failed to enqueue email",
      });
      return json({ error: "Failed to send code" }, 500);
    }

    return json(genericOk);
  } catch (e) {
    console.error("verify-field-team-member error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
