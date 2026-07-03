-- Fulfilment method per order: ship (default) or pickup (collect in person).
-- Pickup orders skip shipping-address collection and the dispatch queue; the
-- customer contacts us to arrange collection after ordering.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_method text NOT NULL DEFAULT 'ship'
  CHECK (fulfillment_method IN ('ship', 'pickup'));
