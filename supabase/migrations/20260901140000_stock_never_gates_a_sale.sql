-- A sale is never denied for want of stock: we can always make more. Stock is a
-- record of what exists, not a gate on ordering, so it is allowed to go negative.
-- Negative stock reads as "bottles owed" and is the signal to batch.

-- decrement_stock previously refused when stock < bottles and raised
-- insufficient_stock. That fired AFTER payment succeeded, so the money was taken
-- and the decrement silently skipped, losing any record of what was owed.
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_bottles integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE remaining integer;
BEGIN
  UPDATE public.products
    SET stock_quantity = stock_quantity - p_bottles,
        updated_at = now()
    WHERE id = p_product_id
    RETURNING stock_quantity INTO remaining;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown_product';
  END IF;
  RETURN remaining;
END;
$function$;

-- Manual admin adjustments must also be able to sit at or move within negative
-- stock (e.g. a breakage while already owing bottles).
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
  WHERE id = p_product_id
  RETURNING stock_quantity INTO v_after;

  IF v_after IS NULL THEN RAISE EXCEPTION 'unknown product'; END IF;

  INSERT INTO public.stock_adjustments (product_id, delta, reason, batch_id, stock_after, actor)
  VALUES (p_product_id, p_delta, trim(p_reason), p_batch_id, v_after, auth.jwt() ->> 'email');

  RETURN v_after;
END;
$$;
