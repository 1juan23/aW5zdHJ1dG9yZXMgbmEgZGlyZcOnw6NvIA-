-- Add KYC fields to instructors table for document verification
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS cnh_number TEXT,
ADD COLUMN IF NOT EXISTS cnh_category TEXT,
ADD COLUMN IF NOT EXISTS cnh_url TEXT;

-- Create index for faster pending verification queries
CREATE INDEX IF NOT EXISTS idx_instructors_status ON public.instructors(status);

-- Add paused field to instructor_subscriptions for admin pause functionality
ALTER TABLE public.instructor_subscriptions 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paused_by UUID;

-- Allow admins to manage instructor subscriptions (pause/unpause)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update any subscription' AND tablename = 'instructor_subscriptions') THEN
    CREATE POLICY "Admins can update any subscription"
    ON public.instructor_subscriptions
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Allow admins to view all subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all subscriptions' AND tablename = 'instructor_subscriptions') THEN
    CREATE POLICY "Admins can view all subscriptions"
    ON public.instructor_subscriptions
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Allow admins to delete profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete any profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can delete any profile"
    ON public.profiles
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;