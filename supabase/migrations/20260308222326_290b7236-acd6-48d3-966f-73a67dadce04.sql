
CREATE TABLE public.field_team_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  outdoor_activity TEXT NOT NULL,
  experience_duration TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.field_team_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on field_team_applications"
  ON public.field_team_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
