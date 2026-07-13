-- Stock control: audited stock adjustments from admin (replaces hand-editing
-- products.stock_quantity in the dashboard). Every change is a logged row; a
-- released production batch's yield can be applied to stock exactly once.

CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,                 -- positive = add, negative = remove (never 0)
  reason text NOT NULL,
  -- Set when the adjustment applies a production batch's yield; unique so a
  -- batch can only ever be added to stock once.
  batch_id uuid UNIQUE REFERENCES public.production_batches(id) ON DELETE SET NULL,
  stock_after integer NOT NULL,
  actor text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_adj_product ON public.stock_adjustments(product_id, created_at DESC);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read stock adjustments" ON public.stock_adjustments
  FOR SELECT TO authenticated USING (public.is_admin());
-- No browser write policy: writes go through the RPC below.

-- Adjust stock atomically + log it. Admin-only (checked inside; SECURITY DEFINER
-- so no broad UPDATE policy on products is needed). Stock can't go negative.
CREATE OR REPLACE FUNCTION public.admin_adjust_stock(
  p_product_id uuid, p_delta integer, p_reason text, p_batch_id uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_after integer;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorised'; END IF;
  IF p_delta = 0 THEN RAISE EXCEPTION 'delta must be non-zero'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'a reason is required'; END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity + p_delta
  WHERE id = p_product_id AND stock_quantity + p_delta >= 0
  RETURNING stock_quantity INTO v_after;

  IF v_after IS NULL THEN RAISE EXCEPTION 'adjustment would make stock negative (or unknown product)'; END IF;

  INSERT INTO public.stock_adjustments (product_id, delta, reason, batch_id, stock_after, actor)
  VALUES (p_product_id, p_delta, trim(p_reason), p_batch_id, v_after, auth.jwt() ->> 'email');

  RETURN v_after;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_stock(uuid, integer, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_stock(uuid, integer, text, uuid) TO authenticated;
