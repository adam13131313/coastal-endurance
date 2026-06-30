-- Newsletter signups now go through the `subscribe` edge function (service role,
-- which dedups + honeypots). Remove the redundant anonymous direct-insert path so
-- bots can't POST straight to the REST endpoint and bypass those checks.
-- The edge function uses the service role and bypasses RLS, so it is unaffected.
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.newsletter_signups;
