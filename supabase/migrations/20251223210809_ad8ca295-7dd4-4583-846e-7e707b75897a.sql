-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Instructors viewable with restricted contact info" ON public.instructors;
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;

-- Create simpler, non-recursive policies for instructors
-- Approved instructors are publicly viewable (basic info only handled at application level)
CREATE POLICY "Approved instructors are viewable"
ON public.instructors
FOR SELECT
USING (
  status = 'approved' 
  OR auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create simpler policy for conversations (avoid referencing instructors table)
CREATE POLICY "Participants can view their conversations"
ON public.conversations
FOR SELECT
USING (
  auth.uid() = student_id 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'instructor'
  )
);