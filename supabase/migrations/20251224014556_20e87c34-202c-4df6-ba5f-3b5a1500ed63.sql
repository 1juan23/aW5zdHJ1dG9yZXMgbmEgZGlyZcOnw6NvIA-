-- Drop the overly permissive policy
DROP POLICY IF EXISTS "View participant profiles only after approval" ON public.profiles;

-- Create a new, more restrictive policy that only allows viewing the DIRECT conversation partner
-- Not all profiles associated with an instructor
CREATE POLICY "View direct conversation partner profile only"
ON public.profiles FOR SELECT
USING (
  -- User can always view their own profile
  (auth.uid() = user_id)
  OR
  -- Admins can view all profiles
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Student can view instructor's user profile ONLY if they have an approved conversation with that specific instructor
  (user_id IN (
    SELECT i.user_id 
    FROM instructors i
    JOIN conversations c ON c.instructor_id = i.id
    WHERE c.student_id = auth.uid() 
      AND c.instructor_approved = true
  ))
  OR
  -- Instructor can view student's profile ONLY if they have an approved conversation with that specific student
  (user_id IN (
    SELECT c.student_id
    FROM conversations c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE i.user_id = auth.uid()
      AND c.instructor_approved = true
      AND c.student_id = profiles.user_id  -- This ensures only the specific student in the conversation
  ))
);