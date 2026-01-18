-- Fix system_settings RLS issues
-- Upsert requires INSERT permission even if updating an existing row
CREATE POLICY "Only admins can insert settings" ON public.system_settings FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
-- Separate migration to ensure updated_by is tracked if we used it (optional, but good)
-- For now, just fixing the permission blocker.