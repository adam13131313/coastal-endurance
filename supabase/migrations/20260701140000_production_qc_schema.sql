-- PRODUCTION & QC MODULE — schema (Phase 1)
--
-- A self-contained batch-manufacturing-record (BMR) / QC module. It READS from the
-- existing world (admins, and later orders for traceability) and WRITES only to its
-- own new tables. It deliberately does NOT touch products / product_variants / stock
-- (stock stays manual), orders / fulfilment, or the admins/auth model.
--
-- Access model matches the rest of /admin:
--   * Reads          -> RLS SELECT policy using public.is_admin() (browser-direct).
--   * Sensitive writes (receive/release lot, record/release batch, QC) -> service-role
--     edge functions, which bypass RLS. So the gated tables get NO browser write policy.
--   * Light writes the UI does directly (retains, document metadata) -> admin RLS
--     INSERT/UPDATE/DELETE, like staff_notes.
--
-- Self-release: no operator/approver split yet, but every release records
-- released_by + released_at so the gate can be added later with no schema change.

-- ---------------------------------------------------------------------------
-- Master data
-- ---------------------------------------------------------------------------

-- The raw material inputs (the 8 things we buy). Master list, seeded, read-only in UI.
CREATE TABLE public.raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  inci_name text,
  role text,                                   -- base | active | stabiliser | antioxidant | carrier
  default_supplier text,
  is_au_grown boolean NOT NULL DEFAULT false,
  allergen_flags text[] NOT NULL DEFAULT '{}',
  dg_flag boolean NOT NULL DEFAULT false,      -- dangerous good (transport/storage)
  qc_spec jsonb NOT NULL DEFAULT '{}'::jsonb,  -- e.g. {"peroxide_value_max_meq_kg": 10}
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Each physical delivery of a raw material = a lot, with its own QC gate.
CREATE TABLE public.raw_material_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id),
  supplier text,
  supplier_lot_number text,
  qty_received numeric NOT NULL,
  unit text NOT NULL DEFAULT 'g',
  qty_remaining numeric NOT NULL,
  received_date date,
  best_before date,
  status text NOT NULL DEFAULT 'quarantine'
    CHECK (status IN ('quarantine', 'released', 'rejected', 'depleted')),
  released_at timestamptz,
  released_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rml_material ON public.raw_material_lots(raw_material_id);
CREATE INDEX idx_rml_status ON public.raw_material_lots(status);

-- ---------------------------------------------------------------------------
-- Formula (the recipe) — versioned; read-only in the UI for now.
-- ---------------------------------------------------------------------------

CREATE TABLE public.formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL DEFAULT '1',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The dosed components. percent_ww across an active formula must sum to 100.0
-- (enforced by the seed + validated in the batch calculator, not a cross-row CHECK).
CREATE TABLE public.formula_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id uuid NOT NULL REFERENCES public.formulas(id) ON DELETE CASCADE,
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id),
  percent_ww numeric NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_fc_formula ON public.formula_components(formula_id);

-- ---------------------------------------------------------------------------
-- Batches (the BMR) + the components actually consumed (the trace link)
-- ---------------------------------------------------------------------------

CREATE TABLE public.production_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text NOT NULL UNIQUE,           -- FO-YYYYMMDD
  formula_id uuid NOT NULL REFERENCES public.formulas(id),
  planned_mass_g numeric,
  status text NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'blending', 'qc', 'released', 'rejected')),
  operator text,                               -- email of who ran it
  started_at timestamptz,
  filled_at timestamptz,
  yield_units int,                             -- sellable units produced (stock stays manual)
  theoretical_units int,
  best_before date,
  released_at timestamptz,
  released_by text,                            -- self-release for now; records who signed off
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pb_status ON public.production_batches(status);
CREATE INDEX idx_pb_formula ON public.production_batches(formula_id);

CREATE TABLE public.batch_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id),
  target_g numeric,
  actual_g numeric,
  raw_material_lot_id uuid REFERENCES public.raw_material_lots(id)
);
CREATE INDEX idx_bc_batch ON public.batch_components(batch_id);
CREATE INDEX idx_bc_lot ON public.batch_components(raw_material_lot_id);

-- ---------------------------------------------------------------------------
-- QC — templates (what to check) and checks (what was recorded)
-- ---------------------------------------------------------------------------

-- Reusable checklists. applies_to lets the incoming template add a hemp-only item.
CREATE TABLE public.qc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('incoming', 'in_process', 'finished')),
  name text NOT NULL,
  applies_to text NOT NULL DEFAULT 'all',      -- 'all' | 'hemp' | a raw_material role
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.qc_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qc_template_id uuid NOT NULL REFERENCES public.qc_templates(id) ON DELETE CASCADE,
  parameter text NOT NULL,
  input_type text NOT NULL CHECK (input_type IN ('pass_fail', 'numeric', 'boolean', 'date', 'text')),
  expected text,
  required boolean NOT NULL DEFAULT true,
  gating boolean NOT NULL DEFAULT false,       -- does a fail block release / lot?
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_qti_template ON public.qc_template_items(qc_template_id);

-- A recorded check against a raw lot or a batch.
CREATE TABLE public.qc_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('incoming', 'in_process', 'finished')),
  subject_type text NOT NULL CHECK (subject_type IN ('raw_lot', 'batch')),
  subject_id uuid NOT NULL,
  result text NOT NULL DEFAULT 'pending' CHECK (result IN ('pass', 'fail', 'pending')),
  performed_by text,
  performed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_qc_subject ON public.qc_checks(subject_type, subject_id);
CREATE INDEX idx_qc_type ON public.qc_checks(type);

CREATE TABLE public.qc_check_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qc_check_id uuid NOT NULL REFERENCES public.qc_checks(id) ON DELETE CASCADE,
  parameter text NOT NULL,
  value text,
  expected text,
  gating boolean NOT NULL DEFAULT false,
  passed boolean
);
CREATE INDEX idx_qci_check ON public.qc_check_items(qc_check_id);

-- ---------------------------------------------------------------------------
-- Retains + documents
-- ---------------------------------------------------------------------------

CREATE TABLE public.retain_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  qty int NOT NULL DEFAULT 3,
  location text,
  retained_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_retain_batch ON public.retain_samples(batch_id);

-- Attachment metadata (COA / SDS / stability / safety / COO). File lives in the
-- admin-gated Storage bucket created in the Phase-5 migration.
CREATE TABLE public.production_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type text NOT NULL,                       -- coa | sds | stability | safety | coo | other
  entity_type text NOT NULL CHECK (entity_type IN ('raw_material', 'raw_lot', 'batch')),
  entity_id uuid NOT NULL,
  file_url text NOT NULL,
  uploaded_by text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_docs_entity ON public.production_documents(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- RLS — admin-only. is_admin() is the existing SECURITY DEFINER allowlist check.
-- ---------------------------------------------------------------------------

ALTER TABLE public.raw_materials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_lots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_components   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_components     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_template_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_checks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_check_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retain_samples       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_documents ENABLE ROW LEVEL SECURITY;

-- Read: admins can read every production table (browser-direct list/detail/trace).
CREATE POLICY "Admins read raw_materials"        ON public.raw_materials        FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read raw_material_lots"    ON public.raw_material_lots    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read formulas"             ON public.formulas             FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read formula_components"   ON public.formula_components   FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read production_batches"   ON public.production_batches   FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read batch_components"     ON public.batch_components     FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read qc_templates"         ON public.qc_templates         FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read qc_template_items"    ON public.qc_template_items    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read qc_checks"            ON public.qc_checks            FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read qc_check_items"       ON public.qc_check_items       FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read retain_samples"       ON public.retain_samples       FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins read production_documents" ON public.production_documents FOR SELECT TO authenticated USING (public.is_admin());

-- Light writes the UI performs directly (non-gated): retains + document metadata.
-- Everything else (lots, batches, batch_components, qc_*) is written only by
-- service-role edge functions, which bypass RLS — so no browser write policy.
CREATE POLICY "Admins write retain_samples"       ON public.retain_samples
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins write production_documents" ON public.production_documents
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
