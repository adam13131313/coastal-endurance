-- Comms templates can be email or WhatsApp. WhatsApp messages have no subject,
-- so channel drives the compose/edit UI (subject hidden, WhatsApp send primary).
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';
ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_channel_check;
ALTER TABLE public.email_templates
  ADD CONSTRAINT email_templates_channel_check CHECK (channel IN ('email', 'whatsapp'));

-- The two hand-added WhatsApp templates used "None" as a placeholder subject.
UPDATE public.email_templates
  SET channel = 'whatsapp', subject = ''
  WHERE key IN ('whatsapp_intro_and_field_team_invite', 'whatsapp_invite');
