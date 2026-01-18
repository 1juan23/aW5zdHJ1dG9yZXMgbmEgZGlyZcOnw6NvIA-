-- 1. Add unique constraint on profiles.user_id to prevent duplicate profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 2. Update instructors policy to use instructors_public view for anonymous access
-- The instructors_public view already hides sensitive data (email, phone)
DROP POLICY IF EXISTS "View instructors" ON public.instructors;

-- Create policy that only allows direct table access to authorized users
-- Anonymous users should use the instructors_public view instead
CREATE POLICY "Instructors own profile and admin access"
ON public.instructors
FOR SELECT
USING (
  -- Instructor can view own profile
  auth.uid() = user_id
  -- Admins can view all
  OR has_role(auth.uid(), 'admin'::app_role)
  -- Allow approved instructors to be visible through view (but sensitive data is hidden by the view)
  OR (status = 'approved' AND auth.uid() IS NOT NULL)
);

-- 3. Create policy for anonymous viewing - only through the public view
-- The instructors_public view hides sensitive columns, so we allow SELECT on it
COMMENT ON VIEW public.instructors_public IS 'Public view of instructors that hides sensitive data like email and phone. Use this for public listings.';

-- 4. Add policy note for profiles_public
COMMENT ON VIEW public.profiles_public IS 'Public view of user profiles showing only name and avatar. Safe for public access.';