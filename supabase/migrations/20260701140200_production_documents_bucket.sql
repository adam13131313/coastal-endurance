-- PRODUCTION & QC MODULE — documents storage (Phase 5)
-- Private bucket for COA / SDS / stability / safety / COO attachments. Admin-only,
-- gated by the same is_admin() allowlist. Files are referenced by path from
-- public.production_documents; the UI fetches short-lived signed URLs to view them.

INSERT INTO storage.buckets (id, name, public)
VALUES ('production-docs', 'production-docs', false)
ON CONFLICT (id) DO NOTHING;

-- storage.objects already has RLS enabled by Supabase; scope this bucket to admins.
CREATE POLICY "Admins read production docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'production-docs' AND public.is_admin());
CREATE POLICY "Admins upload production docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'production-docs' AND public.is_admin());
CREATE POLICY "Admins update production docs" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'production-docs' AND public.is_admin())
  WITH CHECK (bucket_id = 'production-docs' AND public.is_admin());
CREATE POLICY "Admins delete production docs" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'production-docs' AND public.is_admin());
