-- Enable RLS on instructor_subscriptions if not already enabled
ALTER TABLE public.instructor_subscriptions ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to ensure clean slate or avoid conflicts
DROP POLICY IF EXISTS "Instructors can view own subscription" ON public.instructor_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.instructor_subscriptions;
-- Create policy: Instructors can only view their own subscription
CREATE POLICY "Instructors can view own subscription" ON public.instructor_subscriptions FOR
SELECT USING (
        auth.uid() IN (
            SELECT user_id
            FROM public.instructors
            WHERE id = instructor_id
        )
    );
-- Create policy: Service role (Edge Functions) can do everything
CREATE POLICY "Service role can manage all subscriptions" ON public.instructor_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Harden Reviews Table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Students can create reviews" ON public.reviews;
-- Reviews are public to read
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR
SELECT USING (true);
-- Only authenticated users (students) can create reviews (assuming logic is handled in app, but RLS adds layer)
-- Ideally links to a booking, but for now allow authenticated creation
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR
INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
-- Ensure Instructors table is secure (already likely enabled, but reinforcing)
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
-- NOTE: Public access to instructors is likely handled by 'instructors_public' view or specific policies.
-- We ensure that raw 'instructors' table is not wildly open for modification.
DROP POLICY IF EXISTS "Instructors can update own profile" ON public.instructors;
CREATE POLICY "Instructors can update own profile" ON public.instructors FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Verify Profiles (Students)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);