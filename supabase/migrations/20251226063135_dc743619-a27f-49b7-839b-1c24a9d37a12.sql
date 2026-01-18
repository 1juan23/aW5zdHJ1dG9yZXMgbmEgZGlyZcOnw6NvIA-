-- Add explicit DENY policies for anonymous access to sensitive tables

-- Deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Deny anonymous access to instructors table (contains email, phone)
CREATE POLICY "Deny anonymous access to instructors"
ON public.instructors
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add stricter policy for instructors - only owner can see their own sensitive data
DROP POLICY IF EXISTS "Instructors can view their own profile" ON public.instructors;
CREATE POLICY "Instructors can view their own profile"
ON public.instructors
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all instructors
CREATE POLICY "Admins can view all instructors"
ON public.instructors
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));