-- Product naming: the initial product is designated "Field Oil 001"
-- (numbered designations; suggestion from Laurence Thomson, creative director).
-- Slug stays "field-oil" so URLs don't break.
UPDATE public.products SET name = 'Field Oil 001', updated_at = now() WHERE slug = 'field-oil';
