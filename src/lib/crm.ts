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
  { key: "trialling", label: "Trialling", hint: "Redeemed, using it" },
  { key: "feedback", label: "Feedback in", hint: "Survey received" },
  { key: "advocate", label: "Advocate", hint: "Posted + referred" },
];

export const FT_STAGE_LABEL: Record<string, string> = Object.fromEntries(FT_STAGES.map((s) => [s.key, s.label]));

// Stages that count as "confirmed / said yes" (toward the 15 target).
export const CONFIRMED_STAGES = new Set(["confirmed", "code_sent", "trialling", "feedback", "advocate"]);

export const LOST_REASONS = ["Declined", "No reply", "Didn't redeem", "Not engaged", "Other"];

export const firstName = (c: Contact) => (c.name?.trim().split(/\s+/)[0]) || "mate";

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

// Fill template placeholders for a contact.
export function interpolate(text: string, c: Contact): string {
  return (text ?? "").replace(/\{\{\s*first_name\s*\}\}/g, firstName(c));
}

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
