-- Fix student_instructor_access RLS to be more restrictive
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage access" ON public.student_instructor_access;

-- Create proper restrictive policies
CREATE POLICY "Students can view own access records"
ON public.student_instructor_access
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view access to their profile"
ON public.student_instructor_access
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE user_id = auth.uid()
  )
);

-- Service role can INSERT (for payment processing)
CREATE POLICY "Service role can insert access"
ON public.student_instructor_access
FOR INSERT
WITH CHECK (true);

-- Service role can UPDATE (for extending access, etc)
CREATE POLICY "Service role can update access"
ON public.student_instructor_access
FOR UPDATE
USING (true);

-- Fix Security Definer views - recreate as INVOKER
-- First, get the definition and recreate

-- profiles_public view should be safe
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS 
SELECT 
  user_id,
  name,
  avatar_url
FROM public.profiles;

-- instructors_public view should be safe (no email/phone)
DROP VIEW IF EXISTS public.instructors_public;
CREATE VIEW public.instructors_public
WITH (security_invoker = true)
AS
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
    WHEN COALESCE(s.plan_type, 'trial') = 'essencial' THEN 3
    ELSE 4
  END as plan_priority,
  CASE 
    WHEN COALESCE(s.plan_type, 'trial') IN ('destaque', 'elite') THEN true
    ELSE false
  END as is_verified
FROM public.instructors i
LEFT JOIN public.instructor_subscriptions s ON s.instructor_id = i.id
WHERE i.status = 'approved';

-- instructor_subscriptions_safe - safe view without stripe IDs
DROP VIEW IF EXISTS public.instructor_subscriptions_safe;
CREATE VIEW public.instructor_subscriptions_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  instructor_id,
  plan_type,
  is_active,
  trial_started_at,
  trial_ends_at,
  subscription_started_at,
  subscription_ends_at,
  created_at,
  updated_at
FROM public.instructor_subscriptions;

-- Grant SELECT on views to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.instructors_public TO authenticated;
GRANT SELECT ON public.instructors_public TO anon;
GRANT SELECT ON public.instructor_subscriptions_safe TO authenticated;