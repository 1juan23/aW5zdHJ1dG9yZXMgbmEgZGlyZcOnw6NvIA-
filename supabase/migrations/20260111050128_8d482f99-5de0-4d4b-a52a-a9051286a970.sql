-- Add vehicle_type and has_teaching_license columns to instructors
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT 'car',
ADD COLUMN IF NOT EXISTS has_teaching_license boolean DEFAULT false;

-- Add comment for vehicle_type
COMMENT ON COLUMN public.instructors.vehicle_type IS 'Type of vehicle: car, motorcycle, or both';