-- Fix 1: Add UPDATE policy for conversations - only instructors can approve
CREATE POLICY "Instructors can approve conversations"
ON public.conversations
FOR UPDATE
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE user_id = auth.uid()
  )
);

-- Fix 2: Add UPDATE policy for lessons - students can cancel their lessons
CREATE POLICY "Students can update own pending lessons"
ON public.lessons
FOR UPDATE
USING (
  auth.uid() = student_id AND status IN ('pending', 'confirmed')
);

-- Fix 3: Add UPDATE policy for reviews - admins can moderate
CREATE POLICY "Admins can moderate reviews"
ON public.reviews
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 4: Add DELETE policy for reviews - admins can delete
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 5: Add DELETE policy for messages - users can delete their own
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (
  auth.uid() = sender_id
);