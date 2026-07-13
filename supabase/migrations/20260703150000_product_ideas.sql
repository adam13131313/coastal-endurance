-- Product ideas board — a living list of future 100% natural, performance-optimised
-- products. Admin-only.
CREATE TABLE public.product_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'exploring', 'planned', 'parked')),
  notes text,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product_ideas" ON public.product_ideas
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.product_ideas (title, description, category, status, sort) VALUES
('Barrier Balm — elbows & knees', 'A shea-butter-heavy balm for the roughest, most weathered skin: elbows, knees, knuckles. Thick, protective, naturally derived. Same equipment-maintenance logic as Field Oil, for the parts that crack and split.', 'Body', 'idea', 1),
('Mineral Sunscreen', '100% mineral (zinc) sun protection for full days outdoors. Naturally derived, no chemical filters, reef-safe. The hard part to nail: broad-spectrum performance without a heavy white cast.', 'Sun', 'idea', 2),
('Tattoo Oil', 'Aftercare and ongoing maintenance oil to keep ink sharp and the skin around it healthy. Naturally derived, fragrance-free. A natural adjacency for the outdoor, tattooed crowd.', 'Body', 'idea', 3),
('Field Oil for Dogs', 'A coat and skin oil for working and outdoor dogs — dry, weathered, sun-and-salt-exposed coats. 100% natural, performance-optimised. Same brand promise, four legs.', 'Pets', 'idea', 4);
