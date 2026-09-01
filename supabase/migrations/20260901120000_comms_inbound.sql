-- INBOUND COMMS — forwarded emails and WhatsApp exports file themselves against
-- the right customer.
--
-- The comms log (comms_messages + comms_message_contacts) was created live for
-- the manual "Log a message" form and never had a migration file; it's declared
-- here IF NOT EXISTS so the repo is the source of truth from now on. Everything
-- after that block is new.
--
-- Shape: ONE table holds every message, filed or not. A message with no rows in
-- comms_message_contacts is "unfiled" and shows up in the admin review queue —
-- there is no second inbox table to keep in sync.

-- ---------------------------------------------------------------------------
-- Existing comms log (declared, not recreated)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'call', 'sms', 'other')),
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  from_addr text,
  to_addr text,
  subject text,
  body text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comms_message_contacts (
  message_id uuid NOT NULL REFERENCES public.comms_messages(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, contact_id)
);
CREATE INDEX IF NOT EXISTS idx_cmc_contact ON public.comms_message_contacts(contact_id);

ALTER TABLE public.comms_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comms_message_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins manage comms_messages" ON public.comms_messages
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage comms_message_contacts" ON public.comms_message_contacts
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- New: where a message came from, and whether it still needs filing
-- ---------------------------------------------------------------------------
ALTER TABLE public.comms_messages
  -- manual (typed in admin) | inbound_email (forwarded/cc'd to the CRM address)
  -- | whatsapp_export (chat export, emailed in or pasted in admin)
  ADD COLUMN IF NOT EXISTS source      text  NOT NULL DEFAULT 'manual',
  -- Provider id (Resend email id, or a hash of a WhatsApp line). UNIQUE, so a
  -- webhook retry or the same chat exported twice can't double-file.
  ADD COLUMN IF NOT EXISTS external_id text,
  -- filed = linked to at least one contact; unfiled = in the review queue;
  -- ignored = dismissed (a supplier, a newsletter, a stranger).
  ADD COLUMN IF NOT EXISTS status      text  NOT NULL DEFAULT 'filed',
  -- Envelope leftovers: real headers, forward-block detection, thread key.
  ADD COLUMN IF NOT EXISTS raw         jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- [{filename, content_type, size}] — metadata only, we don't store files.
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.comms_messages ADD CONSTRAINT comms_messages_status_check
    CHECK (status IN ('filed', 'unfiled', 'ignored'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.comms_messages ADD CONSTRAINT comms_messages_source_check
    CHECK (source IN ('manual', 'inbound_email', 'whatsapp_export'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comms_external_id
  ON public.comms_messages(external_id) WHERE external_id IS NOT NULL;

-- The review queue reads this one partial index.
CREATE INDEX IF NOT EXISTS idx_comms_unfiled
  ON public.comms_messages(occurred_at DESC) WHERE status = 'unfiled';

-- ---------------------------------------------------------------------------
-- Phone matching. WhatsApp gives us "+61 412 345 678", the contact record might
-- hold "0412 345 678" — compare the last 9 digits, and refuse to match on
-- anything shorter than 8 digits so a stray "12345" can't hit a real customer.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.norm_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE
    WHEN length(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g')) >= 8
    THEN right(regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g'), 9)
  END;
$$;

CREATE INDEX IF NOT EXISTS idx_contacts_norm_phone ON public.contacts(public.norm_phone(phone));
CREATE INDEX IF NOT EXISTS idx_contacts_lower_name ON public.contacts(lower(name));

-- ---------------------------------------------------------------------------
-- match_contact — best-effort identification, most reliable signal first.
-- Email is exact; phone is last-9-digits; name is an exact case-insensitive
-- match and only counts when it's UNAMBIGUOUS (two "Dave"s => no match, it goes
-- to the review queue rather than being filed against the wrong person).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_contact(
  p_emails text[], p_phones text[], p_names text[]
) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid;
  v_n  int;
BEGIN
  IF p_emails IS NOT NULL AND array_length(p_emails, 1) > 0 THEN
    SELECT c.id INTO v_id FROM public.contacts c
    WHERE lower(c.email) = ANY (SELECT lower(x) FROM unnest(p_emails) x WHERE x IS NOT NULL)
    ORDER BY c.created_at LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  IF p_phones IS NOT NULL AND array_length(p_phones, 1) > 0 THEN
    SELECT c.id INTO v_id FROM public.contacts c
    WHERE public.norm_phone(c.phone) IS NOT NULL
      AND public.norm_phone(c.phone) = ANY (
        SELECT public.norm_phone(x) FROM unnest(p_phones) x WHERE public.norm_phone(x) IS NOT NULL)
    ORDER BY c.created_at LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  IF p_names IS NOT NULL AND array_length(p_names, 1) > 0 THEN
    -- Counted first, then fetched: there is no min(uuid) in Postgres, and more
    -- importantly a name is only trustworthy when exactly one contact has it.
    SELECT count(*) INTO v_n FROM public.contacts c
    WHERE c.name IS NOT NULL
      AND lower(btrim(c.name)) = ANY (
        SELECT lower(btrim(x)) FROM unnest(p_names) x WHERE btrim(coalesce(x, '')) <> '');

    IF v_n = 1 THEN
      SELECT c.id INTO v_id FROM public.contacts c
      WHERE c.name IS NOT NULL
        AND lower(btrim(c.name)) = ANY (
          SELECT lower(btrim(x)) FROM unnest(p_names) x WHERE btrim(coalesce(x, '')) <> '')
      LIMIT 1;
      RETURN v_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.match_contact(text[], text[], text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_contact(text[], text[], text[]) TO service_role, authenticated;

-- ---------------------------------------------------------------------------
-- ingest_comms_message — the single write path for everything that arrives on
-- its own. Idempotent on external_id, so a webhook retry is a no-op. Files the
-- message against the matched contact (and drops a timeline event); leaves it
-- unfiled for the admin queue when nothing matches.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ingest_comms_message(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_external  text := nullif(p->>'external_id', '');
  v_contact   uuid;
  v_message   uuid;
  v_channel   text := coalesce(nullif(p->>'channel', ''), 'email');
  v_direction text := CASE WHEN p->>'direction' = 'out' THEN 'out' ELSE 'in' END;
  v_body      text := coalesce(p->>'body', '');
BEGIN
  IF btrim(v_body) = '' THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'empty body');
  END IF;

  -- Already seen this exact message? Report what we did last time, change nothing.
  IF v_external IS NOT NULL THEN
    SELECT m.id, mc.contact_id INTO v_message, v_contact
    FROM public.comms_messages m
    LEFT JOIN public.comms_message_contacts mc ON mc.message_id = m.id
    WHERE m.external_id = v_external LIMIT 1;
    IF v_message IS NOT NULL THEN
      RETURN jsonb_build_object('message_id', v_message, 'contact_id', v_contact,
                                'matched', v_contact IS NOT NULL, 'duplicate', true);
    END IF;
  END IF;

  -- An explicit contact_id (admin pasting a chat on a customer's page) wins over
  -- any guess we'd make from the content.
  v_contact := nullif(p->>'contact_id', '')::uuid;
  IF v_contact IS NULL THEN
    v_contact := public.match_contact(
      ARRAY(SELECT jsonb_array_elements_text(coalesce(p->'match_emails', '[]'::jsonb))),
      ARRAY(SELECT jsonb_array_elements_text(coalesce(p->'match_phones', '[]'::jsonb))),
      ARRAY(SELECT jsonb_array_elements_text(coalesce(p->'match_names',  '[]'::jsonb)))
    );
  END IF;

  INSERT INTO public.comms_messages (
    channel, direction, from_addr, to_addr, subject, body, occurred_at,
    created_by, source, external_id, status, raw, attachments
  ) VALUES (
    v_channel, v_direction,
    nullif(p->>'from_addr', ''), nullif(p->>'to_addr', ''),
    nullif(p->>'subject', ''), v_body,
    coalesce((p->>'occurred_at')::timestamptz, now()),
    coalesce(nullif(p->>'created_by', ''), 'inbound'),
    coalesce(nullif(p->>'source', ''), 'inbound_email'),
    v_external,
    CASE WHEN v_contact IS NULL THEN 'unfiled' ELSE 'filed' END,
    coalesce(p->'raw', '{}'::jsonb),
    coalesce(p->'attachments', '[]'::jsonb)
  )
  RETURNING id INTO v_message;

  IF v_contact IS NOT NULL THEN
    INSERT INTO public.comms_message_contacts (message_id, contact_id)
    VALUES (v_message, v_contact) ON CONFLICT DO NOTHING;

    INSERT INTO public.contact_events (contact_id, type, note, meta, actor)
    VALUES (
      v_contact,
      CASE WHEN v_channel = 'whatsapp' THEN 'whatsapp_' ELSE 'email_' END || v_direction,
      left(coalesce(nullif(p->>'subject', ''), v_body), 140),
      jsonb_build_object('message_id', v_message, 'source', coalesce(p->>'source', 'inbound_email')),
      'system'
    );
  END IF;

  RETURN jsonb_build_object('message_id', v_message, 'contact_id', v_contact,
                            'matched', v_contact IS NOT NULL, 'duplicate', false);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ingest_comms_message(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ingest_comms_message(jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- file_comms_message — the review queue's "this is Jane" button. Admin-gated;
-- links the message, flips it to filed, and logs the timeline event that the
-- automatic path would have written.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.file_comms_message(p_message_id uuid, p_contact_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  m        public.comms_messages%ROWTYPE;
  v_linked int;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorised'; END IF;
  SELECT * INTO m FROM public.comms_messages WHERE id = p_message_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'no such message'; END IF;

  INSERT INTO public.comms_message_contacts (message_id, contact_id)
  VALUES (p_message_id, p_contact_id) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_linked = ROW_COUNT;

  UPDATE public.comms_messages SET status = 'filed' WHERE id = p_message_id;

  -- Already filed against this contact (a double click, a retry): the status is
  -- reasserted above, but don't write the timeline event a second time.
  IF v_linked = 0 THEN RETURN; END IF;

  INSERT INTO public.contact_events (contact_id, type, note, meta, actor)
  VALUES (
    p_contact_id,
    CASE WHEN m.channel = 'whatsapp' THEN 'whatsapp_' ELSE 'email_' END || m.direction,
    left(coalesce(nullif(m.subject, ''), m.body), 140),
    jsonb_build_object('message_id', p_message_id, 'source', m.source, 'filed_by_hand', true),
    coalesce(auth.jwt() ->> 'email', 'admin')
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.file_comms_message(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.file_comms_message(uuid, uuid) TO authenticated;

-- Everything that predates this migration was typed in by hand and is already
-- attached to a customer.
UPDATE public.comms_messages SET source = 'manual', status = 'filed'
WHERE source IS NULL OR source = 'manual';
