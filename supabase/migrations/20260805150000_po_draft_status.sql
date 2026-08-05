-- Draft purchase orders: built from a batch sizing (grouped by supplier,
-- editable) before anything is committed with a supplier. draft → ordered
-- (attach the confirmation) → received. Drafts are the only POs that may be
-- hard-deleted; everything else retains.
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_status_check
  CHECK (status IN ('draft', 'ordered', 'received', 'cancelled'));
