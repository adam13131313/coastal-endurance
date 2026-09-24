-- The parked product-idea briefs were written in July 2026, before launch, and
-- gate themselves on two things that have since happened: Field Oil shipping,
-- and the Father's Day campaign running. Left as-is they read as though the
-- business has not started, and they keep a dead campaign alive in the admin.
--
-- The ideas stay parked — the reason changes from "wait for launch" to the real
-- one, which is that Field Oil needs to prove repeat purchase first, and a
-- single operator making in 100-unit runs has no spare capacity for a second
-- product line yet. The January product-002 decision is where this gets revisited.
--
-- Targeted replacements only: each is a no-op if the phrase has already been
-- edited by hand in the admin, so this is safe to re-run.

UPDATE public.product_ideas
SET brief = replace(
      brief,
      'Park until Field Oil is launched and the Father''s Day campaign is run — but note two things in sequencing.',
      'Park while Field Oil establishes repeat purchase — but note two things in sequencing.'
    )
WHERE brief LIKE '%Park until Field Oil is launched%';

UPDATE public.product_ideas
SET brief = replace(
      brief,
      'Park. Do not progress before Field Oil ships and the Father''s Day launch is executed.',
      'Park. Do not progress until Field Oil is showing repeat purchase and production has capacity to spare.'
    )
WHERE brief LIKE '%Do not progress before Field Oil ships%';

UPDATE public.product_ideas
SET brief = replace(
      brief,
      'Re-open when Field Oil is live and stable,',
      'Re-open when Field Oil is showing repeat purchase,'
    )
WHERE brief LIKE '%Re-open when Field Oil is live and stable,%';

UPDATE public.product_ideas
SET brief = replace(
      brief,
      'Re-open once Field Oil is live and the Father''s Day launch is executed, with the bundle/kit angle',
      'Re-open once Field Oil is showing repeat purchase, with the bundle/kit angle'
    )
WHERE brief LIKE '%Re-open once Field Oil is live and the Father''s Day launch is executed%';

-- The risk sections describe a pre-launch world in the present tense.
UPDATE public.product_ideas
SET brief = replace(
      brief,
      'Field Oil has not launched, the confirmed batch worksheet is still outstanding, and a Father''s Day campaign is due to run.',
      'Field Oil has launched but has not yet proven repeat purchase, and production capacity is fully committed to it.'
    )
WHERE brief LIKE '%Field Oil has not launched%';

UPDATE public.product_ideas
SET brief = replace(
      brief,
      'Field Oil is not yet launched, the batch worksheet is outstanding, and Father''s Day is due to run.',
      'Field Oil has launched but has not yet proven repeat purchase, and production capacity is fully committed to it.'
    )
WHERE brief LIKE '%Field Oil is not yet launched%';

-- Status line in the brief header tables.
UPDATE public.product_ideas
SET brief = replace(
      brief,
      'Parked — do not progress before Field Oil launch',
      'Parked — revisit at the product 002 decision'
    )
WHERE brief LIKE '%do not progress before Field Oil launch%';
