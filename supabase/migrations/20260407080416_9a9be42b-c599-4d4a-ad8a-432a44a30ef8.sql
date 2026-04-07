
CREATE TABLE public.approved_field_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.approved_field_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select for verification"
ON public.approved_field_team_members
FOR SELECT
TO anon, authenticated
USING (true);
