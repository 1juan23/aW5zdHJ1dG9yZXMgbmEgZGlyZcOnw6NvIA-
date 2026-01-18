-- Fix: Restrict availability_slots to authenticated users
DROP POLICY IF EXISTS "Anyone can view availability" ON public.availability_slots;

CREATE POLICY "Authenticated users can view availability"
ON public.availability_slots
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);