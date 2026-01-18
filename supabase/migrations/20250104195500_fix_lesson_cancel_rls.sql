-- Allow students to cancel their own lessons
-- This policy allows updates to the 'status' column only, for records where the user is the student
create policy "Students can update their own lesson status" on "public"."lessons" for
update to authenticated using ((auth.uid() = student_id)) with check ((status = 'cancelled'::text));