# Production & QC module — build notes

Batch-manufacturing-record (BMR) and quality-control module for making Field Oil.
Built from `production_qc_admin_module_spec.md` (data model), `production_module_build_brief.md`
(build order + seed + QC fields) and `field_oil_production_qc_guide.md` (process context).

**Staged on branch `production-qc-module` — not deployed.** It reads from the existing
world and writes only to its own new tables; it does **not** touch products, stock,
orders, fulfilment, checkout, or the admins/auth model.

## Where it lives in the app
- **Admin → Production** (new sidebar group) → `ProductionAdmin.tsx`, with six sub-tabs:
  Materials · Formula · Batches · QC log · Traceability · Retains.
- Frontend: `src/components/ProductionAdmin.tsx`, `src/components/production/*`, shared
  types/helpers in `src/lib/production.ts`.
- Reads are browser-direct RLS selects (via a loosely-typed client, same idiom as
  StaffBoard). Every state change goes through an admin-gated edge function.

## What was built (by phase)
1. **Schema + seed** — `20260701140000_production_qc_schema.sql`,
   `20260701140100_production_qc_seed.sql`. 12 tables, admin-only RLS. Seeds the 8 raw
   materials, the active formula (7 dosed components → 100.0% w/w), and 4 QC templates
   (17 items).
2. **Raw materials + incoming QC** — `receive-raw-lot`, `release-raw-lot` functions;
   Materials screen. Receiving puts a lot in quarantine; incoming QC releases or rejects
   it. The hemp peroxide-value gate is enforced server-side.
3. **Formula + batch calculator** — Formula screen: read-only recipe + a calculator
   (enter batch mass → per-ingredient gram targets; e.g. 21,000 g → jojoba 5,040 g).
4. **Batch workflow (the BMR)** — `record-batch` (create → blend → fill), `submit-batch-qc`,
   `release-batch`; Batches screen with a printable/exportable BMR.
5. **Traceability + retains + documents** — forward/recall (lot → batches),
   backward (batch → lots + COAs), retains log, and document upload to the private
   `production-docs` Storage bucket (`20260701140200_production_documents_bucket.sql`).

## Business rules (enforced in the edge functions, not just the UI)
- Quarantined/rejected lots can't be selected in a blend.
- A hemp lot can't be released if its peroxide value exceeds `qc_spec.peroxide_value_max_meq_kg`.
- To release a raw lot, every gating incoming-QC item must pass.
- `record-batch` decrements the selected lot's `qty_remaining` (reversing any prior
  record, so re-recording a blend is safe).
- `release-batch` is blocked unless the latest finished QC check is a pass with all
  gating items passed; it stamps `best_before` and records `released_by`/`released_at`.
- Released/rejected batches are read-only — `record-batch` and `submit-batch-qc` refuse
  them (corrections are a new batch, keeping the BMR intact).
- Weight reconciliation beyond ±2% flags a warning (does not hard-block).

## Deferred by design (additive later, no rebuild)
- **Operator/approver split.** Self-release for now; the signer may equal the operator,
  but `released_by`/`released_at` are always recorded. Adding the gate later = enforce
  "approver ≠ operator" in `release-batch`; the fields already exist.
- **Stock integration.** A released batch records `yield_units` but does **not** write
  `product_variants`/`stock` — you edit stock by hand as today. Later: add a
  `finished_lots` table and have `release-batch` write it + increment stock.

## Implementation choices where the spec was silent
- **Module placement:** a single **Production** nav group with a self-contained
  `ProductionAdmin` that has its own six sub-tabs (rather than six top-level admin tabs),
  to keep `Admin.tsx` changes minimal and the module lazy-loaded as one unit.
- **`qc_spec` key:** standardised on `peroxide_value_max_meq_kg` (the key used in the seed
  table); the release logic reads that exact key.
- **QC templates modelled as data** (`qc_templates` + `qc_template_items`) with an
  `applies_to` field, so the hemp-only peroxide item is added on top of the shared
  incoming checklist. `gating` is a real column and drives release both in the UI and
  server-side.
- **RLS split:** all tables get an admin SELECT policy (browser reads). Only the two
  "light" tables the UI writes directly — `retain_samples`, `production_documents` — get
  admin write policies. Everything else is written solely by service-role edge functions.
- **Documents** live in a private bucket; the UI mints 60-second signed URLs to view.
- **Batch auto-numbering** `FO-YYYYMMDD`, suffixed `-2`, `-3`… on same-day collisions.
- **Theoretical units** computed at ~0.90 g/mL, 30 ml bottles.

## Flag for Adam's decision
- **Hemp peroxide ceiling (10 meq/kg)** is a sensible starting value — **confirm with the
  COA / safety assessor** and update `raw_materials.qc_spec` for Tasmanian Hemp if it
  should differ.
- **Best-before** is entered per batch at release — set conservatively until the
  stability study returns (hemp is the limiting factor).
- The **social tab's "current formula"** copy and the website claims are handled
  separately (content branch) — not part of this module.

## Verification done
- `tsc --noEmit` clean, `vite build` clean, `eslint` clean on the new files.
- Migrations applied against a throwaway Postgres: 8 materials, 1 active formula summing
  to exactly 100.0000%, 4 templates / 17 items, RLS policies present, private bucket +
  4 storage policies created.
- Batch calculator arithmetic matches the guide's 21 kg batch sheet exactly.
- **Not yet exercised live:** the edge-function runtime behaviour (lot release, blend
  decrement, batch release gating) can only be acceptance-tested after the migrations +
  functions are deployed to Supabase — see below.

## To deploy (separate from the frontend git push)
```
npx supabase@2.108.0 db push
npx supabase@2.108.0 functions deploy receive-raw-lot release-raw-lot record-batch submit-batch-qc release-batch
```
No `config.toml` change is needed: the new functions use the default `verify_jwt = true`
(JWT verified at the gateway, then the caller's email re-checked against `admins`).
After deploy, regenerate the Supabase TypeScript types if you want the new tables typed
(the UI currently reads them through a loose client on purpose).
