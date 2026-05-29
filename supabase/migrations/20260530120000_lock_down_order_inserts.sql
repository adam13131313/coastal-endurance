-- Orders are created server-side only (service role bypasses RLS); there is no
-- client-side insert path in the app. The public INSERT policies let anyone
-- forge orders/order_items with arbitrary amounts, emails, and prices, so
-- remove them. Reads remain restricted to the owning user via existing SELECT
-- policies.
DROP POLICY IF EXISTS "Safe insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

DROP POLICY IF EXISTS "Safe insert on order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
