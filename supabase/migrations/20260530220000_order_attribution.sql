-- Attribution on orders: auto-captured UTM/referrer, plus a manual
-- "how they heard about us" field the owner fills in from /admin.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referrer text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS heard_about text;
