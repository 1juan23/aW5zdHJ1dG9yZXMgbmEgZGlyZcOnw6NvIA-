-- Fix: Restrict profiles table access to own profile only
-- This prevents public exposure of user PII (emails, phones, names)

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

DO $$ BEGIN
  CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;