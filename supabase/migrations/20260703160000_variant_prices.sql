-- Multi-currency: per-currency price points for a variant. The AUD base price stays
-- on product_variants.price_cents; other currencies live here. Publicly readable
-- (like products/variants) so the storefront can show local prices.
CREATE TABLE public.variant_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  currency text NOT NULL CHECK (currency IN ('AUD', 'GBP')),
  price_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (variant_id, currency)
);

ALTER TABLE public.variant_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read variant prices" ON public.variant_prices
  FOR SELECT TO anon, authenticated USING (true);

-- GBP price points: single £42, 12-month bundle £126 (= 4 for the price of 3).
INSERT INTO public.variant_prices (variant_id, currency, price_cents)
SELECT id, 'GBP', CASE WHEN is_bundle THEN 12600 ELSE 4200 END
FROM public.product_variants;
