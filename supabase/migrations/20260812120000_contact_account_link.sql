-- Membership visibility: link a contact to its auth account by email, so the
-- Customers view can show who has created an account vs checked out as a guest.
-- Two triggers keep it in sync both ways, plus a one-time backfill.

-- When an auth user is created / changes email, link the matching contact.
CREATE OR REPLACE FUNCTION public.link_contact_on_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.contacts
     SET user_id = NEW.id, updated_at = now()
   WHERE lower(email) = lower(NEW.email)
     AND user_id IS DISTINCT FROM NEW.id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_link_contact_on_auth ON auth.users;
CREATE TRIGGER trg_link_contact_on_auth
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_contact_on_auth();

-- When a contact is created / its email changes, link to an existing account.
CREATE OR REPLACE FUNCTION public.link_contact_to_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT id INTO NEW.user_id FROM auth.users WHERE lower(email) = lower(NEW.email) LIMIT 1;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_link_contact_to_auth ON public.contacts;
CREATE TRIGGER trg_link_contact_to_auth
  BEFORE INSERT OR UPDATE OF email ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.link_contact_to_auth();

-- Backfill existing contacts.
UPDATE public.contacts c
   SET user_id = u.id
  FROM auth.users u
 WHERE lower(c.email) = lower(u.email)
   AND c.user_id IS NULL;
