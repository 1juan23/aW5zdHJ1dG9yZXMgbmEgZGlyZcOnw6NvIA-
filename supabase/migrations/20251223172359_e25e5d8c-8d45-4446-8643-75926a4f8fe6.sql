-- Drop and recreate the view with SECURITY INVOKER (default, but explicit for clarity)
DROP VIEW IF EXISTS public.instructors_public;

CREATE VIEW public.instructors_public 
WITH (security_invoker = true)
AS
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