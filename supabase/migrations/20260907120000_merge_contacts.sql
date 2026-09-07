-- Merge duplicate contacts (same person, two emails). Orders link to contacts by
-- email string, not FK, so the loser's email is preserved on the survivor as an
-- alt_email — that keeps their orders findable after the merge.
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS alt_emails text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.admin_merge_contacts(p_survivor uuid, p_loser uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_s contacts;
  v_l contacts;
  v_order text[] := ARRAY['prospect','invited','confirmed','code_sent','ordered','trialling','feedback','advocate'];
  lp RECORD;
  sp RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorised'; END IF;
  IF p_survivor = p_loser THEN RAISE EXCEPTION 'pick two different contacts'; END IF;
  SELECT * INTO v_s FROM contacts WHERE id = p_survivor;
  SELECT * INTO v_l FROM contacts WHERE id = p_loser;
  IF v_s.id IS NULL OR v_l.id IS NULL THEN RAISE EXCEPTION 'unknown contact'; END IF;

  -- Move simple FK-linked rows.
  UPDATE contact_events SET contact_id = p_survivor WHERE contact_id = p_loser;
  UPDATE survey_responses SET contact_id = p_survivor WHERE contact_id = p_loser;
  UPDATE comms_message_contacts m SET contact_id = p_survivor
    WHERE m.contact_id = p_loser
      AND NOT EXISTS (SELECT 1 FROM comms_message_contacts c2 WHERE c2.message_id = m.message_id AND c2.contact_id = p_survivor);
  DELETE FROM comms_message_contacts WHERE contact_id = p_loser;

  -- Pipelines: repoint where the survivor has none; otherwise keep the more-advanced
  -- stage and union the meta (discount code etc.). Loser's leftover rows cascade on delete.
  FOR lp IN SELECT * FROM contact_pipelines WHERE contact_id = p_loser LOOP
    SELECT * INTO sp FROM contact_pipelines WHERE contact_id = p_survivor AND pipeline = lp.pipeline;
    IF sp.id IS NULL THEN
      UPDATE contact_pipelines SET contact_id = p_survivor WHERE id = lp.id;
    ELSE
      IF COALESCE(array_position(v_order, lp.stage),0) > COALESCE(array_position(v_order, sp.stage),0) THEN
        UPDATE contact_pipelines SET stage = lp.stage, stage_entered_at = lp.stage_entered_at WHERE id = sp.id;
      END IF;
      UPDATE contact_pipelines SET
        meta = COALESCE(sp.meta,'{}'::jsonb) || COALESCE(lp.meta,'{}'::jsonb),
        status = CASE WHEN 'active' IN (sp.status, lp.status) THEN 'active' ELSE sp.status END,
        updated_at = now()
      WHERE id = sp.id;
    END IF;
  END LOOP;

  -- Merge scalar fields onto the survivor; fill blanks from the loser.
  UPDATE contacts SET
    name = COALESCE(NULLIF(trim(v_s.name),''), v_l.name),
    phone = COALESCE(NULLIF(trim(v_s.phone),''), v_l.phone),
    country = COALESCE(v_s.country, v_l.country),
    region = COALESCE(v_s.region, v_l.region),
    notes = CASE WHEN COALESCE(v_l.notes,'') <> '' AND COALESCE(v_s.notes,'') NOT LIKE '%'||v_l.notes||'%'
                 THEN trim(COALESCE(v_s.notes,'') || E'\n' || v_l.notes) ELSE v_s.notes END,
    marketing_consent = v_s.marketing_consent OR v_l.marketing_consent,
    tags = (SELECT array(SELECT DISTINCT unnest(COALESCE(v_s.tags,'{}') || COALESCE(v_l.tags,'{}')))),
    alt_emails = (SELECT array(SELECT DISTINCT e FROM unnest(
        COALESCE(v_s.alt_emails,'{}') || COALESCE(v_l.alt_emails,'{}') || ARRAY[v_l.email]
      ) e WHERE e IS NOT NULL AND lower(e) <> lower(v_s.email))),
    updated_at = now()
  WHERE id = p_survivor;

  DELETE FROM contacts WHERE id = p_loser;
  RETURN jsonb_build_object('survivor', p_survivor, 'merged_email', v_l.email);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_merge_contacts(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_merge_contacts(uuid, uuid) TO authenticated;
