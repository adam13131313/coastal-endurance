-- Self-hosted commerce: replace Shopify with our own catalog, inventory, and orders.
-- Payments go through Stripe Checkout; the Stripe webhook (service role) writes
-- orders/items/deliveries and decrements stock. Storefront reads products only.

-- The old Lovable order tables were unused; redefine them for the Stripe flow.
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

-- The physical product. Stock is tracked here in bottles; variants consume it.
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  currency text NOT NULL DEFAULT 'AUD',
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase options for a product. Each unit consumes `bottles` from product stock.
-- A bundle (is_bundle) ships across `deliveries_count` shipments, spaced
-- `default_interval_months` apart unless the customer picks custom dates.
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  bottles integer NOT NULL DEFAULT 1 CHECK (bottles >= 1),
  deliveries_count integer NOT NULL DEFAULT 1 CHECK (deliveries_count >= 1),
  default_interval_months integer NOT NULL DEFAULT 0 CHECK (default_interval_months >= 0),
  is_bundle boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Storefront can read active catalog rows; no public writes (managed via dashboard / service role).
CREATE POLICY "Public can read active products" ON public.products
  FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "Public can read active variants" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (active);

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  currency text NOT NULL DEFAULT 'AUD',
  subtotal_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  shipping_name text,
  shipping_address jsonb,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_label text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price_cents integer NOT NULL,
  bottles_each integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per scheduled shipment (bundle = N rows, single = 1 row).
CREATE TABLE public.order_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  sequence integer NOT NULL DEFAULT 1,
  scheduled_for date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'shipped', 'delivered', 'cancelled')),
  shipped_at timestamptz,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;

-- Orders are written by the Stripe webhook (service role bypasses RLS). Signed-in
-- users may read their own orders for an account history view. No public writes.
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users read own order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Users read own deliveries" ON public.order_deliveries
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_deliveries.order_id AND o.user_id = auth.uid())
  );

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_deliveries_order ON public.order_deliveries(order_id);
CREATE INDEX idx_order_deliveries_due ON public.order_deliveries(scheduled_for) WHERE status = 'scheduled';

-- ---------------------------------------------------------------------------
-- Atomic stock decrement (used by the Stripe webhook; guards against overselling)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_bottles integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE remaining integer;
BEGIN
  UPDATE public.products
    SET stock_quantity = stock_quantity - p_bottles,
        updated_at = now()
    WHERE id = p_product_id AND stock_quantity >= p_bottles
    RETURNING stock_quantity INTO remaining;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_stock';
  END IF;
  RETURN remaining;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- Seed: Field Oil + its two purchase options
-- ---------------------------------------------------------------------------
INSERT INTO public.products (slug, name, description, currency, stock_quantity, active)
VALUES (
  'field-oil',
  'Field Oil',
  'A daily barrier maintenance face oil for life outdoors. 30ml. Seven natural ingredients, 59% active barrier-repair oils, zero fragrance. Made in Australia.',
  'AUD',
  30,
  true
);

INSERT INTO public.product_variants
  (product_id, slug, label, price_cents, bottles, deliveries_count, default_interval_months, is_bundle, sort_order)
SELECT id, 'field-oil-single', 'Single Bottle', 7500, 1, 1, 0, false, 0
FROM public.products WHERE slug = 'field-oil';

INSERT INTO public.product_variants
  (product_id, slug, label, price_cents, bottles, deliveries_count, default_interval_months, is_bundle, sort_order)
SELECT id, 'field-oil-annual', '12-Month Supply — 4 Bottles', 22500, 4, 4, 3, true, 1
FROM public.products WHERE slug = 'field-oil';
