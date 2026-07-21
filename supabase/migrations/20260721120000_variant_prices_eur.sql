-- Add EUR as a supported storefront currency. Widen the currency CHECK to include
-- EUR, then add EUR price points: single €48, 12-month bundle €144 (= 4 for the
-- price of 3, mirroring the AUD/GBP/USD structure). AUD remains the base price on
-- product_variants.price_cents.
ALTER TABLE public.variant_prices DROP CONSTRAINT IF EXISTS variant_prices_currency_check;
ALTER TABLE public.variant_prices
  ADD CONSTRAINT variant_prices_currency_check CHECK (currency IN ('AUD', 'GBP', 'USD', 'EUR'));

INSERT INTO public.variant_prices (variant_id, currency, price_cents)
SELECT id, 'EUR', CASE WHEN is_bundle THEN 14400 ELSE 4800 END
FROM public.product_variants
ON CONFLICT (variant_id, currency)
  DO UPDATE SET price_cents = EXCLUDED.price_cents, updated_at = now();
