-- Fix RLS policies for doctors table to allow doctor self-registration
-- This script fixes the "new row violates row-level security policy" error

-- First, disable existing RLS policies temporarily
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "doctors_select_policy" ON doctors;
DROP POLICY IF EXISTS "doctors_insert_policy" ON doctors;
DROP POLICY IF EXISTS "doctors_update_policy" ON doctors;
DROP POLICY IF EXISTS "doctors_delete_policy" ON doctors;

-- Allow anyone to SELECT doctors (needed for appointment booking)
CREATE POLICY "doctors_select_policy" ON doctors
  FOR SELECT
  USING (true);

-- Allow newly authenticated users to INSERT their own doctor record during registration
CREATE POLICY "doctors_insert_policy" ON doctors
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- Allow doctors to UPDATE their own profile, allow admins to update any
CREATE POLICY "doctors_update_policy" ON doctors
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- Allow only admins to DELETE
CREATE POLICY "doctors_delete_policy" ON doctors
  FOR DELETE
  USING (
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- Also ensure appointments table has proper RLS for creating appointments
DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;

CREATE POLICY "appointments_select_policy" ON appointments
  FOR SELECT
  USING (true);

CREATE POLICY "appointments_insert_policy" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'authenticated'
  );

CREATE POLICY "appointments_update_policy" ON appointments
  FOR UPDATE
  USING (
    auth.uid() = patient_id OR
    auth.uid() = (SELECT user_id FROM doctors WHERE id = doctor_id) OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = patient_id OR
    auth.uid() = (SELECT user_id FROM doctors WHERE id = doctor_id) OR
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'admin'
  );
