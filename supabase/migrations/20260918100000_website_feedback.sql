-- WEBSITE FEEDBACK — feedback can arrive at any time, not just in the Day-5 /
-- Day-21 windows, including mid-order on the website. Two always-on paths into
-- the comms log, both through ingest_comms_message so matching, filing and the
-- review queue behave exactly like inbound email and WhatsApp:
--
--   1. The existing /contact form: contact_submissions rows now flow into the
--      comms log automatically (and are backfilled below).
--   2. The site-wide feedback widget, via the submit-feedback edge function.

-- 'website' joins the allowed sources.
ALTER TABLE public.comms_messages DROP CONSTRAINT IF EXISTS comms_messages_source_check;
ALTER TABLE public.comms_messages ADD CONSTRAINT comms_messages_source_check
  CHECK (source IN ('manual', 'inbound_email', 'whatsapp_export', 'website'));

-- ---------------------------------------------------------------------------
-- Contact form -> comms log. SECURITY DEFINER because the form inserts as anon,
-- which has no execute on ingest_comms_message. Never blocks the submission:
-- the customer's message landing in contact_submissions matters more than the
-- CRM copy, so ingest failures are swallowed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ingest_contact_submission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.ingest_comms_message(jsonb_build_object(
    'channel', 'email',
    'source', 'website',
    'direction', 'in',
    'from_addr', NEW.email,
    'subject', 'Contact form — ' || coalesce(nullif(btrim(NEW.name), ''), NEW.email),
    'body', NEW.message,
    'occurred_at', NEW.created_at,
    'created_by', 'website',
    'external_id', 'contact_submission:' || NEW.id,
    'match_emails', jsonb_build_array(NEW.email),
    'match_names', jsonb_build_array(NEW.name),
    'raw', jsonb_build_object('contact_submission_id', NEW.id, 'page', '/contact')
  ));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ingest_contact_submission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_contact_submission_to_comms ON public.contact_submissions;
CREATE TRIGGER trg_contact_submission_to_comms
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.ingest_contact_submission();

-- Backfill what the form has already collected. Idempotent: the
-- 'contact_submission:<id>' external_id makes a re-run a no-op.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM public.contact_submissions ORDER BY created_at LOOP
    PERFORM public.ingest_comms_message(jsonb_build_object(
      'channel', 'email', 'source', 'website', 'direction', 'in',
      'from_addr', r.email,
      'subject', 'Contact form — ' || coalesce(nullif(btrim(r.name), ''), r.email),
      'body', r.message, 'occurred_at', r.created_at, 'created_by', 'website',
      'external_id', 'contact_submission:' || r.id,
      'match_emails', jsonb_build_array(r.email),
      'match_names', jsonb_build_array(r.name),
      'raw', jsonb_build_object('contact_submission_id', r.id, 'page', '/contact', 'backfilled', true)
    ));
  END LOOP;
END;
$$;
