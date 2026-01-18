-- SECURITY POLISH: Fix Supabase Advisor Warnings
-- 1. FIX FUNCTION SEARCH PATHS
-- Prevents "Function Search Path Mutable" warnings.
ALTER FUNCTION public.is_admin()
SET search_path = public;
-- Fix event_trigger_fn if it exists (using DO block to avoid error if missing)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'event_trigger_fn'
) THEN ALTER FUNCTION public.event_trigger_fn()
SET search_path = public,
    pg_temp;
END IF;
END $$;
-- 2. FIX RLS "ALWAYS TRUE" WARNINGS (contact_leads)
-- Advisor complains about "WITH CHECK (true)". We add a basic content check.
ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.contact_leads;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.contact_leads;
-- Corrected Policy: Validates that email is not empty.
CREATE POLICY "Anyone can create leads" ON public.contact_leads FOR
INSERT TO anon,
    authenticated WITH CHECK (char_length(email) > 0);
-- Ensure Admin View Policy exists and is correct
DROP POLICY IF EXISTS "Admins can view leads" ON public.contact_leads;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.contact_leads;
CREATE POLICY "Admins can view leads" ON public.contact_leads FOR
SELECT TO authenticated USING (public.is_admin());