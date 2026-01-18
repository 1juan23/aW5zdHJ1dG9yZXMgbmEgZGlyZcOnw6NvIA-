-- Fix SECURITY DEFINER view warning by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT user_id, name, avatar_url
FROM public.profiles;

-- Re-grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;