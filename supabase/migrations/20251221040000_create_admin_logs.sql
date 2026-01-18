-- Create admin_action_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_instructor_id UUID NOT NULL REFERENCES public.instructors(id),
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all logs" ON public.admin_action_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert logs" ON public.admin_action_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Instructors can view their own logs" ON public.admin_action_logs
FOR SELECT USING (
  target_instructor_id IN (
    SELECT id FROM public.instructors 
    WHERE user_id = auth.uid()
  )
);
