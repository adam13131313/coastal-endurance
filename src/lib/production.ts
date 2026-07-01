// Shared types + data helpers for the Production & QC admin module.
//
// The new production tables aren't in the generated Supabase types until they're
// regenerated post-migration, so we read/write them through a loosely-typed client
// (same idiom as StaffBoard). State-changing writes go through edge functions.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sb = supabase as any;

export interface RawMaterial {
  id: string;
  name: string;
  inci_name: string | null;
  role: string | null;
  default_supplier: string | null;
  is_au_grown: boolean;
  allergen_flags: string[];
  dg_flag: boolean;
  qc_spec: Record<string, unknown>;
  active: boolean;
}

export interface RawMaterialLot {
  id: string;
  raw_material_id: string;
  supplier: string | null;
  supplier_lot_number: string | null;
  qty_received: number;
  unit: string;
  qty_remaining: number;
  received_date: string | null;
  best_before: string | null;
  status: "quarantine" | "released" | "rejected" | "depleted";
  released_at: string | null;
  released_by: string | null;
  created_at: string;
  raw_materials?: Pick<RawMaterial, "name" | "inci_name" | "role" | "qc_spec">;
}

export interface Formula {
  id: string;
  name: string;
  version: string;
  status: "draft" | "active" | "archived";
  notes: string | null;
}

export interface FormulaComponent {
  id: string;
  formula_id: string;
  raw_material_id: string;
  percent_ww: number;
  sort_order: number;
  raw_materials?: Pick<RawMaterial, "name" | "inci_name" | "role">;
}

export interface ProductionBatch {
  id: string;
  batch_number: string;
  formula_id: string;
  planned_mass_g: number | null;
  status: "planning" | "blending" | "qc" | "released" | "rejected";
  operator: string | null;
  started_at: string | null;
  filled_at: string | null;
  yield_units: number | null;
  theoretical_units: number | null;
  best_before: string | null;
  released_at: string | null;
  released_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface BatchComponent {
  id: string;
  batch_id: string;
  raw_material_id: string;
  target_g: number | null;
  actual_g: number | null;
  raw_material_lot_id: string | null;
  raw_materials?: Pick<RawMaterial, "name">;
  raw_material_lots?: Pick<RawMaterialLot, "supplier_lot_number" | "supplier">;
}

export interface QcCheck {
  id: string;
  type: "incoming" | "in_process" | "finished";
  subject_type: "raw_lot" | "batch";
  subject_id: string;
  result: "pass" | "fail" | "pending";
  performed_by: string | null;
  performed_at: string | null;
  notes: string | null;
  created_at: string;
  qc_check_items?: QcCheckItem[];
}

export interface QcCheckItem {
  id: string;
  qc_check_id: string;
  parameter: string;
  value: string | null;
  expected: string | null;
  gating: boolean;
  passed: boolean | null;
}

export interface QcTemplate {
  id: string;
  type: "incoming" | "in_process" | "finished";
  name: string;
  applies_to: string;
  qc_template_items?: QcTemplateItem[];
}

export interface QcTemplateItem {
  id: string;
  qc_template_id: string;
  parameter: string;
  input_type: "pass_fail" | "numeric" | "boolean" | "date" | "text";
  expected: string | null;
  required: boolean;
  gating: boolean;
  sort_order: number;
}

export interface RetainSample {
  id: string;
  batch_id: string;
  qty: number;
  location: string | null;
  retained_until: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProductionDocument {
  id: string;
  doc_type: string;
  entity_type: "raw_material" | "raw_lot" | "batch";
  entity_id: string;
  file_url: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

export const LOT_STATUS_LABEL: Record<RawMaterialLot["status"], string> = {
  quarantine: "Quarantine",
  released: "Released",
  rejected: "Rejected",
  depleted: "Depleted",
};

export const BATCH_STATUS_LABEL: Record<ProductionBatch["status"], string> = {
  planning: "Planning",
  blending: "Blending",
  qc: "QC",
  released: "Released",
  rejected: "Rejected",
};

// True when a material carries the hemp-style peroxide ceiling (drives the extra
// gating field in incoming QC). Kept here so UI and copy agree with the server.
export function peroxideCeiling(m: { qc_spec?: Record<string, unknown> } | null | undefined): number | null {
  const v = Number(m?.qc_spec?.["peroxide_value_max_meq_kg"]);
  return Number.isFinite(v) ? v : null;
}

// Batch calculator: grams = (percent / 100) * total batch grams. Sunflower and any
// labelling_only material are excluded upstream (never a formula component).
export function gramsFor(percentWw: number, batchMassG: number): number {
  return (percentWw / 100) * batchMassG;
}

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// Round grams for display without pretending to a precision the scale can't hit.
export const fmtGrams = (g: number | null | undefined) =>
  g == null ? "—" : `${g.toLocaleString("en-AU", { maximumFractionDigits: 1 })} g`;

// ---- QC checklist state + helpers (shared by the QC form and its callers) ----
export type FieldState = { value: string; passed: boolean | null };
export type QcState = Record<string, FieldState>;

// Build the payload items an edge function expects from a template + captured state.
export function qcPayload(items: QcTemplateItem[], state: QcState) {
  return items.map((i) => ({
    parameter: i.parameter,
    value: state[i.parameter]?.value ?? null,
    expected: i.expected,
    gating: i.gating,
    passed: state[i.parameter]?.passed ?? null,
  }));
}

// Client mirror of the server gate: every gating item must have passed === true.
export function allGatingPassed(items: QcTemplateItem[], state: QcState): boolean {
  return items.filter((i) => i.gating).every((i) => state[i.parameter]?.passed === true);
}
