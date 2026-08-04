-- Purchasing: capture supplier orders (parsed from pasted confirmations) and
-- link them to saved batch sizings. Lines match to raw materials / packaging
-- so a coverage view can show required vs ordered vs outstanding per batch,
-- and receiving a PO can pre-fill raw_material_lots for the incoming-QC gate.
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier text NOT NULL,
  supplier_order_no text,
  customer_no text,
  order_date date,
  currency text NOT NULL DEFAULT 'AUD',
  subtotal_ex_gst_cents int,
  shipping_cents int,
  gst_cents int,
  total_cents int,
  payment_method text,
  payment_ref text,
  status text NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'received', 'cancelled')),
  batch_calculation_id uuid REFERENCES public.batch_calculations(id) ON DELETE SET NULL,
  raw_text text,                        -- the pasted confirmation, verbatim (provenance)
  parsed_by text NOT NULL DEFAULT 'manual' CHECK (parsed_by IN ('ai', 'manual')),
  notes text,
  received_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX idx_po_created ON public.purchase_orders(created_at DESC);
CREATE INDEX idx_po_batch ON public.purchase_orders(batch_calculation_id);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchase_orders" ON public.purchase_orders
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  line_no int NOT NULL DEFAULT 0,
  product_code text,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text,                            -- as sold: piece(s), drum, carton…
  unit_price_cents int,
  gst_pct numeric,
  total_cents int,
  raw_material_id uuid REFERENCES public.raw_materials(id) ON DELETE SET NULL,
  packaging_component_id uuid REFERENCES public.packaging_components(id) ON DELETE SET NULL,
  qty_in_base numeric,                  -- normalised for coverage comparisons
  base_unit text CHECK (base_unit IN ('L', 'kg', 'units'))
);
CREATE INDEX idx_poi_po ON public.purchase_order_items(purchase_order_id);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchase_order_items" ON public.purchase_order_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
