-- Fix profiles RLS to not expose email/phone in conversations
-- Drop existing policies
DROP POLICY IF EXISTS "View direct conversation partner profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create proper policies - only own profile and admins can see full data
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- For chat, use profiles_public view instead (only name, avatar)
-- Add RLS to profiles_public view to require authentication
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS SELECT 
  user_id,
  name,
  avatar_url
FROM public.profiles;

-- Grant access to authenticated users only
GRANT SELECT ON public.profiles_public TO authenticated;
REVOKE SELECT ON public.profiles_public FROM anon;