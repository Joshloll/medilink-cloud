# Supabase Database Setup for Doctor Login

## Tables Required

### 1. user_profiles (Links to Supabase Auth)
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

### 2. doctors
```sql
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    years_of_experience INT,
    education VARCHAR(255),
    hospital_affiliation VARCHAR(255),
    consultation_fee NUMERIC(10, 2),
    bio TEXT,
    available_days VARCHAR(255),
    available_time_start TIME,
    available_time_end TIME,
    is_accepting_new_patients BOOLEAN DEFAULT true,
    rating NUMERIC(3, 2),
    total_reviews INT DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_verified ON doctors(verified);
```

### 3. appointments
```sql
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    price NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### 4. clinic_codes
```sql
CREATE TABLE IF NOT EXISTS clinic_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    clinic_id INTEGER,
    clinic_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMP,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_clinic_codes_code ON clinic_codes(code);
CREATE INDEX idx_clinic_codes_active ON clinic_codes(is_active);
```

## Setup Instructions

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your MediLink Cloud project

2. **Run SQL Queries**
   - Go to SQL Editor
   - Copy and paste each CREATE TABLE statement above
   - Run them one by one

3. **Enable Row Level Security (RLS)**
   - Go to Authentication → Policies
   - For each table, enable RLS

4. **Create RLS Policies**

```sql
-- user_profiles RLS
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- doctors RLS
CREATE POLICY "Doctors can view own profile" ON doctors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified doctors" ON doctors
    FOR SELECT USING (verified = true);

CREATE POLICY "Doctors can update own profile" ON doctors
    FOR UPDATE USING (auth.uid() = user_id);

-- appointments RLS
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (
        auth.uid() = patient_id OR 
        auth.uid() = doctor_id
    );

CREATE POLICY "Doctors can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own appointments" ON appointments
    FOR UPDATE USING (auth.uid() = doctor_id);

-- clinic_codes RLS
CREATE POLICY "Only admins can view clinic codes" ON clinic_codes
    FOR SELECT USING (false);
```

## Database Connection in Code

The frontend JavaScript uses this connection:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://zczlhrsmlecannuqknju.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjemxocnNtbGVjYW5udXFrbmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njk3MjEsImV4cCI6MjA4ODA0NTcyMX0.bymF387OBZ_5JNojgm2cbm8rAUMyUfdaSKScrjnvMfc'
)
```

## Doctor Registration Flow

1. User fills form with: Email, Password, Name, License #, Specialization
2. Backend creates auth user via `supabase.auth.signUp()`
3. Creates entry in `user_profiles` table (verified = false by default)
4. Creates entry in `doctors` table (verified = false)
5. Admin reviews and approves in Admin Dashboard
6. Admin sets `doctors.verified = true`
7. Doctor can now login

## Doctor Login Flow

1. User enters email and password
2. `supabase.auth.signInWithPassword()` authenticates
3. Query `user_profiles.where(user_id == auth.user.id)`
4. Check `role == 'doctor'`
5. Query `doctors.where(user_id == auth.user.id)`
6. Check `doctors.verified == true`
7. If verified, redirect to `Doctor_Schedule/doctor_dashboard.html`
8. Dashboard uses `checkAuth()` to verify session and load doctor data

## Verification Workflow

### For Admin Dashboard:
1. View pending doctors in "Doctor Validation" tab
2. Review license, specialization, other details
3. Click "Approve" button
4. Backend runs: `UPDATE doctors SET verified = true WHERE user_id = '...'`
5. Doctor receives notification
6. Doctor can now login

## Troubleshooting

### Doctor can't login
**Check:**
- User exists in `auth.users`
- User profile exists in `user_profiles` with:
  - `role = 'doctor'`
  - `user_id` matches auth.users.id
- Doctor profile exists in `doctors` with:
  - `user_id` matches auth.users.id
  - `verified = true`

### Query: Check if doctor is verified
```sql
SELECT dp.first_name, dp.last_name, d.specialization, d.verified
FROM user_profiles dp
JOIN doctors d ON d.user_id = dp.user_id
WHERE dp.role = 'doctor' AND d.verified = false;
```

### Approve a doctor
```sql
UPDATE doctors 
SET verified = true, updated_at = NOW() 
WHERE user_id = 'doctor-user-id-here';
```

### View today's doctor appointments
```sql
SELECT 
    a.id,
    a.appointment_time,
    a.service,
    up.first_name,
    up.last_name,
    a.status
FROM appointments a
JOIN user_profiles up ON up.user_id = a.patient_id
WHERE a.doctor_id = 'doctor-user-id-here'
    AND a.appointment_date = CURRENT_DATE
ORDER BY a.appointment_time;
```
