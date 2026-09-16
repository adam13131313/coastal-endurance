-- Batch fulfilment via MyPost Business CSV import/export.
-- The shippable unit in this schema is a DELIVERY (order_deliveries row), not an
-- order — a bundle ships four times — so batch-export state lives there too:
-- "unfulfilled" = scheduled with no exported_at; "exported, awaiting tracking" =
-- scheduled with exported_at set; "shipped" stays the existing delivery status.

ALTER TABLE public.order_deliveries
  ADD COLUMN IF NOT EXISTS carrier text NOT NULL DEFAULT 'auspost',
  ADD COLUMN IF NOT EXISTS exported_at timestamptz;

-- ---------------------------------------------------------------------------
-- Sender + parcel settings (single row, edited on the Fulfilment tab).
-- MyPost's import file requires sender name/address columns per row, and the
-- parcel dims/weight belong in config rather than hard-coded in a view.
-- ---------------------------------------------------------------------------
CREATE TABLE public.fulfilment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id), -- single-row table
  send_from_name text NOT NULL DEFAULT '',
  send_from_business_name text NOT NULL DEFAULT 'Coastal Endurance',
  send_from_address_line1 text NOT NULL DEFAULT '',
  send_from_address_line2 text NOT NULL DEFAULT '',
  send_from_suburb text NOT NULL DEFAULT '',
  send_from_state text NOT NULL DEFAULT '',
  send_from_postcode text NOT NULL DEFAULT '',
  send_from_phone text NOT NULL DEFAULT '',
  send_from_email text NOT NULL DEFAULT '',
  item_description text NOT NULL DEFAULT 'Field Oil 30ml',
  packaging_type text NOT NULL DEFAULT 'OWN_PACKAGING',
  parcel_length_cm numeric NOT NULL DEFAULT 22,
  parcel_width_cm numeric NOT NULL DEFAULT 16,
  parcel_height_cm numeric NOT NULL DEFAULT 5,
  parcel_weight_kg numeric NOT NULL DEFAULT 0.25,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fulfilment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fulfilment settings" ON public.fulfilment_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.fulfilment_settings (id) VALUES (true);

-- ---------------------------------------------------------------------------
-- Export view: every still-scheduled delivery on a real, shippable, Australian
-- order, shaped as the MyPost Business domestic bulk-import template (column
-- names verified against auspost.com.au's order-import-template.xlsx). The
-- app filters exported/not and due/future client-side via the meta columns.
--
-- security_invoker: the view runs under the caller's own RLS, so only admins
-- (who can read all orders/deliveries/contact_events) get rows back.
-- ---------------------------------------------------------------------------
CREATE VIEW public.fulfilment_export_v
WITH (security_invoker = true) AS
SELECT
  -- Meta columns for the app (stripped from the CSV by the client).
  d.id AS delivery_id,
  o.id AS order_id,
  d.sequence,
  d.scheduled_for,
  d.exported_at,
  o.created_at AS ordered_at,
  -- "CE-" + first 8 hex of the delivery id: prints on the label via Additional
  -- Label Information and round-trips through MyPost's consignment export so
  -- tracking numbers can be matched back to the right parcel.
  'CE-' || upper(left(replace(d.id::text, '-', ''), 8)) AS "Additional Label Information 1",
  s.send_from_name AS "Send From Name",
  s.send_from_business_name AS "Send From Business Name",
  s.send_from_address_line1 AS "Send From Address Line 1",
  s.send_from_address_line2 AS "Send From Address Line 2",
  '' AS "Send From Address Line 3",
  s.send_from_suburb AS "Send From Suburb",
  s.send_from_state AS "Send From State",
  s.send_from_postcode AS "Send From Postcode",
  s.send_from_phone AS "Send From Phone Number",
  s.send_from_email AS "Send From Email Address",
  coalesce(o.shipping_name, '') AS "Deliver To Name",
  '' AS "Deliver To Business Name",
  coalesce(o.shipping_address ->> 'line1', '') AS "Deliver To Address Line 1",
  coalesce(o.shipping_address ->> 'line2', '') AS "Deliver To Address Line 2",
  '' AS "Deliver To Address Line 3",
  coalesce(o.shipping_address ->> 'city', '') AS "Deliver To Suburb",
  coalesce(o.shipping_address ->> 'state', '') AS "Deliver To State",
  coalesce(o.shipping_address ->> 'postal_code', '') AS "Deliver To Postcode",
  coalesce(o.phone, '') AS "Deliver To Phone Number",
  coalesce(o.email, '') AS "Deliver To Email Address",
  s.packaging_type AS "Item Packaging Type",
  -- Field team orders (free bottle, or a redeemed code on file) go Parcel Post;
  -- everything else Express Post. MyPost service codes: EXP / PP.
  CASE
    WHEN o.total_cents = 0 OR EXISTS (
      SELECT 1 FROM public.contact_events e
      WHERE e.type = 'redeemed' AND e.meta ->> 'order_id' = o.id::text
    ) THEN 'PP'
    ELSE 'EXP'
  END AS "Item Delivery Service",
  s.item_description AS "Item Description",
  s.parcel_length_cm::text AS "Item Length",
  s.parcel_width_cm::text AS "Item Width",
  s.parcel_height_cm::text AS "Item Height",
  s.parcel_weight_kg::text AS "Item Weight",
  '' AS "Item Dangerous Goods Flag",
  '' AS "Schedule 8 or medicinal cannabis",
  '' AS "Signature On Delivery",
  '' AS "Extra Cover Amount"
FROM public.order_deliveries d
JOIN public.orders o ON o.id = d.order_id
CROSS JOIN public.fulfilment_settings s
WHERE d.status = 'scheduled'
  AND o.status IN ('paid', 'fulfilled')
  AND coalesce(o.fulfillment_method, 'ship') = 'ship'
  -- MyPost's domestic template only; international orders are handled by hand.
  AND upper(coalesce(o.shipping_address ->> 'country', 'AU')) = 'AU'
ORDER BY d.scheduled_for, o.created_at;

-- The view runs with invoker rights, so anon/authed non-admins get zero rows,
-- but there's no reason for anon to see it exists at all.
REVOKE ALL ON public.fulfilment_export_v FROM anon;
GRANT SELECT ON public.fulfilment_export_v TO authenticated;
