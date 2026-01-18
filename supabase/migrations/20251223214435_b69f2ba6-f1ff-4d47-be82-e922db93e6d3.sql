-- Fix 1: Restrict instructors table to authenticated users only
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Approved instructors are viewable" ON public.instructors;

-- Create policy that requires authentication for viewing instructors
CREATE POLICY "Authenticated users can view approved instructors"
ON public.instructors
FOR SELECT
USING (
  -- Authenticated users can view approved instructors (contact info handled at app level)
  (auth.uid() IS NOT NULL AND status = 'approved')
  -- Users can always view their own profile
  OR auth.uid() = user_id
  -- Admins can view all
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Correct the conversations policy to only show conversations where the instructor is a participant
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;

-- Create proper policy that checks instructor is actually part of the conversation
CREATE POLICY "Participants can view their conversations"
ON public.conversations
FOR SELECT
USING (
  -- Students can view their own conversations
  auth.uid() = student_id
  -- Instructors can only view conversations where they are the instructor
  OR instructor_id IN (
    SELECT id FROM public.instructors WHERE user_id = auth.uid()
  )
);