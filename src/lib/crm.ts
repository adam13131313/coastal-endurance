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

// CRM email templates. The admin picks one, edits the pre-filled text, then sends via
// the app (logged) or copies it to send themselves. `stageOnSend` optionally advances
// the pipeline after sending. The code email (B) is handled by the "Issue code" action.
export interface EmailTemplate {
  key: string;
  label: string;
  eventType: string;
  stageOnSend?: string;
  subject: (c: Contact) => string;
  body: (c: Contact) => string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: "invite", label: "Invite", eventType: "invite_sent", stageOnSend: "invited",
    subject: () => "Want first crack at something I've built?",
    body: (c) => `${firstName(c)} — I've made a daily face oil for blokes who've copped decades of sun, salt and wind. Before it goes out properly I'm giving free bottles to a handful of people whose opinion I actually trust — you're one.

No cost, no catch. If you're in, I'll send a code for a free bottle; use it a few weeks and give me an honest verdict.

Keen? Just reply.`,
  },
  {
    key: "checkin", label: "Day-5 check-in", eventType: "email_sent",
    subject: () => "How's the Field Oil going?",
    body: (c) => `${firstName(c)} — a few days in, any first impressions? Texture, smell, how your skin feels after a session outdoors?

Even one line back helps. Cheers.`,
  },
  {
    key: "survey", label: "Day-21 survey", eventType: "email_sent",
    subject: () => "Two minutes on the Field Oil?",
    body: (c) => `${firstName(c)} — you've had it about three weeks now. Mind giving me your honest take? A few quick questions:

1. Been using it daily?
2. 0–10, how likely to recommend it to a mate like you?
3. What did you notice, if anything?
4. Would you buy it at $78?
5. Up for a quick honest post tagging @coastalendurance?

Just reply with your answers — no wrong ones.`,
  },
  {
    key: "content_ask", label: "Content ask", eventType: "email_sent",
    subject: () => "One favour",
    body: (c) => `${firstName(c)} — glad you're rating it. If you're up for it: one honest post or story tagging @coastalendurance, and tell a couple of mates who'd get it.

No pressure, and no worries if not.`,
  },
  {
    key: "thankyou", label: "Thank you", eventType: "email_sent",
    subject: () => "Legend — thank you",
    body: (c) => `${firstName(c)} — saw your post, genuinely appreciate it. It makes a real difference this early.

If a mate wants to try it, tell them to get in touch. Cheers.`,
  },
  {
    key: "close", label: "Graceful close", eventType: "email_sent",
    subject: () => "No worries",
    body: (c) => `${firstName(c)} — all good, thanks for considering it. If you ever want to give it a go, just shout.`,
  },
];

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
