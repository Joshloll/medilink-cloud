-- ============================================================================
-- MEDILINK CLOUD - COMPLETE DATABASE QUERIES
-- All queries needed for full system functionality
-- ============================================================================

-- ============================================================================
-- 1. DOCTOR REGISTRATION & VALIDATION
-- ============================================================================

-- Query 1.1: Register a new doctor (insert into doctors table)
-- Prerequisites: User must exist in auth.users (Supabase handles this)
INSERT INTO public.doctors (
    user_id,
    license_number,
    specialization,
    years_of_experience,
    education,
    hospital_affiliation,
    consultation_fee,
    bio,
    available_days,
    available_time_start,
    available_time_end,
    is_accepting_new_patients,
    rating,
    total_reviews,
    verified
)
VALUES (
    'USER_UUID_HERE',           -- The user_id from Supabase auth
    'LIC-2026-00123',           -- License number
    'Cardiology',               -- Specialization
    10,                         -- Years of experience
    'MD from Harvard Medical School', -- Education
    'Massachusetts General Hospital',  -- Hospital affiliation
    150.00,                     -- Consultation fee
    'Experienced cardiologist with 10+ years of practice', -- Bio
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], -- Available days
    '09:00:00'::time,           -- Start time
    '17:00:00'::time,           -- End time
    true,                       -- Accepting new patients
    4.8,                        -- Rating
    45,                         -- Total reviews
    false                       -- NOT verified (pending approval)
);

-- Query 1.2: Get all pending doctors (for admin approval)
SELECT 
    d.id,
    d.user_id,
    d.license_number,
    d.specialization,
    d.years_of_experience,
    d.education,
    d.hospital_affiliation,
    d.consultation_fee,
    d.bio,
    d.created_at,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    u.user_metadata->>'phone' as phone
FROM public.doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE d.verified = false
ORDER BY d.created_at DESC;

-- Query 1.3: Approve a doctor (update verified to true)
UPDATE public.doctors
SET verified = true, updated_at = now()
WHERE id = 'DOCTOR_ID_HERE';

-- Query 1.4: Reject a doctor (optional - mark or delete)
-- Option A: Mark as inactive
UPDATE public.doctors
SET verified = false, updated_at = now()
WHERE id = 'DOCTOR_ID_HERE';

-- Query 1.5: Get all verified doctors
SELECT 
    d.id,
    d.user_id,
    d.license_number,
    d.specialization,
    d.years_of_experience,
    d.consultation_fee,
    d.bio,
    d.rating,
    d.total_reviews,
    d.is_accepting_new_patients,
    d.available_days,
    d.available_time_start,
    d.available_time_end,
    u.email,
    u.user_metadata->>'full_name' as full_name
FROM public.doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE d.verified = true
ORDER BY d.rating DESC, d.total_reviews DESC;

-- Query 1.6: Get specific doctor details
SELECT 
    d.*,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    COUNT(a.id) as total_appointments
FROM public.doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
LEFT JOIN public.appointments a ON d.id = a.doctor_id
WHERE d.id = 'DOCTOR_ID_HERE'
GROUP BY d.id, u.id;

-- ============================================================================
-- 2. PATIENT REGISTRATION & PROFILE
-- ============================================================================

-- Query 2.1: Register a new patient
INSERT INTO public.patients (
    user_id,
    medical_record_number,
    blood_type,
    allergies
)
VALUES (
    'USER_UUID_HERE',           -- The user_id from Supabase auth
    'MRN-' || to_char(now(), 'YYYYMM') || '-' || LPAD(random()::text, 5, '0'),
    'O+',                       -- Blood type
    ARRAY['Penicillin', 'Peanuts'] -- Allergies (array)
);

-- Query 2.2: Get patient details with user info
SELECT 
    p.*,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    u.user_metadata->>'phone' as phone,
    u.user_metadata->>'date_of_birth' as date_of_birth,
    u.user_metadata->>'gender' as gender
FROM public.patients p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.id = 'PATIENT_ID_HERE';

-- Query 2.3: Update patient profile
UPDATE public.patients
SET 
    blood_type = 'A+',
    allergies = ARRAY['Aspirin'],
    updated_at = now()
WHERE id = 'PATIENT_ID_HERE';

-- ============================================================================
-- 3. APPOINTMENT BOOKING & MANAGEMENT
-- ============================================================================

-- Query 3.1: Book a new appointment (status = 'Pending Confirmation')
INSERT INTO public.appointments (
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    duration,
    appointment_type,
    status,
    reason_for_visit,
    notes,
    cost,
    payment_status,
    created_at,
    updated_at
)
VALUES (
    'PATIENT_ID_HERE',          -- Patient UUID
    'DOCTOR_ID_HERE',           -- Doctor UUID
    '2026-04-15'::date,         -- Appointment date
    '14:00:00'::time,           -- Appointment time
    30,                         -- Duration in minutes
    'Consultation',             -- Type: Consultation, Follow-up, etc.
    'Pending Confirmation',     -- Initial status
    'Regular checkup',          -- Reason for visit
    'Patient requested morning slot', -- Additional notes
    150.00,                     -- Cost (use doctor's consultation_fee)
    'Unpaid',                   -- Payment status
    now(),
    now()
);

-- Query 3.2: Check appointment availability (conflicts)
SELECT *
FROM public.appointments
WHERE 
    doctor_id = 'DOCTOR_ID_HERE'
    AND appointment_date = '2026-04-15'::date
    AND appointment_status != 'Cancelled'
    AND (
        (appointment_time::time >= '14:00:00'::time AND appointment_time::time < '14:30:00'::time)
        OR (appointment_time::time + (duration || ' minutes')::interval > '14:00:00'::time 
            AND appointment_time::time < ('14:00:00'::time + '30 minutes'::interval))
    );

-- Query 3.3: Get all pending appointments (for doctor to confirm/reject)
SELECT 
    a.*,
    p.id as patient_id,
    u_patient.email as patient_email,
    u_patient.user_metadata->>'full_name' as patient_name,
    d.specialization,
    d.available_time_start,
    d.available_time_end
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN auth.users u_patient ON p.user_id = u_patient.id
JOIN public.doctors d ON a.doctor_id = d.id
WHERE 
    a.doctor_id = 'DOCTOR_ID_HERE'
    AND a.status = 'Pending Confirmation'
ORDER BY a.appointment_date ASC, a.appointment_time ASC;

-- Query 3.4: Confirm appointment (doctor action)
UPDATE public.appointments
SET 
    status = 'Confirmed',
    updated_at = now()
WHERE id = 'APPOINTMENT_ID_HERE';

-- Query 3.5: Reject/Cancel appointment (doctor action)
UPDATE public.appointments
SET 
    status = 'Cancelled',
    updated_at = now()
WHERE id = 'APPOINTMENT_ID_HERE';

-- Query 3.6: Update appointment with medical details (after appointment)
UPDATE public.appointments
SET 
    symptoms = 'Chest pain, shortness of breath',
    diagnosis = 'Hypertension',
    treatment = 'Prescribed medication and lifestyle changes',
    prescription = 'Atorvastatin 20mg daily',
    notes = 'Patient advised to reduce salt intake',
    follow_up_date = '2026-05-15'::date,
    status = 'Completed',
    updated_at = now()
WHERE id = 'APPOINTMENT_ID_HERE';

-- Query 3.7: Get patient's appointments
SELECT 
    a.*,
    d.id as doctor_id,
    u_doctor.email as doctor_email,
    u_doctor.user_metadata->>'full_name' as doctor_name,
    d.specialization,
    d.hospital_affiliation
FROM public.appointments a
JOIN public.doctors d ON a.doctor_id = d.id
JOIN auth.users u_doctor ON d.user_id = u_doctor.id
WHERE 
    a.patient_id = 'PATIENT_ID_HERE'
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- Query 3.8: Get doctor's appointments for a specific date
SELECT 
    a.*,
    p.id as patient_id,
    u_patient.email as patient_email,
    u_patient.user_metadata->>'full_name' as patient_name,
    u_patient.user_metadata->>'phone' as patient_phone
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN auth.users u_patient ON p.user_id = u_patient.id
WHERE 
    a.doctor_id = 'DOCTOR_ID_HERE'
    AND a.appointment_date = '2026-04-15'::date
    AND a.status != 'Cancelled'
ORDER BY a.appointment_time ASC;

-- Query 3.9: Get today's appointments for doctor
SELECT 
    a.*,
    p.id as patient_id,
    u_patient.email as patient_email,
    u_patient.user_metadata->>'full_name' as patient_name,
    COUNT(CASE WHEN a.status = 'Confirmed' THEN 1 END) as confirmed_count
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN auth.users u_patient ON p.user_id = u_patient.id
WHERE 
    a.doctor_id = 'DOCTOR_ID_HERE'
    AND a.appointment_date = CURRENT_DATE
    AND a.status IN ('Confirmed', 'Completed')
GROUP BY a.id, p.id, u_patient.id
ORDER BY a.appointment_time ASC;

-- ============================================================================
-- 4. ADMIN DASHBOARD - FULL SYSTEM VIEW
-- ============================================================================

-- Query 4.1: Get ALL appointments with complete details
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.duration,
    a.appointment_type,
    a.status,
    a.cost,
    a.payment_status,
    a.created_at,
    a.updated_at,
    p.id as patient_id,
    u_patient.email as patient_email,
    u_patient.user_metadata->>'full_name' as patient_name,
    d.id as doctor_id,
    u_doctor.email as doctor_email,
    u_doctor.user_metadata->>'full_name' as doctor_name,
    d.specialization,
    d.hospital_affiliation
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN auth.users u_patient ON p.user_id = u_patient.id
JOIN public.doctors d ON a.doctor_id = d.id
JOIN auth.users u_doctor ON d.user_id = u_doctor.id
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- Query 4.2: Get appointments with specific status filter
SELECT 
    a.id,
    a.status,
    a.appointment_date,
    a.appointment_time,
    u_patient.user_metadata->>'full_name' as patient_name,
    u_doctor.user_metadata->>'full_name' as doctor_name,
    d.specialization,
    a.cost,
    a.payment_status
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN auth.users u_patient ON p.user_id = u_patient.id
JOIN public.doctors d ON a.doctor_id = d.id
JOIN auth.users u_doctor ON d.user_id = u_doctor.id
WHERE a.status = 'STATUS_HERE'  -- Replace with: 'Pending Confirmation', 'Confirmed', 'Completed', 'Cancelled'
ORDER BY a.appointment_date DESC;

-- Query 4.3: Get all doctors (verified status)
SELECT 
    d.id,
    d.user_id,
    d.specialization,
    d.years_of_experience,
    d.consultation_fee,
    d.verified,
    d.rating,
    d.total_reviews,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    COUNT(a.id) as total_appointments
FROM public.doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
LEFT JOIN public.appointments a ON d.id = a.doctor_id
GROUP BY d.id, u.id
ORDER BY d.verified DESC, d.created_at DESC;

-- Query 4.4: Get all patients
SELECT 
    p.id,
    p.user_id,
    p.medical_record_number,
    p.blood_type,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    u.user_metadata->>'phone' as phone,
    COUNT(a.id) as total_appointments
FROM public.patients p
LEFT JOIN auth.users u ON p.user_id = u.id
LEFT JOIN public.appointments a ON p.id = a.patient_id
GROUP BY p.id, u.id
ORDER BY p.created_at DESC;

-- Query 4.5: Dashboard statistics - overall metrics
SELECT 
    (SELECT COUNT(*) FROM public.doctors WHERE verified = true) as total_doctors,
    (SELECT COUNT(*) FROM public.doctors WHERE verified = false) as pending_doctors,
    (SELECT COUNT(*) FROM public.patients) as total_patients,
    (SELECT COUNT(*) FROM public.appointments WHERE status = 'Pending Confirmation') as pending_appointments,
    (SELECT COUNT(*) FROM public.appointments WHERE status = 'Confirmed') as confirmed_appointments,
    (SELECT COUNT(*) FROM public.appointments WHERE status = 'Completed') as completed_appointments,
    (SELECT COUNT(*) FROM public.appointments WHERE appointment_date = CURRENT_DATE AND status IN ('Confirmed', 'Completed')) as todays_appointments,
    (SELECT COALESCE(SUM(cost), 0) FROM public.appointments WHERE status = 'Completed') as total_revenue;

-- Query 4.6: Get pending doctors for approval
SELECT 
    d.id,
    d.license_number,
    d.specialization,
    d.years_of_experience,
    d.bio,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    d.created_at
FROM public.doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE d.verified = false
ORDER BY d.created_at DESC;

-- Query 4.7: Approve doctor from admin panel
UPDATE public.doctors
SET verified = true, updated_at = now()
WHERE id = 'DOCTOR_ID_HERE'
RETURNING id, user_id, verified;

-- ============================================================================
-- 5. NOTIFICATIONS
-- ============================================================================

-- Query 5.1: Create notification for doctor (appointment pending)
INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    action_url,
    created_at
)
VALUES (
    'DOCTOR_USER_ID_HERE',      -- Doctor's user_id
    'New Appointment Pending',
    'A patient has booked an appointment with you. Please review and confirm.',
    'appointment_request',
    false,
    '/doctor/appointments/pending',
    now()
);

-- Query 5.2: Create notification for patient (appointment confirmed)
INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    action_url,
    created_at
)
VALUES (
    'PATIENT_USER_ID_HERE',     -- Patient's user_id
    'Appointment Confirmed',
    'Your appointment has been confirmed by Dr. Smith on April 15, 2026 at 2:00 PM',
    'appointment_confirmed',
    false,
    '/patient/appointments',
    now()
);

-- Query 5.3: Create notification for admin (new doctor registration)
INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    action_url,
    created_at
)
VALUES (
    'ADMIN_USER_ID_HERE',       -- Admin's user_id
    'New Doctor Registration',
    'A new doctor (Dr. John Doe - Cardiology) is pending approval',
    'doctor_registration',
    false,
    '/admin/doctors/pending',
    now()
);

-- Query 5.4: Get unread notifications for user
SELECT 
    id,
    title,
    message,
    type,
    action_url,
    created_at
FROM public.notifications
WHERE 
    user_id = 'USER_ID_HERE'
    AND is_read = false
ORDER BY created_at DESC;

-- Query 5.5: Mark notification as read
UPDATE public.notifications
SET is_read = true
WHERE id = 'NOTIFICATION_ID_HERE';

-- ============================================================================
-- 6. LAB RESULTS
-- ============================================================================

-- Query 6.1: Add lab results for patient
INSERT INTO public.lab_results (
    patient_id,
    doctor_id,
    test_name,
    test_type,
    results,
    normal_range,
    status,
    notes,
    test_date,
    lab_name,
    created_at,
    updated_at
)
VALUES (
    'PATIENT_ID_HERE',
    'DOCTOR_ID_HERE',
    'Complete Blood Count',
    'Blood Test',
    '{"WBC": "7.2", "RBC": "4.8", "Hemoglobin": "14.5"}'::jsonb,
    'WBC: 4.5-11.0, RBC: 4.5-5.5, Hemoglobin: 13.5-17.5',
    'Normal',
    'All values within normal range',
    '2026-04-10'::date,
    'Central Lab',
    now(),
    now()
);

-- Query 6.2: Get patient's lab results
SELECT 
    l.*,
    u_doctor.user_metadata->>'full_name' as doctor_name,
    d.specialization
FROM public.lab_results l
LEFT JOIN public.doctors d ON l.doctor_id = d.id
LEFT JOIN auth.users u_doctor ON d.user_id = u_doctor.id
WHERE l.patient_id = 'PATIENT_ID_HERE'
ORDER BY l.test_date DESC;

-- ============================================================================
-- 7. MEDICAL RECORDS
-- ============================================================================

-- Query 7.1: Create medical record
INSERT INTO public.medical_records (
    patient_id,
    doctor_id,
    record_type,
    title,
    description,
    diagnosis,
    treatment,
    medications,
    vital_signs,
    notes,
    is_confidential,
    created_at,
    updated_at
)
VALUES (
    'PATIENT_ID_HERE',
    'DOCTOR_ID_HERE',
    'Consultation Note',
    'Hypertension Management',
    'Follow-up consultation for hypertension management',
    'Essential Hypertension',
    'Continue current medication, reduce sodium intake',
    ARRAY['Lisinopril 10mg daily', 'Hydrochlorothiazide 25mg daily'],
    '{"BP": "140/90", "HR": "72", "Temperature": "98.6"}'::jsonb,
    'Patient compliant with medication, BP slightly elevated',
    false,
    now(),
    now()
);

-- Query 7.2: Get patient's medical records
SELECT 
    m.*,
    u_doctor.user_metadata->>'full_name' as doctor_name,
    d.specialization
FROM public.medical_records m
LEFT JOIN public.doctors d ON m.doctor_id = d.id
LEFT JOIN auth.users u_doctor ON d.user_id = u_doctor.id
WHERE m.patient_id = 'PATIENT_ID_HERE'
ORDER BY m.created_at DESC;

-- ============================================================================
-- 8. AUDIT LOG - For compliance and tracking
-- ============================================================================

-- Query 8.1: Get audit logs for a specific user action
SELECT 
    id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    created_at
FROM public.audit_log
WHERE user_id = 'USER_ID_HERE' OR action = 'ACTION_TYPE'
ORDER BY created_at DESC
LIMIT 100;

-- Query 8.2: Get all changes to a specific record
SELECT 
    id,
    user_id,
    action,
    old_values,
    new_values,
    created_at
FROM public.audit_log
WHERE 
    table_name = 'appointments'
    AND record_id = 'APPOINTMENT_ID_HERE'
ORDER BY created_at DESC;

-- ============================================================================
-- 9. CLINIC CODES - For doctor registration (if using code-based registration)
-- ============================================================================

-- Query 9.1: Create clinic code
INSERT INTO public.clinic_codes (
    code,
    clinic_id,
    clinic_name,
    is_active,
    created_by,
    expires_at,
    created_at
)
VALUES (
    'CLINIC-2026-ABC123',
    1,
    'Central Medical Center',
    true,
    'admin@medilink.com',
    now() + interval '90 days',
    now()
);

-- Query 9.2: Check if clinic code is valid
SELECT 
    id,
    code,
    clinic_name,
    is_active,
    expires_at
FROM public.clinic_codes
WHERE 
    code = 'CLINIC-2026-ABC123'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

-- Query 9.3: Use clinic code
UPDATE public.clinic_codes
SET 
    used_by = 'NEW_DOCTOR_USER_ID_HERE',
    used_at = now()
WHERE code = 'CLINIC-2026-ABC123';

-- ============================================================================
-- 10. KEY FUNCTIONS FOR REAL-TIME DATA
-- ============================================================================

-- Function 10.1: Get real-time appointment status
SELECT 
    id,
    status,
    created_at,
    updated_at,
    CASE 
        WHEN status = 'Pending Confirmation' THEN '⏳ Waiting for doctor confirmation'
        WHEN status = 'Confirmed' THEN '✅ Confirmed'
        WHEN status = 'Completed' THEN '✔️ Completed'
        WHEN status = 'Cancelled' THEN '❌ Cancelled'
    END as status_display
FROM public.appointments
WHERE id = 'APPOINTMENT_ID_HERE';

-- Function 10.2: Get dashboard statistics in real-time
SELECT 
    jsonb_build_object(
        'total_doctors', (SELECT COUNT(*) FROM doctors WHERE verified = true),
        'pending_doctors', (SELECT COUNT(*) FROM doctors WHERE verified = false),
        'total_patients', (SELECT COUNT(*) FROM patients),
        'pending_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'Pending Confirmation'),
        'confirmed_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'Confirmed'),
        'completed_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'Completed'),
        'todays_schedule', (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE),
        'total_revenue', (SELECT COALESCE(SUM(cost), 0) FROM appointments WHERE status = 'Completed'),
        'last_updated', now()
    ) as dashboard_stats;

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================
/*
Replace placeholders:
- 'USER_UUID_HERE' with actual UUID from Supabase auth
- 'DOCTOR_ID_HERE' with actual doctor record UUID
- 'PATIENT_ID_HERE' with actual patient record UUID
- 'APPOINTMENT_ID_HERE' with actual appointment record UUID
- 'ADMIN_USER_ID_HERE' with admin user UUID
- Dates and times with actual values

All timestamps use: now() function in PostgreSQL

Status values for appointments:
- 'Pending Confirmation' (initial)
- 'Confirmed' (doctor approved)
- 'Completed' (appointment finished)
- 'Cancelled' (cancelled by either party)

Payment status values:
- 'Unpaid'
- 'Paid'
- 'Partial'
- 'Refunded'
*/
