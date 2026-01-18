-- Enable RLS for instructors_public view and allow public SELECT
-- Note: Views inherit RLS from the underlying tables, so we need to grant access

-- Create a policy to allow public access to the instructors_public view
-- First, we need to drop and recreate the view with SECURITY INVOKER to allow RLS bypass
DROP VIEW IF EXISTS public.instructors_public;

CREATE OR REPLACE VIEW public.instructors_public WITH (security_invoker = false) AS
SELECT
  i.id,
  i.user_id,
  i.name,
  i.city,
  i.state,
  i.neighborhoods,
  i.bio,
  i.experience,
  i.specialties,
  i.price,
  i.rating,
  i.total_reviews,
  i.avatar_url,
  i.status,
  i.created_at,
  i.updated_at,
  COALESCE(s.plan_type, 'trial') as plan_type,
  CASE 
    WHEN COALESCE(s.plan_type, 'trial') = 'elite' THEN 1
    WHEN COALESCE(s.plan_type, 'trial') = 'destaque' THEN 2
    WHEN COALESCE(s.plan_type, 'trial') = 'basico' THEN 3
    ELSE 4
  END as plan_priority,
  CASE 
    WHEN COALESCE(s.plan_type, 'trial') IN ('elite', 'destaque') THEN true
    ELSE false
  END as is_verified
FROM public.instructors i
LEFT JOIN public.instructor_subscriptions s ON i.id = s.instructor_id
WHERE i.status = 'approved';

-- Grant select to anon role for public access without login
GRANT SELECT ON public.instructors_public TO anon;
GRANT SELECT ON public.instructors_public TO authenticated;