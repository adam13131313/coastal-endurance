-- Communications library: editable email templates (admin-managed), so copy lives
-- in the app, not in code. Used by the CRM compose flow; {{first_name}} is filled in
-- per contact at send time. Generalises to customer comms later.
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  event_type text NOT NULL DEFAULT 'email_sent',
  stage_on_send text,                             -- optional pipeline stage to advance to on send
  sort int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email_templates" ON public.email_templates
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed — hero-first copy (the contact is the hero; the brand is the guide). Editable
-- in Admin → Field team → Comms library.
INSERT INTO public.email_templates (key, label, subject, body, event_type, stage_on_send, sort) VALUES
('invite', 'Invite',
 'You''ve spent years in the elements — I want your verdict',
 $b$Hi {{first_name}},

You've spent years out in the sun, salt and wind. Your skin's done the hard yards, and that's exactly why your opinion on this counts.

I've made a daily face oil for skin like yours. Before it goes out wide, I'm putting free bottles in the hands of a few people who'll genuinely put it through its paces — and you're one of them.

No cost, no catch. Use it for a few weeks, then tell me straight whether it earns a place in your kit.

You in?$b$,
 'invite_sent', 'invited', 1),

('checkin', 'Day-5 check-in',
 'How''s your skin finding it?',
 $b$Hi {{first_name}},

A few days in — how's your skin taking it? After a session, out in the wind, first thing in the morning?

Whatever you've noticed, or haven't, I want to hear it. A line back is plenty.$b$,
 'email_sent', NULL, 2),

('survey', 'Day-21 survey',
 'Your verdict on the Field Oil',
 $b$Hi {{first_name}},

You've had it about three weeks, so you'll know by now. Your honest read matters more to me than any lab result:

1. Using it daily?
2. 0–10, would you point a mate like you to it?
3. What did your skin notice, if anything?
4. Worth $78 to you?
5. Happy to say so publicly (tag @coastalendurance)?

Reply straight back — blunt is good.$b$,
 'email_sent', NULL, 3),

('content_ask', 'Content ask',
 'The people who''ll trust your word',
 $b$Hi {{first_name}},

If it's earning its place, the people who'll listen are blokes in the same boat as you. A quick honest post or story tagging @coastalendurance, and a nudge to a mate or two, goes further than anything I could say myself.

Only if you mean it — no worries if it's not your thing.$b$,
 'email_sent', NULL, 4),

('thankyou', 'Thank you',
 'That means a lot',
 $b$Hi {{first_name}},

Saw you put your name to it. Coming from someone who's actually out there in it, that carries real weight. Thank you.

If a mate wants in, send them my way.$b$,
 'email_sent', 'advocate', 5),

('close', 'Graceful close',
 'All good',
 $b$Hi {{first_name}},

No stress at all, and thanks for hearing me out. If you ever want to give it a run, the door's open.$b$,
 'email_sent', NULL, 6);
