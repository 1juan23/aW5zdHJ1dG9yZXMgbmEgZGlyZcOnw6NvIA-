-- Create admin_action_logs table for tracking admin actions
-- Create admin_action_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  target_instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approved', 'suspended', 'pending'
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
DO $$ BEGIN
  CREATE POLICY "Only admins can view action logs"
  ON public.admin_action_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Only admins can insert logs
DO $$ BEGIN
  CREATE POLICY "Only admins can insert action logs"
  ON public.admin_action_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Fix instructor registration: Allow instructor insert for any authenticated user
-- This is needed because after signup the user needs to insert their instructor profile
DROP POLICY IF EXISTS "Instructors can insert own profile" ON public.instructors;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert own instructor profile"
  ON public.instructors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Allow instructors to view their own profile even if not approved
DO $$ BEGIN
  CREATE POLICY "Instructors can view own profile"
  ON public.instructors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;