-- Make the public instructors listing view run with definer privileges so it can be publicly readable
-- while still excluding sensitive contact fields.
-- This fixes the issue where authenticated users only see their own instructor row due to RLS.

ALTER VIEW public.instructors_public SET (security_invoker = false);

-- Ensure view can be selected by public/authorized clients
GRANT SELECT ON public.instructors_public TO anon, authenticated;