import { describe, it, expect } from "vitest";
import {
  parseForwardedEmail,
  parseWhatsAppExport,
  whatsAppChatTitle,
  looksLikeWhatsAppExport,
  parseHeaderDate,
  normPhone,
  htmlToText,
} from "./comms-parse";

const OURS = ["hello@coastalendurance.com", "adam.s.hyde@gmail.com", "noreply@coastalendurance.com"];

describe("parseForwardedEmail", () => {
  it("reads a Gmail forward and files it against the original sender", () => {
    const r = parseForwardedEmail({
      from: "Adam Hyde <adam.s.hyde@gmail.com>",
      to: ["crm@abc123.resend.app"],
      subject: "Fwd: Re: My order",
      receivedAt: "2026-09-01T04:00:00.000Z",
      text: [
        "Filing this one.",
        "",
        "---------- Forwarded message ---------",
        "From: Jane Smith <jane@example.com>",
        "Date: Mon, 31 Aug 2026 at 14:32",
        "Subject: Re: My order",
        "To: Adam <hello@coastalendurance.com>",
        "",
        "Hi Adam, the bottle arrived today. Smells great.",
        "",
        "Jane",
      ].join("\n"),
    }, OURS);

    expect(r.wasForwarded).toBe(true);
    expect(r.direction).toBe("in");
    expect(r.correspondent.email).toBe("jane@example.com");
    expect(r.correspondent.name).toBe("Jane Smith");
    expect(r.subject).toBe("My order");
    expect(r.matchEmails).toEqual(["jane@example.com"]);
    expect(r.body).toContain("the bottle arrived today");
    expect(r.occurredAt).toBe("2026-08-31T04:32:00.000Z");
    // The forwarder's own note is stripped along with the header block.
    expect(r.body).not.toContain("Filing this one");
  });

  it("reads an Apple Mail forward", () => {
    const r = parseForwardedEmail({
      from: "adam.s.hyde@gmail.com",
      to: "crm@abc123.resend.app",
      subject: "Fwd: Question",
      text: [
        "",
        "Begin forwarded message:",
        "",
        "From: Tom Blake <tom@surfclub.org>",
        "Subject: Question",
        "Date: 28 August 2026 at 09:15:02 AEST",
        "To: hello@coastalendurance.com",
        "",
        "Do you ship to NZ?",
      ].join("\n"),
    }, OURS);

    expect(r.correspondent.email).toBe("tom@surfclub.org");
    expect(r.direction).toBe("in");
    expect(r.body.trim()).toBe("Do you ship to NZ?");
    // 28 Aug 09:15:02 AEST == 27 Aug 23:15:02 UTC, on any host.
    expect(r.occurredAt).toBe("2026-08-27T23:15:02.000Z");
  });

  it("reads an Outlook forward with no separator line", () => {
    const r = parseForwardedEmail({
      from: "adam.s.hyde@gmail.com",
      to: "crm@abc123.resend.app",
      subject: "FW: Wholesale",
      text: [
        "From: Priya Nair <priya@retail.co.uk>",
        "Sent: Tuesday, 26 August 2026 11:04",
        "To: Adam Hyde",
        "Subject: Wholesale",
        "",
        "Could we stock this in Cornwall?",
      ].join("\n"),
    }, OURS);

    expect(r.wasForwarded).toBe(true);
    expect(r.correspondent.email).toBe("priya@retail.co.uk");
    expect(r.body.trim()).toBe("Could we stock this in Cornwall?");
  });

  it("marks a forwarded message WE sent as outbound, and files it against the recipient", () => {
    const r = parseForwardedEmail({
      from: "adam.s.hyde@gmail.com",
      to: "crm@abc123.resend.app",
      subject: "Fwd: Your bottle",
      text: [
        "---------- Forwarded message ---------",
        "From: Adam <hello@coastalendurance.com>",
        "Date: Sun, 30 Aug 2026 at 08:00",
        "Subject: Your bottle",
        "To: Jane Smith <jane@example.com>",
        "",
        "It goes out Monday.",
      ].join("\n"),
    }, OURS);

    expect(r.direction).toBe("out");
    expect(r.correspondent.email).toBe("jane@example.com");
    expect(r.matchEmails).toEqual(["jane@example.com"]);
  });

  it("handles a plain cc'd message with no forward block", () => {
    const r = parseForwardedEmail({
      from: "Jane Smith <jane@example.com>",
      to: ["hello@coastalendurance.com", "crm@abc123.resend.app"],
      subject: "Re: My order",
      receivedAt: "2026-09-01T04:00:00.000Z",
      text: "Just checking on delivery.",
    }, OURS);

    expect(r.wasForwarded).toBe(false);
    expect(r.direction).toBe("in");
    expect(r.correspondent.email).toBe("jane@example.com");
    // Our own addresses are never candidates for matching.
    expect(r.matchEmails).toEqual(["jane@example.com"]);
    expect(r.occurredAt).toBe("2026-09-01T04:00:00.000Z");
  });

  it("falls back to the HTML part when there is no plain text", () => {
    const r = parseForwardedEmail({
      from: "Jane <jane@example.com>",
      to: "crm@abc123.resend.app",
      subject: "Hello",
      html: "<div><p>Line one</p><p>Line two</p><style>p{color:red}</style></div>",
    }, OURS);
    expect(r.body).toBe("Line one\nLine two");
  });

  it("keeps quoted trailing content but drops repeated Re:/Fwd: prefixes", () => {
    const r = parseForwardedEmail({
      from: "jane@example.com", to: "crm@abc123.resend.app",
      subject: "Re: Fwd: RE: Delivery", text: "ok",
    }, OURS);
    expect(r.subject).toBe("Delivery");
  });
});

describe("parseHeaderDate", () => {
  it("honours an explicit offset", () => {
    expect(parseHeaderDate("Mon, 31 Aug 2026 14:32:00 +1000")).toBe("2026-08-31T04:32:00.000Z");
  });
  it("translates zone abbreviations Date.parse can't take", () => {
    expect(parseHeaderDate("28 August 2026 at 09:15:02 AEST")).toBe("2026-08-27T23:15:02.000Z");
    expect(parseHeaderDate("28 August 2026 at 09:15:02 (BST)")).toBe("2026-08-28T08:15:02.000Z");
  });
  it("pins an offset-less date to the given default, not the host's timezone", () => {
    // The bug this guards: on a Sydney laptop Date.parse reads a bare date as
    // +10:00, on the edge runtime as UTC — ten hours apart for the same mail.
    expect(parseHeaderDate("Mon, 31 Aug 2026 14:32", 600)).toBe("2026-08-31T04:32:00.000Z");
    expect(parseHeaderDate("Mon, 31 Aug 2026 14:32", 0)).toBe("2026-08-31T14:32:00.000Z");
  });
  it("returns null rather than guessing at nonsense", () => {
    expect(parseHeaderDate("yesterday-ish")).toBeNull();
    expect(parseHeaderDate(null)).toBeNull();
  });
});

describe("parseWhatsAppExport", () => {
  const iosChat = [
    "[31/08/2026, 09:12:04] Messages and calls are end-to-end encrypted.",
    "[31/08/2026, 09:12:10] Jane Smith: Hey Adam, got the oil",
    "[31/08/2026, 09:13:00] Adam Hyde: Great — how's it going on your hands?",
    "[31/08/2026, 09:15:41] Jane Smith: Really good.",
    "Second line of the same message.",
    "[31/08/2026, 09:16:00] Jane Smith: image omitted",
  ].join("\n");

  it("parses an iOS export, skips system + omitted lines, joins continuations", () => {
    const r = parseWhatsAppExport(iosChat, { counterparty: "Jane Smith", tzOffsetMinutes: 600 });
    expect(r.messages).toHaveLength(3);
    expect(r.participants).toEqual(["Jane Smith", "Adam Hyde"]);
    expect(r.messages[2].body).toBe("Really good.\nSecond line of the same message.");
  });

  it("marks the counterparty's lines in and ours out", () => {
    const r = parseWhatsAppExport(iosChat, { counterparty: "Jane Smith" });
    expect(r.messages.map((m) => m.direction)).toEqual(["in", "out", "in"]);
  });

  it("reads dates as D/M/Y at the given offset", () => {
    const r = parseWhatsAppExport(iosChat, { counterparty: "Jane Smith", tzOffsetMinutes: 600 });
    // 31 August 09:12:10 +10:00 == 2026-08-30T23:12:10Z
    expect(r.messages[0].occurredAt).toBe("2026-08-30T23:12:10.000Z");
  });

  it("parses an Android export with 24h times", () => {
    const r = parseWhatsAppExport([
      "01/09/2026, 14:32 - Tom Blake: are you at the markets sunday",
      "01/09/2026, 14:40 - Adam Hyde: yes from 8",
    ].join("\n"), { counterparty: "Tom Blake", tzOffsetMinutes: 600 });
    expect(r.messages).toHaveLength(2);
    expect(r.messages[0].direction).toBe("in");
    expect(r.messages[1].direction).toBe("out");
    expect(r.messages[0].occurredAt).toBe("2026-09-01T04:32:00.000Z");
  });

  it("handles 12-hour times and unambiguous US dates", () => {
    const r = parseWhatsAppExport("9/13/26, 2:05 PM - Sam: hi", { tzOffsetMinutes: 0 });
    expect(r.messages[0].occurredAt).toBe("2026-09-13T14:05:00.000Z");
  });

  it("gives every message a stable id, and different ids to different messages", () => {
    const a = parseWhatsAppExport(iosChat, { counterparty: "Jane Smith" });
    const b = parseWhatsAppExport(iosChat, { counterparty: "Jane Smith" });
    expect(a.messages.map((m) => m.externalId)).toEqual(b.messages.map((m) => m.externalId));
    expect(new Set(a.messages.map((m) => m.externalId)).size).toBe(3);
  });

  it("treats everything as inbound when it doesn't know who the chat is with", () => {
    const r = parseWhatsAppExport(iosChat);
    expect(r.messages.every((m) => m.direction === "in")).toBe(true);
  });

  it("picks up a phone number when the chat is with an unsaved number", () => {
    const r = parseWhatsAppExport("[01/09/2026, 10:00:00] +61 412 345 678: hello", {
      counterparty: "+61 412 345 678",
    });
    expect(r.phones).toContain("+61 412 345 678");
    expect(normPhone(r.phones[0])).toBe("412345678");
  });
});

describe("chat detection", () => {
  it("pulls the counterparty out of an export title", () => {
    expect(whatsAppChatTitle("WhatsApp Chat with Jane Smith")).toBe("Jane Smith");
    expect(whatsAppChatTitle(null, "WhatsApp Chat - Tom Blake.txt")).toBe("Tom Blake");
    expect(whatsAppChatTitle("Re: something else")).toBeNull();
  });

  it("recognises an export by its title or its body", () => {
    expect(looksLikeWhatsAppExport(null, "WhatsApp Chat with Jane")).toBe(true);
    expect(looksLikeWhatsAppExport([
      "[01/09/2026, 10:00:00] A: one",
      "[01/09/2026, 10:01:00] B: two",
      "[01/09/2026, 10:02:00] A: three",
    ].join("\n"))).toBe(true);
    expect(looksLikeWhatsAppExport("Just a normal email about an order.")).toBe(false);
  });
});

describe("helpers", () => {
  it("normalises phones to the last 9 digits and refuses short ones", () => {
    expect(normPhone("+61 412 345 678")).toBe("412345678");
    expect(normPhone("0412 345 678")).toBe("412345678");
    expect(normPhone("(02) 9876 5432")).toBe("298765432");
    expect(normPhone("12345")).toBeNull();
  });

  it("decodes entities in HTML bodies", () => {
    expect(htmlToText("<p>Tom &amp; Jane&#39;s</p>")).toBe("Tom & Jane's");
  });
});
