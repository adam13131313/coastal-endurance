// Shared types + helpers for the CRM (contacts / pipelines / events). Field Team is
// the first pipeline. New tables aren't in the generated Supabase types yet, so we
// read/write through a loosely-typed client (same idiom as the rest of admin).
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sb = supabase as any;

export interface Contact {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  source: string | null;
  country: string | null;
  region: string | null;
  preferred_currency: string;
  marketing_consent: boolean;
  tags: string[];
  notes: string | null;
  user_id: string | null;   // set when the contact has created an account (membership)
  created_at: string;
}

export interface FieldTeamRow {
  id: string;            // contact_pipelines row id
  contact_id: string;
  pipeline: string;
  stage: string;
  status: "active" | "lost" | "won";
  lost_reason: string | null;
  stage_entered_at: string;
  meta: { discount_code?: string; redeemed?: boolean } & Record<string, unknown>;
  created_at: string;
  contacts: Contact;
}

export interface ContactEvent {
  id: string;
  contact_id: string;
  type: string;
  note: string | null;
  meta: Record<string, unknown>;
  actor: string | null;
  created_at: string;
}

// Field Team pipeline stages, in order. Lost is a status, shown as its own column.
export const FT_STAGES: { key: string; label: string; hint: string }[] = [
  { key: "prospect", label: "Prospect", hint: "Someone you want to invite" },
  { key: "invited", label: "Invited", hint: "Invite sent, awaiting reply" },
  { key: "confirmed", label: "Confirmed", hint: "Said yes — issue a code" },
  { key: "code_sent", label: "Code sent", hint: "Free-bottle code issued" },
  { key: "ordered", label: "Ordered", hint: "Code applied, bottle ordered" },
  { key: "trialling", label: "Trialling", hint: "Bottle in hand, using it" },
  { key: "feedback", label: "Feedback in", hint: "Survey received" },
  { key: "advocate", label: "Advocate", hint: "Posted + referred" },
];

export const FT_STAGE_LABEL: Record<string, string> = Object.fromEntries(FT_STAGES.map((s) => [s.key, s.label]));

// Stages that count as "confirmed / said yes" (toward the 15 target).
export const CONFIRMED_STAGES = new Set(["confirmed", "code_sent", "ordered", "trialling", "feedback", "advocate"]);

export const LOST_REASONS = ["Declined", "No reply", "Didn't redeem", "Not engaged", "Other"];

export const firstName = (c: Contact) => (c.name?.trim().split(/\s+/)[0]) || "mate";

// WhatsApp deep link. wa.me wants digits only, no +, spaces or punctuation. We
// can't reliably guess a country code for a bare local number, so a number with
// no leading + is passed through as its digits and left to the operator to have
// stored in full international form. Returns null when there's nothing usable.
export const waLink = (phone: string | null | undefined, text?: string): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 6) return null;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};

// tel: link for a plain phone tap-to-call. Keeps a leading +.
export const telLink = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.length >= 6 ? `tel:${cleaned}` : null;
};

// Email templates live in the DB (public.email_templates), editable in the Comms
// library. {{first_name}} is filled per contact at compose time.
export interface EmailTemplate {
  id: string;
  key: string;
  label: string;
  subject: string;
  body: string;
  event_type: string;
  stage_on_send: string | null;
  sort: number;
  active: boolean;
}

// Fill template placeholders for a contact. {{code}} comes from the pipeline row's
// issued discount code; if none exists yet the placeholder says so (visible in the
// editable compose box, so it can't slip out unnoticed).
export function interpolate(text: string, c: Contact, extras?: { code?: string | null }): string {
  return (text ?? "")
    .replace(/\{\{\s*first_name\s*\}\}/g, firstName(c))
    .replace(/\{\{\s*code\s*\}\}/g, extras?.code || "[no code issued yet — click Issue code first]");
}

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

// --------------------------------------------------------------------- comms
// One row per message on a customer's timeline. Manual entries come from the
// "Log a message" form; the rest arrive on their own — a mail forwarded or cc'd
// to the CRM address, or a WhatsApp export. A message with status 'unfiled'
// couldn't be matched to anyone and waits in Admin -> Inbox.
export interface CommsMessage {
  id: string;
  channel: string;                    // email | whatsapp | call | sms | other
  direction: "in" | "out";
  from_addr: string | null;
  to_addr: string | null;
  subject: string | null;
  body: string;
  occurred_at: string;
  created_by: string | null;
  source: string;                     // manual | inbound_email | whatsapp_export
  external_id: string | null;
  status: "filed" | "unfiled" | "ignored";
  raw: Record<string, unknown>;
  attachments: { filename?: string; content_type?: string; size?: number }[];
}

export const CHANNEL_LABEL: Record<string, string> = {
  email: "Email", whatsapp: "WhatsApp", call: "Call", sms: "SMS", other: "Msg",
};

// Shown as a small badge so it's always obvious whether a message was typed in
// by hand or filed automatically.
export const SOURCE_LABEL: Record<string, string> = {
  manual: "Logged by hand", inbound_email: "Forwarded in", whatsapp_export: "WhatsApp import",
};

/** A one-line "who was this with" for an unfiled message in the review queue. */
export function messageWho(m: CommsMessage): string {
  const raw = m.raw ?? {};
  const counterparty = typeof raw.counterparty === "string" ? raw.counterparty : null;
  const name = typeof raw.correspondent_name === "string" ? raw.correspondent_name : null;
  const addr = m.direction === "in" ? m.from_addr : m.to_addr;
  return counterparty || [name, addr].filter(Boolean).join(" · ") || addr || "Unknown sender";
}

/** Unfiled WhatsApp messages arrive as a batch; group them so one click files the chat. */
export function threadKey(m: CommsMessage): string {
  const t = (m.raw ?? {}).thread;
  return typeof t === "string" && t ? `${m.channel}:${t}` : `msg:${m.id}`;
}
