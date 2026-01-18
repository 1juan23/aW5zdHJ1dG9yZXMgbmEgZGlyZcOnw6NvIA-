-- Enable RLS for availability_slots
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active slots (for students to view availability)
CREATE POLICY "Public can view active availability slots"
ON availability_slots
FOR SELECT
USING (is_active = true);

-- Allow instructors to manage their own slots
CREATE POLICY "Instructors can manage their own availability slots"
ON availability_slots
FOR ALL
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  )
);

-- Enable RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow students to view their own bookings
CREATE POLICY "Students can view their own bookings"
ON bookings
FOR SELECT
USING (student_id = auth.uid());

-- Allow instructors to view bookings assigned to them
CREATE POLICY "Instructors can view their assigned bookings"
ON bookings
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users (students) to create bookings
CREATE POLICY "Authenticated users can create bookings"
ON bookings
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Allow instructors to update bookings assigned to them (e.g., confirm/reject)
CREATE POLICY "Instructors can update their assigned bookings"
ON bookings
FOR UPDATE
USING (
  instructor_id IN (
    SELECT id FROM instructors WHERE user_id = auth.uid()
  )
);
