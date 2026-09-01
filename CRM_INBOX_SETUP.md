# CRM inbox — setup

Forward an email to the CRM address and it files itself against the right
customer. Same for a WhatsApp chat. Anything we can't identify waits in
**Admin → Sell → Inbox** until you say who it is.

The code is deployed by `git push` for the front end only — **the database
migration and the two edge functions need a separate push.** See "Deploy" below.

---

## 1. Turn on receiving in Resend

Resend can receive mail, not just send it, and it can do so on a domain it
manages — so **nothing about `hello@coastalendurance.com` changes**. Our MX
records stay pointed at Namecheap Private Email. Don't touch them.

1. Resend dashboard → **Emails → Receiving**.
2. Open the three-dot menu and copy your managed receiving subdomain. It looks
   like `abc123.resend.app`.
3. Your CRM address is any mailbox at that subdomain — use **`crm@abc123.resend.app`**.
   Put it in your phone and desktop contacts as "CRM" so forwarding is two taps.

Optional, later: if you'd rather the address read `crm@crm.coastalendurance.com`,
add **one MX record on the `crm` subdomain only** in Namecheap. The apex domain
keeps its existing mail. Don't add an MX on the apex — that would break
`hello@`.

## 2. Point the webhook at us

1. Resend → **Webhooks → Add webhook**.
2. URL: `https://eutbtqkhzizndynilcpl.supabase.co/functions/v1/inbound-email`
3. Event: **`email.received`** (that one only).
4. Copy the **signing secret** — it starts with `whsec_`.

## 3. Deploy

```bash
cd ~/Developer/coastal-endurance && npx supabase db push && npx supabase functions deploy inbound-email && npx supabase functions deploy import-whatsapp
```

Then set the signing secret from step 2:

```bash
cd ~/Developer/coastal-endurance && npx supabase secrets set INBOUND_WEBHOOK_SECRET=whsec_paste_yours_here
```

Until that secret is set, `inbound-email` **refuses every request**. That's
deliberate: `verify_jwt` is off for it (Resend has no Supabase token), so the
signature is the only thing standing between the CRM and the open internet.

Two optional secrets, both with sensible defaults:

| Secret | Default | What it's for |
| --- | --- | --- |
| `CRM_OUR_ADDRESSES` | `hello@`, `noreply@`, `adam.s.hyde@gmail.com` | Addresses that are *us*. Mail from one of these is filed as **sent**, not received, and they're never treated as the customer. Add any address you write to customers from. |
| `CRM_TZ_OFFSET_MINUTES` | `600` (AEST) | WhatsApp exports and some forwarded mail carry a wall-clock time with no timezone. This says which clock. Set `660` over daylight saving if timestamps look an hour out. |

---

## 4. Using it

**Email.** Forward the message to the CRM address. The forward header block is
read to recover who the conversation was really with, and your own covering note
("filing this one") is stripped. You can also just **cc or bcc the CRM address**
on a live thread — no forwarding needed, and it files the same way.

Mail you *sent* is recognised too: if the original sender is one of
`CRM_OUR_ADDRESSES`, it's filed as outbound against the recipient.

**WhatsApp.** In the chat: contact's name → **Export chat** → **Without media** →
mail it to the CRM address. Every message in the export is filed individually,
with its real timestamp, and attributed by direction — their lines as received,
yours as sent. Re-exporting the same chat later won't duplicate anything; only
the new messages are added.

Or, at the desk: open the customer in **Admin → Sell → Customers**, use **Paste a
WhatsApp chat**, hit **Check it**, confirm which name is the customer, import.

**How a customer is identified**, most reliable first:

1. **Email address** — exact match.
2. **Phone number** — last 9 digits, so `0412 345 678` and `+61 412 345 678` are
   the same person.
3. **Name** — exact, and *only if one contact has it*. Two contacts called Jane
   Smith means no match, and it goes to the Inbox instead of onto the wrong
   timeline.

Nothing is ever guessed. If none of those hit, the message is stored **unfiled**
and shows in **Admin → Sell → Inbox** — and on the Today cockpit as "N messages
waiting to be filed". From the Inbox you can search for the right customer, spin
up a **New customer from this**, or **Ignore** it (suppliers, newsletters,
strangers). Ignored messages stay recoverable behind "Show ignored".

A WhatsApp export that can't be matched arrives as one group, so filing the chat
files all of its messages in one click.

---

## Troubleshooting

**Nothing arrives.** Resend → Webhooks → your endpoint shows delivery attempts
and responses. A `503` means `INBOUND_WEBHOOK_SECRET` isn't set; a `401` means it
doesn't match the one Resend is using. Function logs:

```bash
cd ~/Developer/coastal-endurance && npx supabase functions logs inbound-email
```

**Everything lands unfiled.** Expected for people who aren't contacts yet —
customers only appear automatically once they've ordered. File the first one by
hand and later messages from that address match on their own.

**A WhatsApp import came in with the wrong sides.** The counterparty is taken
from the export's title ("WhatsApp Chat with Jane"). If your device doesn't write
one, use the paste box in the customer's page instead, where you pick the name
yourself.

**Timestamps are an hour out.** Daylight saving —
`npx supabase secrets set CRM_TZ_OFFSET_MINUTES=660`.

---

## Where the code lives

| Piece | File |
| --- | --- |
| Schema, matching, write path | [`supabase/migrations/20260901120000_comms_inbound.sql`](supabase/migrations/20260901120000_comms_inbound.sql) |
| Format parsing (tested) | [`supabase/functions/_shared/comms-parse.ts`](supabase/functions/_shared/comms-parse.ts) |
| Resend webhook | [`supabase/functions/inbound-email/index.ts`](supabase/functions/inbound-email/index.ts) |
| Admin paste path | [`supabase/functions/import-whatsapp/index.ts`](supabase/functions/import-whatsapp/index.ts) |
| Review queue | [`src/components/CommsInbox.tsx`](src/components/CommsInbox.tsx) |

The parsers have unit tests covering Gmail/Apple/Outlook forwards and
iOS/Android WhatsApp exports — `npm test`. If a forward ever files against the
wrong person, add the real (anonymised) text to
`supabase/functions/_shared/comms-parse.test.ts` as a failing case first.
