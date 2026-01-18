-- Drop the permissive INSERT policy that allows anyone to insert
DROP POLICY IF EXISTS "Service can insert security logs" ON public.security_logs;

-- Create a restrictive policy: only service_role can insert directly
-- Regular users must use the log_security_event() SECURITY DEFINER function
CREATE POLICY "Only service role can insert security logs"
ON public.security_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also fix login_attempts table which has the same issue
DROP POLICY IF EXISTS "Service can insert login attempts" ON public.login_attempts;

CREATE POLICY "Only service role can insert login attempts"
ON public.login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);