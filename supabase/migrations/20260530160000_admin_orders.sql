-- Admin order management: an allowlist table + is_admin() helper, and RLS so
-- admins can read every order and update fulfillment. Add yourself by inserting
-- your login email into public.admins (e.g. via the dashboard).

CREATE TABLE public.admins (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (webhook) and the SECURITY DEFINER
-- is_admin() function below ever read this table. The admin list is not exposed.

-- True if the current signed-in user's email is in the allowlist.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE email = (auth.jwt() ->> 'email')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Admins can read everything (these OR with the existing "own orders" policies).
CREATE POLICY "Admins read all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read all order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read all deliveries" ON public.order_deliveries
  FOR SELECT TO authenticated USING (public.is_admin());

-- Admins can update fulfillment state (order status; delivery status/tracking).
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins update deliveries" ON public.order_deliveries
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
