-- Add Detran & Verification fields to instructors
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS detran_id text UNIQUE,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Create Bookings table (Pricing & Scheduling)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) NOT NULL,
  instructor_id uuid REFERENCES instructors(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED')),
  amount integer NOT NULL, -- in cents
  platform_fee integer NOT NULL, -- in cents
  instructor_cut integer NOT NULL, -- in cents
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies for Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Student RLS
CREATE POLICY "Students can view own bookings" ON bookings
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create bookings" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Instructor RLS
CREATE POLICY "Instructors can view assigned bookings" ON bookings
  FOR SELECT TO authenticated
  USING (
    instructor_id IN (
      SELECT id FROM instructors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update assigned bookings" ON bookings
  FOR UPDATE TO authenticated
  USING (
    instructor_id IN (
      SELECT id FROM instructors WHERE user_id = auth.uid()
    )
  );
  
-- Admin RLS (assuming admins have access to everything or specific role)
-- For now, we assume RLS bypass for service role, or if we have an admin role check:
-- CREATE POLICY "Admins can view all" ...
