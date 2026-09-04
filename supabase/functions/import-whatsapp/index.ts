import { createClient } from "npm:@supabase/supabase-js@2";
import { parseWhatsAppExport, whatsAppChatTitle, extractPhones } from "../_shared/comms-parse.ts";

// Paste a WhatsApp chat straight into a customer's page in the admin.
//
// Same parser and same write path as the emailed exports handled by
// inbound-email — this is just the at-the-desk entrance, for when forwarding a
// chat to yourself is more faff than pasting it. Two modes:
//
//   preview: parse and report back (who's in the chat, how many messages) so the
//            admin can confirm which participant is the customer before saving.
//   import:  write them, attributed to the contact whose page you're on.
//
// SECURITY: verify_jwt is left ON for this function (see supabase/config.toml),
// so the Supabase gateway verifies the token's signature before we run. Only
// then do we trust the email claim and check it against the admins table.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null): boolean {
  return o != null && (ALLOWED_ORIGINS.includes(o) ||
    /^https:\/\/coastal-endurance[a-z0-9-]*\.vercel\.app$/.test(o) ||
    /^http:\/\/localhost(:\d+)?$/.test(o));
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

const MAX_CHARS = 1_000_000;

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const caller = emailFromAuth(req.headers.get("Authorization"));
    if (!caller) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", caller).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.slice(0, MAX_CHARS) : "";
    if (!text.trim()) return json({ error: "Paste the chat text first." }, 400);

    const contactId = typeof body?.contactId === "string" ? body.contactId : "";
    const counterparty = typeof body?.counterparty === "string" && body.counterparty.trim()
      ? body.counterparty.trim()
      : whatsAppChatTitle(typeof body?.title === "string" ? body.title : null);
    // The browser knows which clock the export was written in; trust it over a
    // server-side guess, falling back to AEST.
    const tzOffsetMinutes = Number.isFinite(body?.tzOffsetMinutes) ? Number(body.tzOffsetMinutes) : 600;

    const parsed = parseWhatsAppExport(text, {
      counterparty,
      tzOffsetMinutes,
      chatKey: contactId || counterparty || null,
    });

    if (parsed.messages.length === 0) {
      return json({
        error: "That doesn't look like a WhatsApp export — no timestamped messages in it.",
        participants: parsed.participants,
      }, 422);
    }

    // Preview: tell the admin what we found, write nothing.
    if (body?.preview) {
      return json({
        ok: true,
        preview: true,
        participants: parsed.participants,
        counterparty: parsed.counterparty,
        count: parsed.messages.length,
        first: parsed.messages[0],
        last: parsed.messages[parsed.messages.length - 1],
      });
    }

    if (!contactId) return json({ error: "Missing contactId." }, 400);

    const matchPhones = [...new Set([...parsed.phones, ...extractPhones(counterparty)])];
    let imported = 0, duplicates = 0;

    for (const m of parsed.messages) {
      const { data, error } = await admin.rpc("ingest_comms_message", {
        p: {
          channel: "whatsapp",
          source: "whatsapp_export",
          direction: m.direction,
          from_addr: m.direction === "in" ? m.sender : null,
          to_addr: m.direction === "out" ? m.sender : null,
          subject: counterparty ? `WhatsApp with ${counterparty}` : "WhatsApp",
          body: m.body,
          occurred_at: m.occurredAt,
          external_id: m.externalId,
          created_by: caller,
          // We're on the customer's page — no guessing needed.
          contact_id: contactId,
          match_phones: matchPhones,
          match_names: counterparty ? [counterparty] : [],
          raw: {
            counterparty, participants: parsed.participants,
            thread: counterparty ?? contactId, sender: m.sender, pasted_by: caller,
          },
        },
      });
      if (error) { console.error("ingest failed", error.message); continue; }
      const r = data as { duplicate?: boolean } | null;
      if (r?.duplicate) duplicates++; else imported++;
    }

    return json({
      ok: true,
      imported,
      duplicates,
      total: parsed.messages.length,
      participants: parsed.participants,
      counterparty: parsed.counterparty,
    });
  } catch (e) {
    console.error("import-whatsapp error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
