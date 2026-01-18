-- Fix Function Search Path Mutable warning
-- We assume the function takes no arguments as it is likely a trigger function.
ALTER FUNCTION public.event_trigger_fn()
SET search_path = public,
    pg_temp;
-- Fix RLS Policy Always True for contact_leads
-- First, enable RLS to be sure
ALTER TABLE IF EXISTS public.contact_leads ENABLE ROW LEVEL SECURITY;
-- Remove existing permissive policies dynamically to ensure clean slate
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT policyname
FROM pg_policies
WHERE tablename = 'contact_leads'
    AND schemaname = 'public' LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.contact_leads';
END LOOP;
END $$;
-- Create restrictive policies
-- Allow anyone to Insert (Contact Form use case)
CREATE POLICY "Enable insert for everyone" ON public.contact_leads FOR
INSERT TO public WITH CHECK (true);
-- Allow only Admins and Service Role to View
CREATE POLICY "Enable read access for admins" ON public.contact_leads FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.user_id = auth.uid()
                AND profiles.role = 'admin'
        )
    );