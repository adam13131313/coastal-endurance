-- Records retention for purchasing: attach supporting documents (payment
-- receipts, tax invoices, shipping notices) to purchase orders, reusing the
-- production_documents system. Documents can be an uploaded file OR pasted
-- text kept verbatim — gateway receipts usually arrive as email text.
ALTER TABLE public.production_documents DROP CONSTRAINT IF EXISTS production_documents_entity_type_check;
ALTER TABLE public.production_documents ADD CONSTRAINT production_documents_entity_type_check
  CHECK (entity_type IN ('raw_material', 'raw_lot', 'batch', 'purchase_order'));
ALTER TABLE public.production_documents ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE public.production_documents ADD COLUMN IF NOT EXISTS raw_text text;
ALTER TABLE public.production_documents ADD CONSTRAINT production_documents_has_content
  CHECK (file_url IS NOT NULL OR raw_text IS NOT NULL);
