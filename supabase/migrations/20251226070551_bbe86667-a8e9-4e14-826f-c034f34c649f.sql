-- Fix 1: Create a secure view for instructors that hides email/phone from non-owners
-- First, drop existing policies that might expose data to all authenticated users
DROP POLICY IF EXISTS "Admins can view all instructors" ON public.instructors;

-- The instructors table already has proper policies, but we need to ensure
-- that the instructors_public view doesn't expose email/phone
-- Let's update the view to remove sensitive fields

DROP VIEW IF EXISTS public.instructors_public;

CREATE VIEW public.instructors_public
WITH (security_invoker = true)
AS
SELECT 
  i.id,
  i.user_id,
  i.price,
  i.rating,
  i.total_reviews,
  i.status,
  i.created_at,
  i.updated_at,
  i.name,
  i.city,
  i.state,
  i.neighborhoods,
  i.bio,
  i.experience,
  i.specialties,
  i.avatar_url,
  s.plan_type,
  CASE 
    WHEN s.plan_type = 'elite' THEN 1
    WHEN s.plan_type = 'destaque' THEN 2
    WHEN s.plan_type = 'basico' THEN 3
    ELSE 4
  END as plan_priority,
  CASE 
    WHEN s.plan_type IN ('elite', 'destaque') THEN true
    ELSE false
  END as is_verified
FROM public.instructors i
LEFT JOIN public.instructor_subscriptions s ON i.id = s.instructor_id AND s.is_active = true
WHERE i.status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.instructors_public TO authenticated, anon;

-- Fix 2: Create RLS policy to ensure Stripe data is only accessible by the instructor themselves
-- First, remove any existing overly permissive policies
DROP POLICY IF EXISTS "Instructors can view own subscription" ON public.instructor_subscriptions;

-- Create a more restrictive policy that ensures only the instructor can see their own Stripe data
CREATE POLICY "Instructors can view own subscription securely"
ON public.instructor_subscriptions
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  )
);

-- Additionally, create a view that hides Stripe IDs for general queries
CREATE OR REPLACE VIEW public.instructor_subscriptions_safe
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
  -- Note: stripe_customer_id and stripe_subscription_id are intentionally excluded
FROM public.instructor_subscriptions;

GRANT SELECT ON public.instructor_subscriptions_safe TO authenticated;

-- Create RLS-like policy via the safe view - only instructors can see their own subscription info
-- The underlying table already has RLS, so the view will respect it