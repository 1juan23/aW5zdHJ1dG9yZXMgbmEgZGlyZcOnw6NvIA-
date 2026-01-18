-- Create a public view for instructors that excludes sensitive contact information
CREATE OR REPLACE VIEW public.instructors_public AS
SELECT 
  id,
  user_id,
  name,
  city,
  state,
  neighborhoods,
  bio,
  experience,
  specialties,
  price,
  rating,
  total_reviews,
  avatar_url,
  status,
  created_at,
  updated_at
FROM public.instructors
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.instructors_public TO anon, authenticated;