-- Restock helper, used by the Stripe webhook when an order is refunded.
CREATE OR REPLACE FUNCTION public.increment_stock(p_product_id uuid, p_bottles integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE remaining integer;
BEGIN
  UPDATE public.products
    SET stock_quantity = stock_quantity + p_bottles,
        updated_at = now()
    WHERE id = p_product_id
    RETURNING stock_quantity INTO remaining;
  RETURN remaining;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stock(uuid, integer) TO service_role;
