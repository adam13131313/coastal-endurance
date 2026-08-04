-- Batch Volume Calculator: sizes a batch (bottles -> raw material + packaging
-- quantities, rounded to purchasable packs) and saves immutable snapshots that
-- will later feed purchase orders. Extends the existing production schema
-- (raw_materials / formulas / formula_components) rather than duplicating it.

-- ---------------------------------------------------------------------------
-- raw_materials: density (with provenance), supplier confirmation, dosing
-- range, and purchasing pack info. Density source starts at 'book' (reference
-- values); entering a certificate-of-analysis value flips it to 'coa'.
-- ---------------------------------------------------------------------------
ALTER TABLE public.raw_materials
  ADD COLUMN IF NOT EXISTS density_g_ml numeric,
  ADD COLUMN IF NOT EXISTS density_source text NOT NULL DEFAULT 'book'
    CHECK (density_source IN ('book', 'coa')),
  ADD COLUMN IF NOT EXISTS density_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS supplier_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_pct numeric,
  ADD COLUMN IF NOT EXISTS max_pct numeric,
  ADD COLUMN IF NOT EXISTS pack_size numeric,
  ADD COLUMN IF NOT EXISTS pack_unit text CHECK (pack_unit IN ('L', 'kg')),
  ADD COLUMN IF NOT EXISTS min_order_packs int;

-- ---------------------------------------------------------------------------
-- Packaging components (bottles, droppers, boxes, inserts, labels).
-- units_per_bottle is normally 1; allows wastage/spares rates later.
-- ---------------------------------------------------------------------------
CREATE TABLE public.packaging_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  name text NOT NULL,
  supplier text,
  supplier_locked boolean NOT NULL DEFAULT false,
  units_per_bottle numeric NOT NULL DEFAULT 1,
  pack_size int,
  min_order_packs int,
  note text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.packaging_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage packaging_components" ON public.packaging_components
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Saved batch calculations. Immutable: full inline jsonb snapshots of the
-- formula, packaging and computed results as they stood at save time - never
-- foreign keys into the live rows. The formula reference is provenance only
-- (SET NULL, never cascade). No UPDATE surface except actuals + archive,
-- enforced in the UI; rows are never hard-deleted.
-- ---------------------------------------------------------------------------
CREATE SEQUENCE public.batch_calc_ref_seq;

CREATE TABLE public.batch_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_ref text NOT NULL UNIQUE
    DEFAULT 'FO-B' || lpad(nextval('public.batch_calc_ref_seq')::text, 4, '0'),
  label text NOT NULL,
  bottles int NOT NULL,
  target_fill_ml numeric NOT NULL,
  process_loss_pct numeric NOT NULL,
  ordering_buffer_pct numeric NOT NULL,
  formula_snapshot jsonb NOT NULL,
  components_snapshot jsonb NOT NULL,
  results_snapshot jsonb NOT NULL,
  batch_volume_ml numeric,
  batch_mass_g numeric,
  blend_density_g_ml numeric,
  au_grown_pct numeric,
  actual_bottles_filled int,
  actual_batch_volume_ml numeric,
  actual_notes text,
  source_formula_id uuid REFERENCES public.formulas(id) ON DELETE SET NULL,
  formula_version_label text,          -- denormalised for display after SET NULL
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX idx_bcalc_created ON public.batch_calculations(created_at DESC);
ALTER TABLE public.batch_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage batch_calculations" ON public.batch_calculations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed: densities, dosing ranges, pack info and supplier state on the
-- existing materials. Book values throughout - certificates outstanding.
-- Suppliers per the sourcing worksheet; rosemary supplier unconfirmed.
-- ---------------------------------------------------------------------------
UPDATE public.raw_materials SET density_g_ml = 0.865, supplier_locked = true                      WHERE name = 'Australian Jojoba';
UPDATE public.raw_materials SET density_g_ml = 0.922, supplier_locked = true                      WHERE name = 'Rosehip';
UPDATE public.raw_materials SET density_g_ml = 0.910, supplier_locked = true                      WHERE name = 'Australian Macadamia';
UPDATE public.raw_materials SET density_g_ml = 0.925, supplier_locked = true,
                                default_supplier = 'Hemp Harvests Tasmania'                       WHERE name = 'Tasmanian Hemp';
UPDATE public.raw_materials SET density_g_ml = 0.908, supplier_locked = true                      WHERE name = 'Meadowfoam';
UPDATE public.raw_materials SET density_g_ml = 0.950, supplier_locked = true,
                                default_supplier = 'New Directions',
                                min_pct = 0.5, max_pct = 2                                        WHERE name = 'Vitamin E (natural d-alpha)';
UPDATE public.raw_materials SET density_g_ml = 0.930, supplier_locked = false,
                                min_pct = 0.02, max_pct = 0.10                                    WHERE name = 'Rosemary CO2 extract';

-- v0.4 provisional formula (draft). Percentages are placeholders pending the
-- locked batch worksheet; the calculator banners this while status = 'draft'.
INSERT INTO public.formulas (name, version, status, notes)
SELECT 'Field Oil', '0.4 provisional', 'draft',
       'Batch-sizing worksheet draft. Percentages provisional pending locked batch worksheet and supplier CoAs.'
WHERE NOT EXISTS (SELECT 1 FROM public.formulas WHERE name = 'Field Oil' AND version = '0.4 provisional');

INSERT INTO public.formula_components (formula_id, raw_material_id, percent_ww, sort_order)
SELECT f.id, rm.id, c.percent_ww, c.sort_order
FROM (VALUES
  ('Australian Jojoba',            35.0,  1),
  ('Rosehip',                      20.0,  2),
  ('Australian Macadamia',         15.0,  3),
  ('Tasmanian Hemp',               15.0,  4),
  ('Meadowfoam',                   13.95, 5),
  ('Vitamin E (natural d-alpha)',   1.0,  6),
  ('Rosemary CO2 extract',          0.05, 7)
) AS c(material_name, percent_ww, sort_order)
JOIN public.raw_materials rm ON rm.name = c.material_name
CROSS JOIN (SELECT id FROM public.formulas WHERE name = 'Field Oil' AND version = '0.4 provisional') f
WHERE NOT EXISTS (
  SELECT 1 FROM public.formula_components fc
  JOIN public.formulas f2 ON f2.id = fc.formula_id
  WHERE f2.version = '0.4 provisional'
);

-- Packaging: pack sizes and MOQs unknown until quotes land - seeded null.
INSERT INTO public.packaging_components (sort_order, name, units_per_bottle)
SELECT * FROM (VALUES
  (1, '30 ml amber glass bottle', 1::numeric),
  (2, 'Glass dropper assembly',   1::numeric),
  (3, 'Product box',              1::numeric),
  (4, 'Insert card',              1::numeric),
  (5, 'Bottle label',             1::numeric)
) AS v(sort_order, name, units_per_bottle)
WHERE NOT EXISTS (SELECT 1 FROM public.packaging_components);
