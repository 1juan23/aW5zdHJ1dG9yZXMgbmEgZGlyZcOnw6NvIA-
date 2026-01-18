-- Fix security vulnerabilities: Remove overly permissive policy on instructors
DROP POLICY IF EXISTS "Authenticated users can view all instructors" ON public.instructors;

-- Add write protection policies on user_roles table
-- Only admins can insert roles (new user signup is handled by SECURITY DEFINER trigger)
-- Add write protection policies on user_roles table
DO $$ BEGIN
  CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Only admins can update roles
DO $$ BEGIN
  CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Only admins can delete roles
DO $$ BEGIN
  CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;