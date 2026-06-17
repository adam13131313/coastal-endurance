-- Migrating off Lovable's email pipeline. Auth emails are now sent natively by
-- Supabase (SMTP via Resend, configured in the dashboard), and the field-team
-- discount email is sent directly from the verify-field-team-member edge
-- function via the Resend API. The pgmq queue, its cron processor, and the RPC
-- wrappers are no longer used and are removed here.

-- 1. Stop the cron that called the (now-deleted) process-email-queue function.
--    Left running, it would hit a missing function every few seconds.
DO $$
BEGIN
  PERFORM cron.unschedule('process-email-queue');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Drop the queue RPC wrappers (no edge function calls these anymore).
DROP FUNCTION IF EXISTS public.enqueue_email(text, jsonb);
DROP FUNCTION IF EXISTS public.read_email_batch(text, integer, integer);
DROP FUNCTION IF EXISTS public.delete_email(text, bigint);
DROP FUNCTION IF EXISTS public.move_to_dlq(text, text, bigint, jsonb);

-- 3. Drop the pgmq queues (auth + transactional + their dead-letter queues).
DO $$
DECLARE q text;
BEGIN
  FOREACH q IN ARRAY ARRAY['auth_emails', 'transactional_emails', 'auth_emails_dlq', 'transactional_emails_dlq'] LOOP
    BEGIN
      PERFORM pgmq.drop_queue(q);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 4. Queue throughput/cooldown config table is no longer used.
DROP TABLE IF EXISTS public.email_send_state;

-- NOTE: public.email_send_log is intentionally KEPT — the verify-field-team-member
-- function still writes audit rows there and uses it for the resend cooldown.
-- public.suppressed_emails and public.email_unsubscribe_tokens are left in place
-- (harmless, unused); drop them later if you want a fully clean schema.
