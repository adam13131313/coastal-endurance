-- Catalog price to $78 AUD, and Plan launch date to 2026-07-01.
--
-- Single bottle: $78 (7800c).
-- 12-month bundle ("annual"): 4 bottles for the price of 3 = 3 x $78 = $234 (23400c).
UPDATE public.product_variants SET price_cents = 7800  WHERE slug = 'field-oil-single';
UPDATE public.product_variants SET price_cents = 23400 WHERE slug = 'field-oil-annual';

-- Launch date drives the Plan tab pacing. Not financial-sensitive; safe in repo.
UPDATE public.plan SET start_date = '2026-07-01', updated_at = now() WHERE id = 1;
