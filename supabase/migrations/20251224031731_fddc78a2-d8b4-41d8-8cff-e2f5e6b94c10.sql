-- Create security_logs table for tracking security events
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create login_attempts table for tracking failed logins
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Create index for faster lookups
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_attempted_at ON public.login_attempts(attempted_at);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs"
ON public.security_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Service role can insert (for edge functions and triggers)
CREATE POLICY "Service can insert security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  failed_attempts INTEGER;
  last_attempt TIMESTAMP WITH TIME ZONE;
  lockout_duration INTERVAL := '15 minutes';
  max_attempts INTEGER := 5;
BEGIN
  -- Count failed attempts in the last 15 minutes
  SELECT COUNT(*), MAX(attempted_at)
  INTO failed_attempts, last_attempt
  FROM public.login_attempts
  WHERE email = check_email
    AND success = false
    AND attempted_at > (now() - lockout_duration);
  
  -- If 5+ failed attempts, account is locked
  IF failed_attempts >= max_attempts THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  attempt_email TEXT,
  attempt_ip TEXT,
  attempt_success BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, success)
  VALUES (attempt_email, attempt_ip, attempt_success);
  
  -- Log to security_logs if failed
  IF NOT attempt_success THEN
    INSERT INTO public.security_logs (event_type, email, ip_address, details)
    VALUES (
      'failed_login',
      attempt_email,
      attempt_ip,
      jsonb_build_object('reason', 'invalid_credentials')
    );
  END IF;
  
  -- Clean up old attempts (older than 24 hours)
  DELETE FROM public.login_attempts
  WHERE attempted_at < (now() - INTERVAL '24 hours');
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (event_type, user_id, email, ip_address, user_agent, details)
  VALUES (p_event_type, p_user_id, p_email, p_ip_address, p_user_agent, p_details);
END;
$$;