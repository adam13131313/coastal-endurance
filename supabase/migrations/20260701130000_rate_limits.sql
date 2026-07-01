-- Lightweight per-key rate limiting for public edge functions (payment-init,
-- newsletter). Keys are hashed IPs, so no raw IP is stored, and rows expire fast.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (which bypasses RLS) touches this table.
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits(expires_at);

-- Atomically increment the counter for (key, time-window) and report whether the
-- caller is still under the limit. Returns TRUE = allowed, FALSE = over limit.
CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bucket text;
  v_count integer;
BEGIN
  v_bucket := p_key || ':' || floor(extract(epoch from now()) / p_window_seconds)::text;
  INSERT INTO public.rate_limits (bucket, count, expires_at)
    VALUES (v_bucket, 1, now() + make_interval(secs => p_window_seconds * 2))
    ON CONFLICT (bucket) DO UPDATE SET count = public.rate_limits.count + 1
    RETURNING count INTO v_count;
  RETURN v_count <= p_max;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;

-- Hourly cleanup of expired buckets (pg_cron is already enabled for shipment
-- reminders). Guarded so the migration still applies if cron is unavailable.
DO $$
BEGIN
  PERFORM cron.schedule('cleanup-rate-limits', '7 * * * *',
    $q$DELETE FROM public.rate_limits WHERE expires_at < now()$q$);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
