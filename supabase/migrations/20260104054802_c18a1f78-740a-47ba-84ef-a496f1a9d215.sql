-- Drop and recreate instructors_public view WITHOUT security_invoker
-- This allows public access to instructor listings
DROP VIEW IF EXISTS public.instructors_public;

CREATE VIEW public.instructors_public AS
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
  COALESCE(s.plan_type, 'trial'::text) AS plan_type,
  CASE
    WHEN COALESCE(s.plan_type, 'trial'::text) = 'elite'::text THEN 1
    WHEN COALESCE(s.plan_type, 'trial'::text) = 'destaque'::text THEN 2
    WHEN COALESCE(s.plan_type, 'trial'::text) = 'essencial'::text THEN 3
    ELSE 4
  END AS plan_priority,
  CASE
    WHEN COALESCE(s.plan_type, 'trial'::text) = ANY (ARRAY['destaque'::text, 'elite'::text]) THEN true
    ELSE false
  END AS is_verified
FROM instructors i
LEFT JOIN instructor_subscriptions s ON s.instructor_id = i.id
WHERE i.status = 'approved'::instructor_status;

-- Grant SELECT access to public roles
GRANT SELECT ON public.instructors_public TO anon;
GRANT SELECT ON public.instructors_public TO authenticated;

COMMENT ON VIEW public.instructors_public IS 'Public view of approved instructors - excludes email and phone for security';