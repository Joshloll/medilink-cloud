-- MediLink Cloud Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table (extends user_profiles for doctor-specific info)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE NOT NULL,
    specialization TEXT NOT NULL,
    years_of_experience INTEGER,
    education TEXT,
    hospital_affiliation TEXT,
    consultation_fee DECIMAL(10, 2),
    bio TEXT,
    available_days TEXT[], -- Array of available days: ['monday', 'tuesday', etc.]
    available_time_start TIME,
    available_time_end TIME,
    is_accepting_new_patients BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table (extends user_profiles for patient-specific info)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    medical_record_number TEXT UNIQUE NOT NULL,
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT[], -- Array of allergies
    chronic_conditions TEXT[], -- Array of chronic conditions
    medications TEXT[], -- Array of current medications
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    primary_care_physician TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 30, -- Duration in minutes
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'surgery', 'checkup')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
    reason_for_visit TEXT,
    notes TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    follow_up_date DATE,
    cost DECIMAL(10, 2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('consultation', 'lab_result', 'imaging', 'prescription', 'vaccination', 'surgery')),
    title TEXT NOT NULL,
    description TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medications TEXT[], -- Array of medications prescribed
    lab_results JSONB, -- Store lab results as JSON
    imaging_results JSONB, -- Store imaging results as JSON
    vital_signs JSONB, -- Store vital signs as JSON
    notes TEXT,
    attachments TEXT[], -- Array of file URLs
    is_confidential BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    instructions TEXT,
    refills_remaining INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    prescribed_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_type TEXT NOT NULL,
    results JSONB NOT NULL, -- Store test results as JSON
    normal_range TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'abnormal', 'critical')),
    notes TEXT,
    test_date DATE NOT NULL,
    lab_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('appointment', 'lab_result', 'prescription', 'system', 'reminder')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_medical_record_number ON patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_doctor_id ON lab_results(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for doctors
CREATE POLICY "Doctors can view own doctor info" ON doctors
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.id = doctors.user_id
    ));

CREATE POLICY "Doctors can update own doctor info" ON doctors
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.id = doctors.user_id
    ));

-- RLS Policies for patients
CREATE POLICY "Patients can view own patient info" ON patients
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.id = patients.user_id
    ));

CREATE POLICY "Patients can update own patient info" ON patients
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.id = patients.user_id
    ));

-- RLS Policies for appointments
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM patients 
        WHERE patients.user_id = auth.uid() 
        AND patients.id = appointments.patient_id
    ));

CREATE POLICY "Doctors can view own appointments" ON appointments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM doctors 
        WHERE doctors.user_id = auth.uid() 
        AND doctors.id = appointments.doctor_id
    ));

CREATE POLICY "Patients can create appointments" ON appointments
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM patients 
        WHERE patients.user_id = auth.uid() 
        AND patients.id = appointments.patient_id
    ));

-- RLS Policies for medical records
CREATE POLICY "Patients can view own medical records" ON medical_records
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM patients 
        WHERE patients.user_id = auth.uid() 
        AND patients.id = medical_records.patient_id
    ));

CREATE POLICY "Doctors can view medical records they created" ON medical_records
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM doctors 
        WHERE doctors.user_id = auth.uid() 
        AND doctors.id = medical_records.doctor_id
    ));

CREATE POLICY "Doctors can create medical records" ON medical_records
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM doctors 
        WHERE doctors.user_id = auth.uid() 
        AND doctors.id = medical_records.doctor_id
    ));

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view own prescriptions" ON prescriptions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM patients 
        WHERE patients.user_id = auth.uid() 
        AND patients.id = prescriptions.patient_id
    ));

CREATE POLICY "Doctors can view prescriptions they prescribed" ON prescriptions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM doctors 
        WHERE doctors.user_id = auth.uid() 
        AND doctors.id = prescriptions.doctor_id
    ));

-- RLS Policies for lab results
CREATE POLICY "Patients can view own lab results" ON lab_results
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM patients 
        WHERE patients.user_id = auth.uid() 
        AND patients.id = lab_results.patient_id
    ));

CREATE POLICY "Doctors can view lab results they ordered" ON lab_results
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM doctors 
        WHERE doctors.user_id = auth.uid() 
        AND doctors.id = lab_results.doctor_id
    ));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate medical record number
CREATE OR REPLACE FUNCTION generate_medical_record_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_part := LPAD(nextval('medical_record_seq')::TEXT, 6, '0');
    RETURN 'MR-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for medical record numbers
CREATE SEQUENCE IF NOT EXISTS medical_record_seq START 1;

-- Create trigger for medical record number
CREATE OR REPLACE FUNCTION set_medical_record_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.medical_record_number IS NULL THEN
        NEW.medical_record_number := generate_medical_record_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_medical_record_number_trigger
    BEFORE INSERT ON patients
    FOR EACH ROW EXECUTE FUNCTION set_medical_record_number();

-- Insert sample data (optional - for testing)
-- This will be handled by the application, but you can uncomment for initial testing

-- Sample admin user (you'll need to create this through Supabase Auth)
-- INSERT INTO user_profiles (user_id, email, role, first_name, last_name)
-- VALUES ('your-admin-uuid', 'admin@medilink.com', 'admin', 'Admin', 'User');

-- Sample doctor (you'll need to create this through Supabase Auth first)
-- INSERT INTO user_profiles (user_id, email, role, first_name, last_name)
-- VALUES ('your-doctor-uuid', 'doctor@medilink.com', 'doctor', 'Sarah', 'Jenkins');

-- Then insert into doctors table
-- INSERT INTO doctors (user_id, license_number, specialization, years_of_experience)
-- VALUES ('your-doctor-uuid', 'MD-123456', 'Cardiology', 12);

-- Sample patient (you'll need to create this through Supabase Auth first)
-- INSERT INTO user_profiles (user_id, email, role, first_name, last_name)
-- VALUES ('your-patient-uuid', 'patient@medilink.com', 'patient', 'John', 'Smith');

-- Then insert into patients table
-- INSERT INTO patients (user_id, blood_type, allergies)
-- VALUES ('your-patient-uuid', 'O+', ARRAY['Penicillin']);

COMMIT;
