-- Use just the founder's first name ("Adam") across the site. The public pages
-- and email from-names are handled in the app/edge code; this fixes the stored
-- product-idea briefs, whose metadata carried the full name in the Owner line.
UPDATE public.product_ideas
SET brief = replace(replace(brief, 'Adam Hyde', 'Adam'), 'Adam Stuart', 'Adam'),
    updated_at = now()
WHERE brief LIKE '%Adam Hyde%' OR brief LIKE '%Adam Stuart%';
