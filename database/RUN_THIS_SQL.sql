-- ========================================
-- MediLink Cloud - Supabase SQL Setup
-- For Your Existing Schema
-- ========================================
-- 
-- COPY THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR AND RUN IT
-- Your existing tables (user_profiles, doctors, patients) will remain unchanged
-- 
-- ========================================

-- Step 1: Add missing columns to existing user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS clinic_id INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_verified ON user_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic ON user_profiles(clinic_id);

-- ========================================

-- Step 2: Add verified column to existing doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctors_verified ON doctors(verified);

-- ========================================

-- Step 3: Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    price NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, appointment_time);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ========================================

-- Step 4: Create clinic_codes table for admin validation
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clinic_codes_code ON clinic_codes(code);
CREATE INDEX IF NOT EXISTS idx_clinic_codes_active ON clinic_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_clinic_codes_clinic ON clinic_codes(clinic_id);

-- Enable RLS
ALTER TABLE public.clinic_codes ENABLE ROW LEVEL SECURITY;

-- ========================================

-- Step 5: Insert sample admin codes for testing
INSERT INTO public.clinic_codes (code, clinic_id, clinic_name, is_active, created_by)
VALUES 
    ('CLINIC-TEST-2024-001', 1, 'MediLink Main Clinic', true, 'admin@medilink.com'),
    ('CLINIC-TEST-2024-002', 1, 'MediLink Downtown Clinic', true, 'admin@medilink.com')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- SUCCESS!
-- ========================================
-- Database is now ready for:
-- ✓ Patient registration (data stored in user_profiles)
-- ✓ Doctor registration (data stored in doctors table)
-- ✓ Admin registration (via clinic validation code)
-- ✓ Appointment bookings (via appointments table)
-- ✓ Admin dashboard for doctor validation
-- 
-- Next steps:
-- 1. Test patient registration at /auth.html
-- 2. Test doctor registration
-- 3. Use admin clinic code to register admin account
-- 4. Approve doctors in admin dashboard
-- 5. Test doctor login
