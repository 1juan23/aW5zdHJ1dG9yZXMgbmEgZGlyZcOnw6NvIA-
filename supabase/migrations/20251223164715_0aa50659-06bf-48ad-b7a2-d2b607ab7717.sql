-- Drop overly permissive profiles policy that exposes PII to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create a view for public profile data (non-sensitive only) for chat functionality
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT user_id, name, avatar_url
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Keep existing restrictive policies for profiles table:
-- "Users can view own profile" - users see their own full profile
-- "Users can update own profile" - users can update their own profile
-- "Users can insert own profile" - users can create their own profile

-- Add policy for conversation participants to see full profiles of people they chat with
CREATE POLICY "Users can view conversation participant profiles"
ON public.profiles FOR SELECT
USING (
  -- User can see profiles of students in conversations where they are the instructor
  user_id IN (
    SELECT c.student_id FROM conversations c
    JOIN instructors i ON c.instructor_id = i.id
    WHERE i.user_id = auth.uid()
  )
  OR
  -- User can see profiles of instructors in conversations where they are the student
  user_id IN (
    SELECT i.user_id FROM instructors i
    JOIN conversations c ON c.instructor_id = i.id
    WHERE c.student_id = auth.uid()
  )
);

-- Add policy for admins to view all profiles for moderation purposes
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));