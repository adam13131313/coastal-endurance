-- Capture a contact phone on orders (couriers often need it, esp. international).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone text;
