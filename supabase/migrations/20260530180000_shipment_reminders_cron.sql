-- Daily reminder of due/overdue prepaid-bundle shipments, emailed to admins.
--
-- ONE-TIME SETUP (run once in the SQL editor; the key is NOT stored in git):
--   select vault.create_secret(
--     '<YOUR SERVICE ROLE KEY>',   -- Dashboard → Settings → API → service_role
--     'cron_service_key'
--   );
--
-- The cron job below reads that secret to authenticate its call to the
-- shipment-reminders edge function.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Replace any prior schedule of the same name (idempotent re-runs).
DO $$ BEGIN PERFORM cron.unschedule('shipment-reminders'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 22:00 UTC daily (~8am AEST).
SELECT cron.schedule(
  'shipment-reminders',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eutbtqkhzizndynilcpl.supabase.co/functions/v1/shipment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
