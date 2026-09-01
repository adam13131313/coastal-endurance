import { createClient } from "npm:@supabase/supabase-js@2";
import {
  parseForwardedEmail,
  parseWhatsAppExport,
  whatsAppChatTitle,
  looksLikeWhatsAppExport,
  extractPhones,
  htmlToText,
} from "../_shared/comms-parse.ts";

// INBOUND CRM MAILBOX. Anything forwarded (or cc'd) to the CRM address arrives
// here as a Resend `email.received` webhook, gets matched to a customer, and is
// filed on their timeline. Two kinds of mail are handled:
//
//   1. An ordinary email conversation — we read the forward header block to
//      recover who it was really with, and file one message.
//   2. A WhatsApp chat export ("Export chat" -> Mail) — we pull the _chat.txt
//      attachment and file every message in it individually.
//
// Nothing is ever guessed onto the wrong person: if the contact can't be
// identified the message is stored unfiled and appears in Admin -> Inbox for a
// human to assign. See ingest_comms_message() for the write path.
//
// SECURITY: verify_jwt is off (Resend has no Supabase JWT), so this endpoint is
// public. It is protected instead by the Svix signature Resend sends, verified
// below against INBOUND_WEBHOOK_SECRET. Without that secret configured the
// function refuses every request — an unauthenticated writer into the CRM would
// be worse than an inbox that doesn't work yet.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("INBOUND_WEBHOOK_SECRET");

// Every address that is us. A message from one of these is outbound, and none of
// them is ever treated as the customer.
const OUR_ADDRESSES = (Deno.env.get("CRM_OUR_ADDRESSES") ??
  "hello@coastalendurance.com,noreply@coastalendurance.com,adam.s.hyde@gmail.com")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

// Wall clock of the phone/laptop these exports and forwards come from. AEST.
const TZ_OFFSET_MINUTES = Number(Deno.env.get("CRM_TZ_OFFSET_MINUTES") ?? "600");

// ---------------------------------------------------------------------------
// Svix signature verification (the scheme Resend uses for webhooks)
// ---------------------------------------------------------------------------
const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const bytesToB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

/** Constant-time compare, so a wrong signature can't be probed byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySignature(req: Request, body: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return false;
  const id = req.headers.get("svix-id") ?? req.headers.get("webhook-id");
  const ts = req.headers.get("svix-timestamp") ?? req.headers.get("webhook-timestamp");
  const sigHeader = req.headers.get("svix-signature") ?? req.headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;

  // Reject anything more than five minutes old, so a captured request can't be
  // replayed later.
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;

  const secret = WEBHOOK_SECRET.startsWith("whsec_") ? WEBHOOK_SECRET.slice(6) : WEBHOOK_SECRET;
  const key = await crypto.subtle.importKey(
    "raw", b64ToBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`));
  const expected = bytesToB64(mac);

  // The header carries a space-separated list of "v1,<sig>" (key rotation).
  return sigHeader.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    return version === "v1" && sig && timingSafeEqual(sig, expected);
  });
}

// ---------------------------------------------------------------------------
// Resend receiving API
// ---------------------------------------------------------------------------
interface ReceivedEmail {
  id: string;
  from?: string; to?: string[]; cc?: string[];
  subject?: string; text?: string | null; html?: string | null;
  created_at?: string;
  headers?: Record<string, string>;
  attachments?: { id: string; filename?: string; content_type?: string; size?: number }[];
}

async function resendGet<T>(path: string): Promise<T | null> {
  if (!RESEND_API_KEY) return null;
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  if (!res.ok) {
    console.error("resend GET failed", path, res.status, await res.text().catch(() => ""));
    return null;
  }
  return await res.json() as T;
}

/** Fetch the first plain-text attachment's contents (the WhatsApp _chat.txt). */
async function fetchChatAttachment(emailId: string): Promise<{ filename: string; text: string } | null> {
  const list = await resendGet<{ data?: { id: string; filename?: string; content_type?: string; download_url?: string }[] }>(
    `/emails/receiving/${emailId}/attachments`,
  );
  const files = list?.data ?? [];
  const chat = files.find((f) =>
    /\.txt$/i.test(f.filename ?? "") || (f.content_type ?? "").startsWith("text/plain"));
  if (!chat?.download_url) return null;

  const res = await fetch(chat.download_url);
  if (!res.ok) {
    console.error("attachment download failed", res.status);
    return null;
  }
  // Chat exports are small; cap anyway so one huge history can't blow the function.
  const text = (await res.text()).slice(0, 2_000_000);
  return { filename: chat.filename ?? "chat.txt", text };
}

// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const rawBody = await req.text();

  if (!WEBHOOK_SECRET) {
    console.error("INBOUND_WEBHOOK_SECRET is not set — refusing to accept inbound mail");
    return json({ error: "Inbound mail is not configured." }, 503);
  }
  if (!await verifySignature(req, rawBody)) return json({ error: "Bad signature" }, 401);

  let event: { type?: string; data?: { email_id?: string; id?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }

  // Resend sends several event types down one webhook; we only want received mail.
  if (event.type !== "email.received") return json({ ok: true, ignored: event.type ?? "unknown" });

  const emailId = event.data?.email_id ?? event.data?.id;
  if (!emailId) return json({ error: "No email id" }, 400);

  // The webhook carries metadata only — body and attachments come from the API.
  const mail = await resendGet<ReceivedEmail>(`/emails/receiving/${emailId}`);
  if (!mail) return json({ error: "Couldn't fetch the email" }, 502);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const ingest = async (payload: Record<string, unknown>) => {
    const { data, error } = await admin.rpc("ingest_comms_message", { p: payload });
    if (error) console.error("ingest failed", error.message);
    return data as { matched?: boolean; duplicate?: boolean } | null;
  };

  const attachments = (mail.attachments ?? []).map((a) => ({
    filename: a.filename, content_type: a.content_type, size: a.size,
  }));
  const receivedAt = mail.created_at ?? new Date().toISOString();

  try {
    // ---------------------------------------------------------------- WhatsApp
    const attachmentName = mail.attachments?.[0]?.filename ?? null;
    const inlineText = mail.text ?? htmlToText(mail.html);
    const chatTitle = whatsAppChatTitle(mail.subject, attachmentName);
    const isExport = looksLikeWhatsAppExport(inlineText, mail.subject, attachmentName);

    if (isExport) {
      // iOS/Android attach the transcript; some clients paste it inline instead.
      const attached = mail.attachments?.length ? await fetchChatAttachment(emailId) : null;
      const transcript = attached?.text ?? inlineText;
      const counterparty = chatTitle ?? whatsAppChatTitle(attached?.filename);

      const parsed = parseWhatsAppExport(transcript, {
        counterparty,
        tzOffsetMinutes: TZ_OFFSET_MINUTES,
        chatKey: counterparty ?? emailId,
      });

      if (parsed.messages.length === 0) {
        console.warn("whatsapp export had no readable messages", emailId);
        return json({ ok: true, channel: "whatsapp", imported: 0 });
      }

      // Everyone in the chat who isn't the counterparty is us; match on their
      // name and any phone number the export exposes.
      const matchNames = counterparty ? [counterparty] : parsed.participants;
      const matchPhones = [...new Set([...parsed.phones, ...extractPhones(counterparty)])];

      let matched = 0;
      for (const m of parsed.messages) {
        const r = await ingest({
          channel: "whatsapp",
          source: "whatsapp_export",
          direction: m.direction,
          from_addr: m.direction === "in" ? m.sender : null,
          to_addr: m.direction === "out" ? m.sender : null,
          subject: counterparty ? `WhatsApp with ${counterparty}` : "WhatsApp",
          body: m.body,
          occurred_at: m.occurredAt,
          external_id: m.externalId,
          created_by: "inbound",
          match_emails: [],
          match_phones: matchPhones,
          match_names: matchNames,
          raw: {
            counterparty, participants: parsed.participants,
            thread: counterparty ?? emailId, sender: m.sender, resend_email_id: emailId,
          },
          attachments: [],
        });
        if (r?.matched) matched++;
      }

      console.log(`whatsapp export: ${parsed.messages.length} messages, ${matched} filed`, { counterparty });
      return json({ ok: true, channel: "whatsapp", imported: parsed.messages.length, filed: matched });
    }

    // ------------------------------------------------------------------- Email
    const parsed = parseForwardedEmail({
      from: mail.from, to: mail.to, cc: mail.cc,
      subject: mail.subject, text: mail.text, html: mail.html,
      receivedAt,
    }, OUR_ADDRESSES, TZ_OFFSET_MINUTES);

    const result = await ingest({
      channel: "email",
      source: "inbound_email",
      direction: parsed.direction,
      from_addr: parsed.fromAddr,
      to_addr: parsed.toAddr,
      subject: parsed.subject,
      body: parsed.body,
      occurred_at: parsed.occurredAt ?? receivedAt,
      external_id: `resend_${emailId}`,
      created_by: "inbound",
      match_emails: parsed.matchEmails,
      match_phones: [],
      match_names: parsed.correspondent.name ? [parsed.correspondent.name] : [],
      raw: {
        forwarded: parsed.wasForwarded,
        forwarded_by: mail.from ?? null,
        correspondent_name: parsed.correspondent.name,
        resend_email_id: emailId,
        message_id: mail.headers?.["message-id"] ?? null,
      },
      attachments,
    });

    console.log("inbound email filed", { emailId, matched: result?.matched, forwarded: parsed.wasForwarded });
    return json({ ok: true, channel: "email", filed: !!result?.matched });
  } catch (e) {
    console.error("inbound-email error", e);
    // 500 makes Resend retry; the external_id dedupe keeps that safe.
    return json({ error: "Unexpected error" }, 500);
  }
});
