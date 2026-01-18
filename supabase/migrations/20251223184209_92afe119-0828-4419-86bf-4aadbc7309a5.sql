-- Fix instructor PII exposure: only show contact info to conversation participants or the instructor themselves
DROP POLICY IF EXISTS "Anyone can view approved instructors" ON public.instructors;

-- Create new restrictive policy: only show full data (with email/phone) to:
-- 1. The instructor themselves (their own profile)
-- 2. Students who have an active conversation with the instructor
-- 3. Admins
CREATE POLICY "Instructors viewable with restricted contact info"
ON public.instructors FOR SELECT
USING (
  status = 'approved' AND (
    auth.uid() = user_id OR
    id IN (SELECT instructor_id FROM conversations WHERE student_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  )
);

-- Fix profiles table: add approval workflow to conversations
-- First, add instructor_approved column to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS instructor_approved BOOLEAN DEFAULT false;

-- Update profiles RLS: only show full profile data after conversation approval
DROP POLICY IF EXISTS "Users can view conversation participant profiles" ON public.profiles;

CREATE POLICY "View participant profiles only after approval"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  user_id IN (
    SELECT i.user_id FROM instructors i 
    JOIN conversations c ON c.instructor_id = i.id
    WHERE c.student_id = auth.uid() AND c.instructor_approved = true
  ) OR
  user_id IN (
    SELECT c.student_id FROM conversations c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE i.user_id = auth.uid() AND c.instructor_approved = true
  )
);