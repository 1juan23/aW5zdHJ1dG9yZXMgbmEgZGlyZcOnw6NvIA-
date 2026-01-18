ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS cnh_number text,
    ADD COLUMN IF NOT EXISTS cnh_category text,
    ADD COLUMN IF NOT EXISTS cnh_url text;
-- Add comment to explain columns
COMMENT ON COLUMN public.instructors.cnh_number IS 'Driver License Number for verification';
COMMENT ON COLUMN public.instructors.cnh_category IS 'Driver License Category (A, B, AB, etc.)';
COMMENT ON COLUMN public.instructors.cnh_url IS 'URL to the uploaded CNH document image';