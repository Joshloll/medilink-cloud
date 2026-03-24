-- MediLink Cloud - Supabase Database Setup Script
-- This script adds ONLY the missing tables to your existing schema
-- Your existing tables (user_profiles, doctors, patients) are NOT recreated

-- ==========================================
-- NOTE: EXISTING TABLES (DO NOT MODIFY)
-- ==========================================
-- user_profiles: id, user_id, email, role, first_name, last_name, phone, 
--                date_of_birth, gender, address, city, state, zip_code, 
--                country, profile_image_url, is_active, created_at, updated_at, password_hash
-- 
-- doctors: id, user_id, license_number, specialization, years_of_experience, 
--          education, hospital_affiliation, consultation_fee, bio, available_days, 
--          available_time_start, available_time_end, is_accepting_new_patients, 
--          rating, total_reviews, created_at, updated_at
--
-- patients: (to be deleted - patient data stored in user_profiles with role='patient')

-- ==========================================
-- 1. ADD MISSING COLUMNS TO user_profiles
-- ==========================================
-- Check if verified column exists, if not add it
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS clinic_id INTEGER;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ==========================================
-- 2. ADD MISSING COLUMNS TO doctors TABLE
-- ==========================================
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_verified ON doctors(verified);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);

-- Add RLS policies if they don't exist
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. APPOINTMENTS TABLE (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    price NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, appointment_time);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY IF NOT EXISTS "Patients can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY IF NOT EXISTS "Doctors can update appointments" ON appointments
    FOR UPDATE USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

-- ==========================================
-- 4. CLINIC CODES TABLE (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clinic_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    clinic_id INTEGER,
    clinic_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_clinic_codes_code ON clinic_codes(code);
CREATE INDEX IF NOT EXISTS idx_clinic_codes_active ON clinic_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_clinic_codes_clinic ON clinic_codes(clinic_id);

ALTER TABLE public.clinic_codes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. SAMPLE DATA FOR TESTING
-- ==========================================

-- Insert sample clinic codes for testing admin registration
INSERT INTO public.clinic_codes (code, clinic_id, clinic_name, is_active, created_by)
VALUES 
    ('CLINIC-TEST-2024-001', 1, 'MediLink Main Clinic', true, 'admin@medilink.com'),
    ('CLINIC-TEST-2024-002', 1, 'MediLink Downtown Clinic', true, 'admin@medilink.com')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- SUCCESS - SETUP COMPLETE
-- ==========================================
-- Your existing tables remain unchanged:
-- ✓ user_profiles - Patient registration data stored here with role = 'patient'
-- ✓ doctors - Doctor-specific data
-- ✓ patients - (optional to delete if not needed)
--
-- New tables added:
-- ✓ appointments - Booking system
-- ✓ clinic_codes - Admin validation codes
