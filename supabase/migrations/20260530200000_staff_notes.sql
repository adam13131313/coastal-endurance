-- Internal staff board: issues, requests, suggestions, questions. Admin-only.
CREATE TABLE public.staff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_email text,
  type text NOT NULL DEFAULT 'issue' CHECK (type IN ('issue', 'request', 'suggestion', 'question')),
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read staff notes" ON public.staff_notes
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins add staff notes" ON public.staff_notes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update staff notes" ON public.staff_notes
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE INDEX idx_staff_notes_created ON public.staff_notes(created_at DESC);
