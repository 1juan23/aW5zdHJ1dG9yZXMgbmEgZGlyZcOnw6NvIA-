-- Fix security issue by setting security_invoker on the view
ALTER VIEW public.instructors_public SET (security_invoker = on);