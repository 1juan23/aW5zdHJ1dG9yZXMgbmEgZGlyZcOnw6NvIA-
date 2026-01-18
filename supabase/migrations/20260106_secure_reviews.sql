-- Enable RLS to be sure
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- Re-apply read policy (public read is fine)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR
SELECT USING (true);
-- Drop loose insert policies if they exist (clean up)
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Students can create reviews" ON public.reviews;
-- Create STRICT Insert Policy
-- 1. Must be the authenticated user
-- 2. Must correspond to a lesson that is COMPLETED
-- 3. Lesson must belong to that student and that instructor
CREATE POLICY "Students can review own completed lessons" ON public.reviews FOR
INSERT TO authenticated WITH CHECK (
        auth.uid() = student_id
        AND EXISTS (
            SELECT 1
            FROM public.lessons
            WHERE lessons.id = lesson_id
                AND lessons.student_id = auth.uid()
                AND lessons.instructor_id = instructor_id
                AND lessons.status = 'completed'
        )
    );
-- Prevent Duplicate Reviews on the same lesson
-- This ensures that a student cannot "spam" reviews for a single class.
-- If the index already exists, this might error, so we wrap in a DO block or just use IF NOT EXISTS if supported (Postgres 9.5+ supports IF NOT EXISTS for indexes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_lesson_id ON public.reviews (lesson_id);