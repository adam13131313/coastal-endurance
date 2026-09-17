-- Decision log — deliberate "decide now, review later" records. Each row is a
-- decision that stands until its review date, when it gets re-examined and
-- either re-affirmed (new review date) or superseded. Scheduled Claude
-- Routines act as the alarm clock; this table is the durable record.
-- Admin-only, like product_ideas.
CREATE TABLE public.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  decision text NOT NULL,
  rationale text,
  status text NOT NULL DEFAULT 'decided' CHECK (status IN ('decided', 'under_review', 'superseded')),
  decided_on date NOT NULL DEFAULT current_date,
  review_on date,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage decisions" ON public.decisions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.decisions (title, decision, rationale, decided_on, review_on, review_notes) VALUES
(
  'Per-page social link previews (SSR / prerender)',
  'Leave as-is. All social shares show the site-wide preview card (Field Oil title + bottle image) because the site is a single-page app and social scrapers don''t run JavaScript. No prerendering, edge function, or SSR migration for now.',
  'Single-product brand: most shared links are the homepage or product page, where the default card is exactly right. Google search is unaffected (its crawler runs JS and sees the per-page meta). Becomes worth revisiting if Field Notes turns into a real content channel whose articles get shared on social media. Right-sized fix if it does: a Vercel edge function serving per-page meta to social bots only.',
  '2026-09-16',
  '2027-03-16',
  'A scheduled Claude Routine fires on 16 Mar 2027 to re-review this and email a recommendation.'
);
