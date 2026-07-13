-- CRM SPINE (Phase 1) — generic contacts + pipelines + events + surveys.
--
-- The person is a generic `contact` (keyed by email), not a "field team member".
-- Field Team is the first pipeline over contacts; a Customer pipeline can be added
-- later with no rewrite. All admin-only (PII): read/write via is_admin(); the
-- orders->contacts sync writes through the service role (bypasses RLS).

-- ---------------------------------------------------------------------------
-- contacts — customers AND field team. Email is the natural key (lowercased).
-- ---------------------------------------------------------------------------
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  phone text,
  source text,                                   -- 'field_team' | 'order' | 'newsletter' | ...
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  country text,
  region text,
  preferred_currency text NOT NULL DEFAULT 'AUD' CHECK (preferred_currency IN ('AUD', 'GBP')),
  marketing_consent boolean NOT NULL DEFAULT false,
  unsubscribe_token text NOT NULL DEFAULT gen_random_uuid()::text,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contacts_source ON public.contacts(source);

-- A contact's position in a pipeline. Stage is free text (each pipeline defines its
-- own set in code); a contact can be in more than one pipeline.
CREATE TABLE public.contact_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  pipeline text NOT NULL,                         -- 'field_team' (now), 'customer' (later)
  stage text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'lost', 'won')),
  lost_reason text,
  stage_entered_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,        -- e.g. {"discount_code": "..."}
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contact_id, pipeline)
);
CREATE INDEX idx_cp_pipeline_stage ON public.contact_pipelines(pipeline, stage);

-- The universal activity timeline (emails, replies, orders, surveys, notes, ...).
CREATE TABLE public.contact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  type text NOT NULL,                             -- invite_sent | email_sent | reply | code_issued | redeemed | order_placed | survey_received | posted | note | stage_change
  note text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor text,                                     -- admin email or 'system'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ce_contact ON public.contact_events(contact_id, created_at DESC);

-- Trial survey responses (form arrives in phase 4; table exists now).
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  recommend_score int,                            -- 0..10
  would_buy text,                                 -- yes | maybe | no
  notice text,
  issues text,
  testimonial text,
  consent_quote text,                             -- yes_named | anonymous | no
  posted_willing text,                            -- yes | maybe | no
  improve text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_survey_contact ON public.survey_responses(contact_id);

-- ---------------------------------------------------------------------------
-- RLS — admin only (customer PII). Service-role writes (webhook) bypass RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.contacts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contacts"          ON public.contacts          FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage contact_pipelines" ON public.contact_pipelines FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage contact_events"    ON public.contact_events    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage survey_responses"  ON public.survey_responses  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Orders -> contacts: upsert a contact by email on every paid order. Called by
-- the stripe-webhook (service role). Never overwrites data we already hold; an
-- order does NOT imply marketing consent (that stays false until they opt in).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_contact_from_order(
  p_email text, p_name text, p_phone text, p_country text, p_currency text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_email IS NULL OR p_email = '' THEN RETURN NULL; END IF;
  INSERT INTO public.contacts (email, name, phone, country, preferred_currency, source)
  VALUES (
    lower(p_email), nullif(p_name, ''), nullif(p_phone, ''), nullif(p_country, ''),
    CASE WHEN upper(coalesce(p_currency, '')) = 'GBP' THEN 'GBP' ELSE 'AUD' END,
    'order'
  )
  ON CONFLICT (email) DO UPDATE SET
    name    = coalesce(public.contacts.name, excluded.name),
    phone   = coalesce(public.contacts.phone, excluded.phone),
    country = coalesce(public.contacts.country, excluded.country),
    updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.upsert_contact_from_order(text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_contact_from_order(text, text, text, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Backfill: bring existing Field Team codes into the CRM as contacts + a
-- field_team pipeline row (stage 'code_sent' if they hold a code, else 'confirmed').
-- ---------------------------------------------------------------------------
INSERT INTO public.contacts (email, source)
SELECT DISTINCT lower(email), 'field_team'
FROM public.approved_field_team_members
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.contact_pipelines (contact_id, pipeline, stage, meta)
SELECT c.id, 'field_team',
       CASE WHEN a.discount_code IS NOT NULL AND a.discount_code <> '' THEN 'code_sent' ELSE 'confirmed' END,
       CASE WHEN a.discount_code IS NOT NULL AND a.discount_code <> '' THEN jsonb_build_object('discount_code', a.discount_code) ELSE '{}'::jsonb END
FROM public.approved_field_team_members a
JOIN public.contacts c ON c.email = lower(a.email)
ON CONFLICT (contact_id, pipeline) DO NOTHING;

INSERT INTO public.contact_events (contact_id, type, note, meta, actor)
SELECT c.id, 'code_issued', 'Backfilled from existing Field Team list', jsonb_build_object('discount_code', a.discount_code), 'system'
FROM public.approved_field_team_members a
JOIN public.contacts c ON c.email = lower(a.email)
WHERE a.discount_code IS NOT NULL AND a.discount_code <> '';
