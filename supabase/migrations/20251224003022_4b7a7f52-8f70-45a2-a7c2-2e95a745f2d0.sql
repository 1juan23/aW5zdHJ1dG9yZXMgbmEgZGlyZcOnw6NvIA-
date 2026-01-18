-- Create instructor subscriptions table to track trial and subscription status
CREATE TABLE public.instructor_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'trial' CHECK (plan_type IN ('trial', 'essencial', 'destaque', 'elite')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '3 months'),
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(instructor_id)
);

-- Enable RLS
ALTER TABLE public.instructor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own subscription
CREATE POLICY "Instructors can view own subscription"
ON public.instructor_subscriptions
FOR SELECT
USING (
    instructor_id IN (
        SELECT id FROM public.instructors WHERE user_id = auth.uid()
    )
);

-- Instructors can update their own subscription
CREATE POLICY "Instructors can update own subscription"
ON public.instructor_subscriptions
FOR UPDATE
USING (
    instructor_id IN (
        SELECT id FROM public.instructors WHERE user_id = auth.uid()
    )
);

-- Allow insert for authenticated users (for new instructors)
CREATE POLICY "Allow insert for authenticated"
ON public.instructor_subscriptions
FOR INSERT
WITH CHECK (
    instructor_id IN (
        SELECT id FROM public.instructors WHERE user_id = auth.uid()
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_instructor_subscriptions_updated_at
BEFORE UPDATE ON public.instructor_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create trial subscription for new instructors
CREATE OR REPLACE FUNCTION public.create_instructor_trial()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.instructor_subscriptions (instructor_id, plan_type)
    VALUES (NEW.id, 'trial');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create trial for new instructors
CREATE TRIGGER create_trial_on_instructor_insert
AFTER INSERT ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.create_instructor_trial();