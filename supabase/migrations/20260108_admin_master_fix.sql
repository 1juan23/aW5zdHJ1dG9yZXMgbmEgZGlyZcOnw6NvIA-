-- MASTER FIX: Admin Permissions and Data Visibility (SELF-CONTAINED ZERO-DEPENDENCY VERSION)
-- This script will:
-- 1. Create any missing tables (system_settings, broadcasts, support_tickets, etc.)
-- 2. Create the is_admin() helper function.
-- 3. Enable RLS and Grant permissions for all tables.
-- 4. Apply correct policies for Admin visibility.
-- 1. Helper Function for Performance
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
            AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;
-- 2. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
DROP POLICY IF EXISTS "Admins can view all profiles_fix" ON public.profiles;
CREATE POLICY "Admins can view all profiles_fix" ON public.profiles FOR
SELECT TO authenticated USING (
        (auth.uid() = id)
        OR public.is_admin()
    );
-- 3. SYSTEM SETTINGS
-- DDL: Create table if missing
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    booking_fee DECIMAL(10, 2) DEFAULT 5.00,
    maintenance_mode BOOLEAN DEFAULT false,
    allow_registrations BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT singleton_settings CHECK (id = 1)
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
GRANT SELECT ON public.system_settings TO anon;
-- Allow public read for maintenance mode
INSERT INTO public.system_settings (
        id,
        booking_fee,
        maintenance_mode,
        allow_registrations
    )
VALUES (1, 5.00, false, true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Settings are readable by everyone" ON public.system_settings;
CREATE POLICY "Settings are readable by everyone" ON public.system_settings FOR
SELECT TO authenticated,
    anon USING (true);
DROP POLICY IF EXISTS "Admins can update settings_fix" ON public.system_settings;
CREATE POLICY "Admins can update settings_fix" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- 4. BROADCASTS
-- DDL: Create table if missing
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_role TEXT CHECK (target_role IN ('all', 'instructor', 'student')),
    sent_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
DROP POLICY IF EXISTS "Admins can manage broadcasts_fix" ON public.broadcasts;
CREATE POLICY "Admins can manage broadcasts_fix" ON public.broadcasts FOR ALL TO authenticated USING (public.is_admin());
-- 5. SALES/LESSONS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
DROP POLICY IF EXISTS "Admins can view all lessons" ON public.lessons;
CREATE POLICY "Admins can view all lessons" ON public.lessons FOR
SELECT TO authenticated USING (
        (student_id = auth.uid())
        OR (
            instructor_id = (
                SELECT id
                FROM public.instructors
                WHERE user_id = auth.uid()
            )
        )
        OR public.is_admin()
    );
-- Fix for Sales History (instructor_subscriptions)
CREATE TABLE IF NOT EXISTS public.instructor_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID REFERENCES public.instructors(id),
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.instructor_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.instructor_subscriptions TO authenticated;
GRANT ALL ON public.instructor_subscriptions TO service_role;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.instructor_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.instructor_subscriptions FOR
SELECT TO authenticated USING (
        (
            instructor_id = (
                SELECT id
                FROM public.instructors
                WHERE user_id = auth.uid()
            )
        )
        OR public.is_admin()
    );
-- 6. INSTRUCTORS
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.instructors TO authenticated;
GRANT ALL ON public.instructors TO service_role;
GRANT SELECT ON public.instructors TO anon;
-- Allow public to see instructors
DROP POLICY IF EXISTS "Public can view instructors" ON public.instructors;
CREATE POLICY "Public can view instructors" ON public.instructors FOR
SELECT TO authenticated,
    anon USING (true);
DROP POLICY IF EXISTS "Admins can manage instructors" ON public.instructors;
CREATE POLICY "Admins can manage instructors" ON public.instructors FOR ALL TO authenticated USING (
    (user_id = auth.uid())
    OR public.is_admin()
);
-- 7. SUPPORT TICKETS
-- DDL: Create table if missing
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('open', 'resolved', 'closed')) DEFAULT 'open',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
DROP POLICY IF EXISTS "Admins can manage support tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage support tickets" ON public.support_tickets FOR ALL TO authenticated USING (
    (user_id = auth.uid())
    OR public.is_admin()
);
-- 8. CONTACT LEADS
CREATE TABLE IF NOT EXISTS public.contact_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.contact_leads TO authenticated;
GRANT ALL ON public.contact_leads TO service_role;
GRANT INSERT ON public.contact_leads TO anon;
-- Allow public contact form
DROP POLICY IF EXISTS "Anyone can create leads" ON public.contact_leads;
CREATE POLICY "Anyone can create leads" ON public.contact_leads FOR
INSERT TO anon,
    authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view leads" ON public.contact_leads;
CREATE POLICY "Admins can view leads" ON public.contact_leads FOR
SELECT TO authenticated USING (public.is_admin());
-- 9. ADMIN ACTION LOGS
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_action_logs TO authenticated;
GRANT ALL ON public.admin_action_logs TO service_role;
DROP POLICY IF EXISTS "Admins can log actions" ON public.admin_action_logs;
CREATE POLICY "Admins can log actions" ON public.admin_action_logs FOR ALL TO authenticated USING (public.is_admin());
-- 10. USER ROLES VISIBILITY (Optimization: Admins see all, Users see own)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read/manage roles" ON public.user_roles;
CREATE POLICY "Users can read/manage roles" ON public.user_roles FOR
SELECT TO authenticated USING (
        user_id = auth.uid()
        OR public.is_admin()
    );