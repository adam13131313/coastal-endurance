-- Newsletter list becomes self-managing: a per-subscriber token powers a
-- one-click unsubscribe link in every email, an unsubscribed_at marker keeps the
-- admin list honest, and an is_admin() SELECT/UPDATE policy surfaces the list in
-- the app (previously the table was write-only via the service-role function).

ALTER TABLE public.newsletter_signups
  ADD COLUMN IF NOT EXISTS token text NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS welcomed_at timestamptz;

-- Unique lookup for the unsubscribe link.
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_signups_token ON public.newsletter_signups(token);
-- Case-insensitive dedup (the edge function already lower-cases, but belt & braces).
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_signups_email_lower ON public.newsletter_signups(lower(email));

-- Admins can read + manage the list from the app (service role still bypasses RLS).
DROP POLICY IF EXISTS "Admins read newsletter signups" ON public.newsletter_signups;
CREATE POLICY "Admins read newsletter signups" ON public.newsletter_signups
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update newsletter signups" ON public.newsletter_signups;
CREATE POLICY "Admins update newsletter signups" ON public.newsletter_signups
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
