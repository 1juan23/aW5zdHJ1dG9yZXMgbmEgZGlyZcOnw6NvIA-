-- Create subscription history table
CREATE TABLE public.subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  amount_paid DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own history
CREATE POLICY "Instructors can view own subscription history"
ON public.subscription_history
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE user_id = auth.uid()
  )
);

-- Service role can insert/update
CREATE POLICY "Service role can manage subscription history"
ON public.subscription_history
FOR ALL
USING (auth.role() = 'service_role');

-- Add index for faster lookups
CREATE INDEX idx_subscription_history_instructor ON public.subscription_history(instructor_id);
CREATE INDEX idx_subscription_history_created ON public.subscription_history(created_at DESC);

-- Enable realtime for instructor_subscriptions to sync updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_subscriptions;