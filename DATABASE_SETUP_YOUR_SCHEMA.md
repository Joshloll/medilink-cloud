# MediLink Cloud - Your Database Setup Guide

## ✅ Your Existing Tables (Confirmed)

| Table | Purpose | Columns |
|-------|---------|---------|
| `user_profiles` | All users (patients, doctors, admins) | id, user_id, email, role, first_name, last_name, phone, date_of_birth, gender, address, city, state, zip_code, country, profile_image_url, is_active, created_at, updated_at, password_hash |
| `doctors` | Doctor-specific data | id, user_id, license_number, specialization, years_of_experience, education, hospital_affiliation, consultation_fee, bio, available_days, available_time_start, available_time_end, is_accepting_new_patients, rating, total_reviews, created_at, updated_at |
| `patients` | (Optional - patient data actually stored in user_profiles) | Can be deleted if not needed |

## 📋 UPDATE REQUIRED: Add Missing Columns

### 1. Add to `user_profiles` Table
```sql
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS clinic_id INTEGER;
```

**Why?**
- `verified`: Tracks if doctors are approved by admin, if admins used valid clinic code
- `clinic_id`: Links users to their clinic for admin multi-clinic support

### 2. Add to `doctors` Table
```sql
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
```

**Why?**
- `verified` in doctors table tracks doctor approval status separately (more reliable)

## 🆕 NEW Tables to Create

### 3. Create `appointments` Table
```sql
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

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
```

### 4. Create `clinic_codes` Table
```sql
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

ALTER TABLE public.clinic_codes ENABLE ROW LEVEL SECURITY;
```

### 5. Add Sample Admin Codes for Testing
```sql
INSERT INTO public.clinic_codes (code, clinic_id, clinic_name, is_active, created_by)
VALUES 
    ('CLINIC-TEST-2024-001', 1, 'MediLink Main Clinic', true, 'admin@medilink.com'),
    ('CLINIC-TEST-2024-002', 1, 'MediLink Downtown Clinic', true, 'admin@medilink.com')
ON CONFLICT (code) DO NOTHING;
```

## 🔄 How Registration Works With Your Schema

### Patient Registration
```
1. User fills form with: Email, Password, Name, Phone, Date of Birth, Gender
2. Supabase Auth creates user in auth.users
3. Insert into user_profiles: email, role='patient', first_name, last_name, phone
4. Update user_profiles: date_of_birth, gender
5. ✓ Patient ready to book appointments
```

### Doctor Registration
```
1. User fills form with: Email, Password, Name, License, Specialization (dropdown)
2. Supabase Auth creates user in auth.users
3. Insert into user_profiles: email, role='doctor', first_name, last_name, phone
4. Insert into doctors: license_number, specialization, verified=false
5. ⏳ Doctor awaits admin approval
```

### Admin Registration
```
1. User fills form with: Email, Password, Name, Phone, Clinic Code
2. System validates clinic code in clinic_codes table
3. If invalid → Registration rejected with clear message
4. If valid → Supabase Auth creates user in auth.users
5. Insert into user_profiles: email, role='admin', first_name, last_name, phone, verified=true, clinic_id=from_code
6. Mark clinic code as used: used_by=user_id, used_at=now()
7. ✓ Admin can immediately login
```

## 🧪 Testing Checklist

### Step 1: Add columns to existing tables
- [ ] Add `verified` and `clinic_id` to user_profiles
- [ ] Add `verified` to doctors
- [ ] Run: `SUPABASE_SETUP.sql`

### Step 2: Test Patient Registration
- [ ] Go to `/auth.html`
- [ ] Select "Patient"
- [ ] Register with email, password, name, phone, DOB, gender
- [ ] Should see "Account created successfully"
- [ ] Login as patient
- [ ] Should access `/dashboard.html`

### Step 3: Test Doctor Registration
- [ ] Go to `/auth.html`
- [ ] Select "Doctor"
- [ ] Register with email, password, name, license, specialization (dropdown)
- [ ] Should see "Account created successfully"
- [ ] Try to login as doctor
- [ ] Should see "Your account is pending verification"

### Step 4: Test Admin Approval (Doctor Validation)
- [ ] Register as Admin with clinic code: `CLINIC-TEST-2024-001`
- [ ] Go to `/Admin/dashboard.html`
- [ ] Navigate to "Doctor Validation" tab
- [ ] Find pending doctor
- [ ] Click "Approve"
- [ ] Confirm success message

### Step 5: Test Doctor Login After Approval
- [ ] Go to `/auth.html`
- [ ] Select "Doctor"
- [ ] Enter doctor's email/password
- [ ] Should redirect to `/Doctor_Schedule/doctor_dashboard.html` ✓

## 🔗 Frontend Integration

Your frontend is already updated to work with this schema:

| File | Purpose | Status |
|------|---------|--------|
| `/auth.html` | Login/Register form | ✅ Updated for your schema |
| `/Doctor_Schedule/doctor_dashboard.html` | Doctor dashboard | ✅ Has Supabase auth checks |
| `/Admin/dashboard.html` | Admin dashboard | ✅ Doctor validation implemented |
| `/dashboard.html` | Patient dashboard | Existing, should work |

## ❌ Errors & Fixes

### "User profile not found"
**Fix**: Make sure user_profiles row was inserted during registration

### "Doctor profile not found"
**Fix**: Make sure doctors row was inserted with correct user_id

### "Invalid clinic code"
**Fix**: 
- Clinic code must exist in clinic_codes table
- Must have is_active = true
- Must not already be used (used_by IS NULL)

### "Your account is pending verification"
**Fix**: Admin must approve doctor (sets doctors.verified = true)

## 📊 Ready to Go!

Your existing tables work perfectly with the new system:
- ✅ user_profiles stores all user types (patients, doctors, admins)
- ✅ doctors table stores doctor-specific data
- ✅ New appointments table for booking system
- ✅ New clinic_codes table for admin validation
- ✅ All frontend code already integrated

Just run the SQL updates and you're ready to test!
