-- Tabela para registrar pagamentos de taxa de serviço dos alunos
CREATE TABLE public.student_instructor_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, instructor_id)
);

-- Enable RLS
ALTER TABLE public.student_instructor_access ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own access records
CREATE POLICY "Students can view own access"
ON public.student_instructor_access
FOR SELECT
USING (auth.uid() = student_id);

-- Policy: Students can insert their own access (via edge function with service role)
CREATE POLICY "Service role can manage access"
ON public.student_instructor_access
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_instructor_access;