-- Create table to track profile views for analytics
CREATE TABLE public.profile_views (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    viewer_id UUID,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_hash TEXT
);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (even anonymous)
CREATE POLICY "Anyone can log profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (true);

-- Instructors can view their own analytics
CREATE POLICY "Instructors can view own analytics"
ON public.profile_views
FOR SELECT
USING (
    instructor_id IN (
        SELECT id FROM public.instructors WHERE user_id = auth.uid()
    )
);

-- Create index for fast counting
CREATE INDEX idx_profile_views_instructor_id ON public.profile_views(instructor_id);
CREATE INDEX idx_profile_views_viewed_at ON public.profile_views(viewed_at);