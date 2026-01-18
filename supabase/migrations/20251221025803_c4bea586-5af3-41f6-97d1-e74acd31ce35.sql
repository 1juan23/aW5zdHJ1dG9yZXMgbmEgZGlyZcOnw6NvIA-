-- Table for lessons/bookings
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  price NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for instructor availability slots
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for lessons
DO $$ BEGIN
  CREATE POLICY "Students can view own lessons" ON public.lessons
  FOR SELECT USING (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Instructors can view their lessons" ON public.lessons
  FOR SELECT USING (instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Students can create lessons" ON public.lessons
  FOR INSERT WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Instructors can update lesson status" ON public.lessons
  FOR UPDATE USING (instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS policies for reviews
DO $$ BEGIN
  CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Students can create reviews for completed lessons" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (SELECT 1 FROM public.lessons WHERE id = lesson_id AND status = 'completed' AND student_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS policies for conversations
DO $$ BEGIN
  CREATE POLICY "Participants can view their conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = student_id OR 
    instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS policies for messages
DO $$ BEGIN
  CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE student_id = auth.uid() OR 
      instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE student_id = auth.uid() OR 
      instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Participants can mark messages as read" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE student_id = auth.uid() OR 
      instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS policies for availability_slots
DO $$ BEGIN
  CREATE POLICY "Anyone can view availability" ON public.availability_slots
  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Instructors can manage own availability" ON public.availability_slots
  FOR ALL USING (instructor_id IN (SELECT id FROM public.instructors WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable realtime for messages
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review photos
DO $$ BEGIN
  CREATE POLICY "Anyone can view review photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload review photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-photos' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Function to update instructor rating after a new review
CREATE OR REPLACE FUNCTION public.update_instructor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.instructors
  SET 
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE instructor_id = NEW.instructor_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE instructor_id = NEW.instructor_id)
  WHERE id = NEW.instructor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for updating instructor rating
DROP TRIGGER IF EXISTS update_instructor_rating_trigger ON public.reviews;
CREATE TRIGGER update_instructor_rating_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_instructor_rating();

-- Update updated_at trigger for lessons
DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();