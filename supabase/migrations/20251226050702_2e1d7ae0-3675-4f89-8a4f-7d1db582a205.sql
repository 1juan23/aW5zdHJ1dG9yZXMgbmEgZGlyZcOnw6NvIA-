-- Drop the problematic policy that exposes email/phone to all authenticated users
DROP POLICY IF EXISTS "Instructors own profile and admin access" ON public.instructors;

-- The remaining policies are secure:
-- 1. "Admins can manage all instructors" - allows admins full access
-- 2. "Instructors can view own profile" - allows instructor to see their own full data
-- 3. "Instructors can update own profile" - allows update of own profile
-- 4. "Authenticated users can insert own instructor profile" - allows registration

-- Note: The public view 'instructors_public' should be used for public listings
-- which already excludes email and phone. The application code in useInstructors.ts
-- already uses this view correctly.