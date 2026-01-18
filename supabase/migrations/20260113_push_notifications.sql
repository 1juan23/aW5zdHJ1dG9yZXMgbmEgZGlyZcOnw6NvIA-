-- Create table for Web Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, endpoint)
);
-- RLS Policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscription" ON public.push_subscriptions FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscription" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Admins can view all (for debugging/sending)
CREATE POLICY "Admins can view all subscriptions" ON public.push_subscriptions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
                AND user_roles.role = 'admin'
        )
    );
-- Function to update timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_update_push_subscriptions BEFORE
UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();