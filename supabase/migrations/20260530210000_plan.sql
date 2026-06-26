-- Plan targets for the admin "Plan vs actual" view. Single row (id=1).
-- Values are NOT stored here (public repo); they're seeded privately via the
-- service role and are only readable by admins (RLS).
CREATE TABLE public.plan (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  start_date date,
  year1_units integer,
  year1_revenue_cents integer,
  variable_cost_cents integer,   -- per unit
  launch_cash_cents integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read plan" ON public.plan
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update plan" ON public.plan
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.plan (id) VALUES (1) ON CONFLICT DO NOTHING;
