-- Add NZD as a supported storefront currency. Widen the currency CHECK to include
-- NZD, then add NZD price points: single NZ$95, 12-month bundle NZ$285 (= 4 for the
-- price of 3, mirroring the AUD/GBP/USD/EUR structure). NZ$95 is A$78 at ~1.21,
-- rounded. AUD remains the base price on product_variants.price_cents.
ALTER TABLE public.variant_prices DROP CONSTRAINT IF EXISTS variant_prices_currency_check;
ALTER TABLE public.variant_prices
  ADD CONSTRAINT variant_prices_currency_check CHECK (currency IN ('AUD', 'GBP', 'USD', 'EUR', 'NZD'));

INSERT INTO public.variant_prices (variant_id, currency, price_cents)
SELECT id, 'NZD', CASE WHEN is_bundle THEN 28500 ELSE 9500 END
FROM public.product_variants
ON CONFLICT (variant_id, currency)
  DO UPDATE SET price_cents = EXCLUDED.price_cents, updated_at = now();
