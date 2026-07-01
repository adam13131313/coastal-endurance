-- PRODUCTION & QC MODULE — seed data (Phase 1)
-- The 8 raw materials, the active Field Oil formula (7 dosed components → 100.0),
-- and the QC templates/items. Idempotent-ish: guarded so re-running won't duplicate.

-- ---------------------------------------------------------------------------
-- Raw materials (8). Sunflower is labelling_only: it enters as the carrier inside
-- the Vitamin E and rosemary, so it is NOT a formula/batch component and is never
-- weighed — it exists here only so the INCI label can be generated.
-- ---------------------------------------------------------------------------
INSERT INTO public.raw_materials (name, inci_name, role, default_supplier, is_au_grown, allergen_flags, dg_flag, qc_spec)
SELECT * FROM (VALUES
  ('Australian Jojoba',        'Simmondsia Chinensis Seed Oil',        'base',       'jojocare',       true,  ARRAY[]::text[],           false, '{}'::jsonb),
  ('Tasmanian Hemp',           'Cannabis Sativa Seed Oil',             'active',     'Hemp Harvests',  true,  ARRAY[]::text[],           false, '{"peroxide_value_max_meq_kg": 10}'::jsonb),
  ('Rosehip',                  'Rosa Canina Fruit Oil',                'active',     'AWO',            false, ARRAY[]::text[],           true,  '{}'::jsonb),
  ('Australian Macadamia',     'Macadamia Integrifolia Seed Oil',      'base',       'AWO',            true,  ARRAY['tree_nut']::text[], true,  '{}'::jsonb),
  ('Meadowfoam',               'Limnanthes Alba Seed Oil',             'stabiliser', 'New Directions', false, ARRAY[]::text[],           false, '{}'::jsonb),
  ('Vitamin E (natural d-alpha)','Tocopherol',                         'antioxidant', NULL,            false, ARRAY['soy_derived']::text[], false, '{"max_use_pct": 2}'::jsonb),
  ('Rosemary CO2 extract',     'Rosmarinus Officinalis Leaf Extract',  'antioxidant', NULL,            false, ARRAY[]::text[],           false, '{}'::jsonb),
  ('Sunflower (carrier)',      'Helianthus Annuus Seed Oil',           'carrier',    NULL,             false, ARRAY[]::text[],           false, '{"labelling_only": true}'::jsonb)
) AS v(name, inci_name, role, default_supplier, is_au_grown, allergen_flags, dg_flag, qc_spec)
WHERE NOT EXISTS (SELECT 1 FROM public.raw_materials);

-- ---------------------------------------------------------------------------
-- Active formula. percent_ww sums to 100.0 across the 7 dosed components.
-- ---------------------------------------------------------------------------
INSERT INTO public.formulas (name, version, status, notes)
SELECT 'Field Oil', '1', 'active',
       'Anhydrous cold-blended oil. Percentages are % w/w. Provisional pending safety/claims assessment and stability study.'
WHERE NOT EXISTS (SELECT 1 FROM public.formulas WHERE name = 'Field Oil' AND version = '1');

INSERT INTO public.formula_components (formula_id, raw_material_id, percent_ww, sort_order)
SELECT f.id, rm.id, c.percent_ww, c.sort_order
FROM (VALUES
  ('Australian Jojoba',            24.0, 1),
  ('Tasmanian Hemp',               23.0, 2),
  ('Rosehip',                      19.0, 3),
  ('Australian Macadamia',         18.0, 4),
  ('Meadowfoam',                   14.9, 5),
  ('Vitamin E (natural d-alpha)',   1.0, 6),
  ('Rosemary CO2 extract',          0.1, 7)
) AS c(material_name, percent_ww, sort_order)
JOIN public.raw_materials rm ON rm.name = c.material_name
CROSS JOIN (SELECT id FROM public.formulas WHERE name = 'Field Oil' AND version = '1') f
WHERE NOT EXISTS (SELECT 1 FROM public.formula_components);

-- ---------------------------------------------------------------------------
-- QC templates + items (build these as real checks). gating = a fail blocks the
-- lot release / batch release.
-- ---------------------------------------------------------------------------
INSERT INTO public.qc_templates (type, name, applies_to)
SELECT * FROM (VALUES
  ('incoming',    'Incoming QC — all raw lots', 'all'),
  ('incoming',    'Incoming QC — hemp only',    'hemp'),
  ('in_process',  'In-process QC — batch',      'all'),
  ('finished',    'Finished QC — batch',        'all')
) AS v(type, name, applies_to)
WHERE NOT EXISTS (SELECT 1 FROM public.qc_templates);

INSERT INTO public.qc_template_items (qc_template_id, parameter, input_type, expected, required, gating, sort_order)
SELECT t.id, i.parameter, i.input_type, i.expected, i.required, i.gating, i.sort_order
FROM (VALUES
  -- Incoming QC — all raw lots
  ('Incoming QC — all raw lots', 'Appearance vs expected',                        'pass_fail', 'pass',                         true,  true,  1),
  ('Incoming QC — all raw lots', 'Odour vs expected (no rancid/off note)',        'pass_fail', 'pass',                         true,  true,  2),
  ('Incoming QC — all raw lots', 'Best-before acceptable',                        'date',      'exceeds production + shelf-life need', true, true, 3),
  ('Incoming QC — all raw lots', 'COA received & filed',                          'boolean',   'true',                         true,  true,  4),
  -- Incoming QC — hemp only (the critical oxidation gate)
  ('Incoming QC — hemp only',    'Peroxide value (meq O₂/kg)',                    'numeric',   '≤ 10 (per qc_spec)',           true,  true,  1),
  -- In-process QC — batch
  ('In-process QC — batch',      'Appearance (uniform, no separation/sediment)',  'pass_fail', 'pass',                         true,  true,  1),
  ('In-process QC — batch',      'Homogeneity (no streaking)',                    'pass_fail', 'pass',                         true,  true,  2),
  ('In-process QC — batch',      'Temperature (ambient, no heating)',             'numeric',   '18–25 °C',                     true,  false, 3),
  ('In-process QC — batch',      'Weight reconciliation (actual vs theoretical)', 'numeric',   'within ±2%',                   true,  false, 4),
  -- Finished QC — batch (before release)
  ('Finished QC — batch',        'Appearance vs reference standard',              'pass_fail', 'pass',                         true,  true,  1),
  ('Finished QC — batch',        'Odour (characteristic, no rancid note)',        'pass_fail', 'pass',                         true,  true,  2),
  ('Finished QC — batch',        'Fill check (sample bottles to 30 ml ±5%)',      'numeric',   '28.5–31.5 ml',                 true,  true,  3),
  ('Finished QC — batch',        'Seal / dropper integrity',                      'pass_fail', 'pass',                         true,  true,  4),
  ('Finished QC — batch',        'Label correct (batch + BBD stamped)',           'pass_fail', 'pass',                         true,  true,  5),
  ('Finished QC — batch',        'Peroxide value of finished blend',              'numeric',   'record (baseline)',            false, false, 6),
  ('Finished QC — batch',        'Microbial baseline (TVC, yeast/mould)',         'text',      'record (baseline)',            false, false, 7),
  ('Finished QC — batch',        'Argon applied to headspace',                    'boolean',   '—',                            false, false, 8)
) AS i(template_name, parameter, input_type, expected, required, gating, sort_order)
JOIN public.qc_templates t ON t.name = i.template_name
WHERE NOT EXISTS (SELECT 1 FROM public.qc_template_items);
