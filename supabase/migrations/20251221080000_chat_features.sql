-- Add columns for soft delete and message editing

-- Soft Delete columns for conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS instructor_deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS student_deleted_at TIMESTAMPTZ;

-- Edit support for messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- RLS Policy to allow updating own messages within 5 minutes
-- First, ensure update is enabled for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own messages within 5 minutes"
ON public.messages FOR UPDATE
TO authenticated
USING (
  auth.uid() = sender_id AND 
  created_at > (NOW() - INTERVAL '5 minutes')
)
WITH CHECK (
  auth.uid() = sender_id
);

-- Policy for Soft Delete (updating conversation)
-- Users need to be able to update 'conversations' to set their deleted_at
CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (
  (auth.uid() = student_id OR auth.uid() = instructor_id)
)
WITH CHECK (
  (auth.uid() = student_id OR auth.uid() = instructor_id)
);
