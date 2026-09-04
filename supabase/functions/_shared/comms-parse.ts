// Parsing for inbound comms: forwarded/cc'd emails, and WhatsApp chat exports.
//
// Deliberately dependency-free and side-effect-free — no Deno APIs, no fetch, no
// clock — so the same code runs in the edge functions and under vitest. The
// formats here (Gmail/Apple/Outlook forward headers, iOS/Android WhatsApp
// exports) are the kind of thing that silently drifts, so they have tests.

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function extractEmails(s: string | null | undefined): string[] {
  if (!s) return [];
  const out = (s.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase());
  return [...new Set(out)];
}

/** Last 9 digits, or null if there aren't at least 8 — mirrors public.norm_phone. */
export function normPhone(s: string | null | undefined): string | null {
  const digits = (s ?? "").replace(/[^0-9]/g, "");
  return digits.length >= 8 ? digits.slice(-9) : null;
}

/** Phone-shaped runs of text (+61 412 345 678, 0412-345-678, (02) 9876 5432). */
export function extractPhones(s: string | null | undefined): string[] {
  if (!s) return [];
  const hits = s.match(/\+?[\d][\d\s().-]{6,}\d/g) ?? [];
  return [...new Set(hits.map((h) => h.trim()).filter((h) => normPhone(h)))];
}

/** "Jane Smith <jane@x.com>" -> {name, email}. Handles a bare address too. */
export function parseAddress(raw: string | null | undefined): { name: string | null; email: string | null } {
  const s = (raw ?? "").trim();
  if (!s) return { name: null, email: null };
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) {
    const name = m[1].trim();
    return { name: name || null, email: m[2].trim().toLowerCase() };
  }
  const found = extractEmails(s);
  return { name: found.length ? null : s || null, email: found[0] ?? null };
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ",
};

/** Good-enough HTML -> text. Only used when a mail has no text/plain part. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&[a-z]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Stable, dependency-free id for dedupe (djb2-ish, hex). Not a security hash. */
export function stableId(...parts: (string | number | null | undefined)[]): string {
  const s = parts.map((p) => String(p ?? "")).join(" ");
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 31) ^ (c + i);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return hex(h1) + hex(h2);
}

// ---------------------------------------------------------------------------
// Forwarded email
// ---------------------------------------------------------------------------

export interface RawEmail {
  from?: string | null;              // envelope sender (whoever forwarded it)
  to?: string[] | string | null;
  cc?: string[] | string | null;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
  receivedAt?: string | null;        // ISO, when the CRM address got it
}

export interface ParsedEmail {
  /** Who we should file this against, once matched. */
  correspondent: { name: string | null; email: string | null };
  direction: "in" | "out";
  subject: string | null;
  body: string;
  occurredAt: string | null;         // ISO, or null if the header date was unreadable
  fromAddr: string | null;
  toAddr: string | null;
  matchEmails: string[];
  /** True when we found and stripped a forward header block. */
  wasForwarded: boolean;
}

const FORWARD_MARKER =
  /^[\s>*_-]*(?:-{2,}\s*Forwarded message\s*-{2,}|Begin forwarded message:|-{2,}\s*Original Message\s*-{2,})[\s>*_-]*$/i;

const HEADER_LINE = /^\s*[>\s]*\**\s*(From|To|Cc|CC|Date|Sent|Subject|Reply-To)\s*\**\s*:\s*(.*)$/i;

/**
 * Read a From:/To:/Date:/Subject: block starting at `startLine`.
 * Returns the headers plus the index of the first line after the block.
 */
function readHeaderBlock(lines: string[], startLine: number): { headers: Record<string, string>; end: number } {
  const headers: Record<string, string> = {};
  let i = startLine;
  let lastKey: string | null = null;

  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(HEADER_LINE);
    if (m) {
      lastKey = m[1].toLowerCase() === "sent" ? "date" : m[1].toLowerCase();
      headers[lastKey] = (headers[lastKey] ? headers[lastKey] + " " : "") + m[2].trim();
      i++;
      continue;
    }
    if (line.trim() === "") {
      // A blank line ends the block once we have something; a leading one is noise.
      if (Object.keys(headers).length > 0) { i++; break; }
      i++;
      continue;
    }
    // A wrapped header value — long To: lists fold onto the next line.
    if (lastKey && /^\s+\S/.test(line) && !HEADER_LINE.test(line)) {
      headers[lastKey] += " " + line.trim();
      i++;
      continue;
    }
    break;
  }
  return { headers, end: i };
}

/** Zone abbreviations Date.parse won't take, mapped to real offsets (minutes). */
const TZ_ABBR: Record<string, number> = {
  AEST: 600, AEDT: 660, AWST: 480, ACST: 570, ACDT: 630,
  BST: 60, CET: 60, CEST: 120, NZST: 720, NZDT: 780, GMT: 0, UTC: 0,
};

const offsetSuffix = (minutes: number) => {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return ` ${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
};

/**
 * Mail clients write forward dates in whatever the user's locale is: "Mon, 31
 * Aug 2026 at 14:32", "28 August 2026 at 09:15:02 AEST", "Tuesday, 26 August
 * 2026 11:04".
 *
 * The trap is a date with no offset — Date.parse reads it as the HOST's local
 * time, which is Sydney on a laptop and UTC on the edge runtime, so the same
 * mail would land ten hours apart depending on where this ran. So: translate
 * known abbreviations to real offsets, and pin anything still offset-less to
 * `defaultOffsetMinutes` (the mailbox owner's clock). Returns null rather than
 * guessing at nonsense — callers fall back to the time the CRM address received
 * the mail, which is at worst a few minutes late.
 */
export function parseHeaderDate(
  raw: string | null | undefined,
  defaultOffsetMinutes = 600,
): string | null {
  if (!raw) return null;
  let s = raw.replace(/\s+at\s+/i, " ").replace(/\s*\(([A-Za-z]{2,5})\)\s*$/, " $1").trim();

  let offset: number | null = null;
  const abbr = s.match(/\s+([A-Za-z]{2,5})\s*$/);
  if (abbr && TZ_ABBR[abbr[1].toUpperCase()] !== undefined) {
    offset = TZ_ABBR[abbr[1].toUpperCase()];
    s = s.slice(0, abbr.index).trim();
  }

  const hasExplicitOffset = /[+-]\d{2}:?\d{2}\s*$/.test(s) || /\bZ$/.test(s);
  if (!hasExplicitOffset) s += offsetSuffix(offset ?? defaultOffsetMinutes);

  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/**
 * Recover the original correspondent from a mail sent to the CRM address.
 *
 * Two shapes both work, which matters because they're the two things a person
 * actually does: FORWARD an old thread (we read the forward header block), or
 * cc/bcc the CRM address on a live one (no block — the envelope already names
 * the right people).
 *
 * `ours` is every address that is us (hello@, the founder's inbox, the CRM
 * address itself). Anything in that set is never the correspondent, and a mail
 * whose original sender is one of ours is an outbound message.
 */
export function parseForwardedEmail(mail: RawEmail, ours: string[], defaultOffsetMinutes = 600): ParsedEmail {
  const oursSet = new Set(ours.map((o) => o.toLowerCase().trim()).filter(Boolean));
  const isOurs = (e: string | null) =>
    !!e && (oursSet.has(e.toLowerCase()) || e.toLowerCase().endsWith(".resend.app"));

  const text = (mail.text && mail.text.trim()) ? mail.text : htmlToText(mail.html);
  const lines = text.split(/\r?\n/);

  // Find the forward block: an explicit marker, or (Outlook, and some mobile
  // clients) a bare "From: someone@…" line near the top.
  let headerStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (FORWARD_MARKER.test(lines[i])) { headerStart = i + 1; break; }
  }
  if (headerStart === -1) {
    for (let i = 0; i < Math.min(lines.length, 40); i++) {
      const m = lines[i].match(HEADER_LINE);
      if (m && m[1].toLowerCase() === "from" && extractEmails(m[2]).length) { headerStart = i; break; }
    }
  }

  let headers: Record<string, string> = {};
  let body = text;
  let wasForwarded = false;

  if (headerStart >= 0) {
    while (headerStart < lines.length && lines[headerStart].trim() === "") headerStart++;
    const read = readHeaderBlock(lines, headerStart);
    if (read.headers.from) {
      headers = read.headers;
      wasForwarded = true;
      body = lines.slice(read.end).join("\n").replace(/^\n+/, "");
    }
  }

  const envFrom = parseAddress(typeof mail.from === "string" ? mail.from : null);
  const hdrFrom = parseAddress(headers.from ?? null);
  const origFrom = hdrFrom.email ? hdrFrom : envFrom;

  const toList = Array.isArray(mail.to) ? mail.to.join(", ") : (mail.to ?? "");
  const ccList = Array.isArray(mail.cc) ? mail.cc.join(", ") : (mail.cc ?? "");
  const origTo = headers.to ?? toList;
  const origCc = headers.cc ?? ccList;

  const direction: "in" | "out" = isOurs(origFrom.email) ? "out" : "in";

  // Everyone named anywhere on the original, minus us. On an inbound message the
  // sender is the correspondent; on one we sent, it's whoever we sent it to.
  const all = [
    ...extractEmails(origFrom.email),
    ...extractEmails(origTo),
    ...extractEmails(origCc),
  ];
  const matchEmails = [...new Set(all.filter((e) => !isOurs(e)))];

  const correspondent = direction === "in"
    ? { name: origFrom.name, email: origFrom.email }
    : { name: parseAddress(origTo).name, email: matchEmails[0] ?? null };

  // "Fwd: " / "Re: " noise belongs to the forward, not the original subject.
  const rawSubject = headers.subject ?? mail.subject ?? null;
  const subject = rawSubject ? (rawSubject.replace(/^(?:\s*(?:re|fwd?|fw)\s*:\s*)+/i, "").trim() || null) : null;

  return {
    correspondent,
    direction,
    subject,
    body: body.trim().slice(0, 20000),
    occurredAt: parseHeaderDate(headers.date, defaultOffsetMinutes) ?? mail.receivedAt ?? null,
    fromAddr: origFrom.email,
    toAddr: extractEmails(origTo)[0] ?? null,
    matchEmails,
    wasForwarded,
  };
}

// ---------------------------------------------------------------------------
// WhatsApp chat export
// ---------------------------------------------------------------------------

export interface WhatsAppMessage {
  sender: string;
  body: string;
  occurredAt: string;   // ISO
  direction: "in" | "out";
  externalId: string;
}

export interface WhatsAppParse {
  participants: string[];
  messages: WhatsAppMessage[];
  /** Who the chat is with, if we could tell (from the export's title). */
  counterparty: string | null;
  phones: string[];
}

// iOS:     [01/09/2026, 14:32:10] Jane Smith: hello
// Android: 01/09/2026, 14:32 - Jane Smith: hello
// US 12h:  9/1/26, 2:32 PM - Jane Smith: hello
const WA_LINE =
  /^(?:\[(?<d1>\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),?\s+(?<t1>\d{1,2}:\d{2}(?::\d{2})?)\s*(?<ap1>[APap]\.?[Mm]\.?)?\]\s*|(?<d2>\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),?\s+(?<t2>\d{1,2}:\d{2}(?::\d{2})?)\s*(?<ap2>[APap]\.?[Mm]\.?)?\s+-\s+)(?<rest>[\s\S]*)$/;

// WhatsApp seeds exports with bidi marks; they break naive name comparisons.
const stripMarks = (s: string) => s.replace(/[‎‏‪-‮﻿]/g, "");

/** Chat titles: "WhatsApp Chat with Jane", "WhatsApp Chat - Jane", "_chat.txt". */
export function whatsAppChatTitle(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    if (!c) continue;
    const m = stripMarks(c).match(/WhatsApp\s+Chat\s*(?:with|-|–|—)\s*(.+?)(?:\.txt|\.zip)?\s*$/i);
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}

/** Does this look like an exported chat rather than an ordinary email? */
export function looksLikeWhatsAppExport(text: string | null | undefined, ...titles: (string | null | undefined)[]): boolean {
  if (titles.some((t) => t && /whatsapp/i.test(t))) return true;
  if (!text) return false;
  const lines = stripMarks(text).split(/\r?\n/).slice(0, 60);
  return lines.filter((l) => WA_LINE.test(l)).length >= 3;
}

/**
 * D/M/Y unless the numbers rule it out. WhatsApp writes the device's locale
 * with no marker, and this is an Australian phone; "03/09" is 3 September.
 */
function buildDate(dateStr: string, timeStr: string, ampm: string | undefined, tzOffsetMinutes: number): number | null {
  const parts = dateStr.split(/[./-]/).map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;

  let day: number, month: number, year: number;
  if (parts[0] > 31) {                       // 2026-09-01
    [year, month, day] = parts;
  } else if (parts[1] > 12) {                // 9/13/26 can only be M/D/Y
    [month, day, year] = parts;
  } else {                                   // default D/M/Y
    [day, month, year] = parts;
  }
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const [hRaw, min, sec = 0] = timeStr.split(":").map((p) => parseInt(p, 10));
  let hour = hRaw;
  if (ampm) {
    const pm = /p/i.test(ampm);
    if (pm && hour < 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
  }
  if (hour > 23 || min > 59) return null;

  // The export carries wall-clock time with no offset; the caller says which
  // wall clock it was (the browser's, or the configured device default).
  return Date.UTC(year, month - 1, day, hour, min, sec) - tzOffsetMinutes * 60_000;
}

export interface WhatsAppOptions {
  /** Minutes the export's clock is ahead of UTC. Sydney = 600 (AEST) / 660 (AEDT). */
  tzOffsetMinutes?: number;
  /** Who the chat is with. Their lines are "in", everything else is "out". */
  counterparty?: string | null;
  /** Distinguishes this chat's ids from another chat's. */
  chatKey?: string | null;
}

const OMITTED =
  /^(?:<attached:.*>|(?:image|video|audio|sticker|document|GIF|Contact card|voice message)s? omitted|This message was deleted|You deleted this message|null)$/i;

export function parseWhatsAppExport(raw: string, opts: WhatsAppOptions = {}): WhatsAppParse {
  const tz = opts.tzOffsetMinutes ?? 600;
  const lines = stripMarks(raw).split(/\r?\n/);

  type Pending = { sender: string; body: string[]; at: number };
  const pending: Pending[] = [];
  const participants: string[] = [];

  for (const line of lines) {
    const m = line.match(WA_LINE);
    if (!m || !m.groups) {
      // No timestamp: a continuation of the message above (multi-line texts are
      // common). Text before the first timestamp is export preamble — drop it.
      if (pending.length) pending[pending.length - 1].body.push(line);
      continue;
    }
    const g = m.groups;
    // "Name: text". A timestamped line WITHOUT a sender is a system notice
    // ("Messages and calls are end-to-end encrypted") — skip it entirely rather
    // than letting it glue onto the previous message.
    const sm = (g.rest ?? "").match(/^([^:]{1,80}?):\s?([\s\S]*)$/);
    if (!sm) continue;

    const at = buildDate(g.d1 ?? g.d2 ?? "", g.t1 ?? g.t2 ?? "", g.ap1 ?? g.ap2, tz);
    if (at == null) continue;

    const sender = sm[1].trim();
    if (!participants.includes(sender)) participants.push(sender);
    pending.push({ sender, body: [sm[2]], at });
  }

  const counterparty = opts.counterparty?.trim() || null;
  const chatKey = opts.chatKey ?? counterparty ?? participants.join("|");
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]/g, "");
  const cpNorm = counterparty ? norm(counterparty) : null;

  const messages: WhatsAppMessage[] = [];
  for (const p of pending) {
    const body = p.body.join("\n").trim();
    if (!body || OMITTED.test(body)) continue;

    // Their lines are inbound; anyone else in the chat (i.e. us) is outbound. If
    // we weren't told who they are, treat it all as inbound and let the admin
    // say — better an honest default than a confidently wrong one.
    const sn = norm(p.sender);
    const direction: "in" | "out" =
      cpNorm == null ? "in"
        : (sn === cpNorm || (sn.length > 2 && cpNorm.includes(sn)) || (cpNorm.length > 2 && sn.includes(cpNorm)) ? "in" : "out");

    messages.push({
      sender: p.sender,
      body,
      occurredAt: new Date(p.at).toISOString(),
      direction,
      externalId: "wa_" + stableId(chatKey, p.at, p.sender, body),
    });
  }

  const phones = [...new Set([
    ...extractPhones(counterparty ?? ""),
    ...participants.flatMap((p) => extractPhones(p)),
  ])];

  return { participants, messages, counterparty, phones };
}
