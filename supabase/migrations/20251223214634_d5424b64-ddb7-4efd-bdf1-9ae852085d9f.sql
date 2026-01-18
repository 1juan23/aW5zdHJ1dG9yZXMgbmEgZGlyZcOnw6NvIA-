-- Fix: Restrict instructors table SELECT to only owner, admins, and approved conversation participants
-- Remove the broad policy that allows all authenticated users to view instructors
DROP POLICY IF EXISTS "Authenticated users can view approved instructors" ON public.instructors;

-- Instructors can only be viewed by:
-- 1. The instructor themselves
-- 2. Admins
-- 3. Users with approved conversations with that instructor
CREATE POLICY "Restricted instructor access"
ON public.instructors
FOR SELECT
USING (
  -- Instructor can view own profile
  auth.uid() = user_id
  -- Admins can view all
  OR has_role(auth.uid(), 'admin'::app_role)
  -- Users with approved conversations can view that instructor
  OR (
    status = 'approved' 
    AND id IN (
      SELECT instructor_id 
      FROM public.conversations 
      WHERE student_id = auth.uid() 
      AND instructor_approved = true
    )
  )
);