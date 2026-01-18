-- Fix: The current policy is too restrictive, preventing listing of approved instructors
-- We need to allow viewing approved instructors publicly (the view already hides sensitive data)
DROP POLICY IF EXISTS "Restricted instructor access" ON public.instructors;

-- Create policy that allows:
-- 1. Anyone can view approved instructors (sensitive data is protected by using instructors_public view in code)
-- 2. Instructor can view own profile
-- 3. Admins can view all
CREATE POLICY "View instructors"
ON public.instructors
FOR SELECT
USING (
  -- Anyone can view approved instructors (for public listing)
  status = 'approved'
  -- Instructor can view own profile (including pending/suspended)
  OR auth.uid() = user_id
  -- Admins can view all
  OR has_role(auth.uid(), 'admin'::app_role)
);