-- Migration to fix profiles RLS to ensure chat functionality works
-- Currently, restricting profiles to "own only" breaks the chat list because users can't see the other participant's name/avatar.

-- Drop the restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Re-enable public/authenticated visibility for profiles
DO $$ BEGIN
  CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
