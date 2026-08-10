-- Operational notifications (new order, low stock, refund, daily dispatch
-- digest) go only to the assigned dispatch contact(s), not every admin.
-- Functions fall back to all admins if nobody is flagged, so alerts can
-- never silently stop.
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS notify_ops boolean NOT NULL DEFAULT false;
UPDATE public.admins SET notify_ops = true WHERE email = 'adam.s.hyde@gmail.com';
