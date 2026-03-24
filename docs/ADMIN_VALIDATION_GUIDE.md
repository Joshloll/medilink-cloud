# Admin Registration & Validation Guide

## Overview

The MediLink Cloud admin registration system now uses a secure **clinic validation code** instead of department/level selections. This ensures only authorized personnel can register as administrators.

## Changes Made

### 1. Doctor Specialization - Dropdown Menu
- **Before**: Text input field (free text)
- **After**: Dropdown menu with predefined specialties
- **Available Options**:
  - Cardiology
  - Dermatology
  - Orthopedics
  - Pediatrics
  - General Medicine
  - Psychiatry

**Benefit**: Standardized specialties ensure consistency in the system and make filtering/searching for specific doctors easier.

### 2. Admin Registration - Clinic Validation Code
- **Before**: Department field + Admin Level dropdown (Super Admin, Validator, Support Admin)
- **After**: Single clinic validation code input
- **Field Name**: "Clinic Validation Code"

**Process**:
1. Admin applicant receives a unique code from clinic administrator
2. Enters code during registration
3. System validates code against `clinic_codes` table
4. If valid, admin account is immediately verified
5. Invalid codes are rejected with helpful error message

## Database Changes

### New Table: `clinic_codes`

```sql
CREATE TABLE clinic_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,           -- Unique validation code
    clinic_id INTEGER,                           -- Associated clinic
    clinic_name VARCHAR(255) NOT NULL,          -- Clinic name for reference
    is_active BOOLEAN DEFAULT true,             -- Whether code is still usable
    used_by INTEGER REFERENCES users(id),       -- User who used this code
    used_at TIMESTAMP,                          -- When code was used
    created_by VARCHAR(255),                    -- Admin who created code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP                        -- Optional expiration date
);
```

## How It Works

### For Clinic Administrators (Setting Up New Admins)

1. Generate a unique clinic validation code (e.g., `CLINIC-ABC-2024-001`)
2. Insert into `clinic_codes` table:
   ```sql
   INSERT INTO clinic_codes (code, clinic_id, clinic_name, is_active, created_by)
   VALUES ('CLINIC-ABC-2024-001', 1, 'MediLink Main Clinic', true, 'super_admin@medilink.com');
   ```
3. Share code with the person who needs admin access
4. Once they register with the code, it's marked as "used"

### For Users Registering as Admin

1. Click "Register" tab
2. Select "Admin" role
3. Enter the clinic validation code provided by your administrator
4. Complete registration
5. Account is immediately verified and ready to use

### For Users Logging In

**Doctors**:
- Can only login if their account has been approved by admin
- Will see "pending verification" message if not yet approved

**Admins**:
- Can only login if registered with valid clinic code
- Will see "not yet verified" message if registration was incomplete

## Security Features

✅ **Code Validation**: Codes are validated in real-time from database  
✅ **One-Time Use**: Each code can only be used once (tracked in `used_by` field)  
✅ **Expiration Support**: Optional expiration dates prevent old codes from working  
✅ **Audit Trail**: Record of who created codes and who used them  
✅ **Active Status**: Admins can deactivate codes by setting `is_active = false`  

## Admin Management Dashboard

The Admin Dashboard now includes these features:

### Doctor Validation Tab
- View pending doctor applications
- Approve/reject doctors with notes
- Filter by status (Pending, Approved, Rejected)

### Appointment Confirmations Tab
- Manage pending appointment requests
- Confirm or cancel appointments
- Add cancellation reasons

### Clinic Analytics Tab
- Real-time statistics (patients, doctors, appointments)
- Revenue tracking in Philippine Peso (₱)
- Top performing doctors
- Most booked services

### All Patients Tab
- Complete patient database
- Search and export functionality
- View patient appointment history

## Example Clinic Code Generation Scripts

### Generate Random Codes

```sql
-- Generate 10 new clinic codes for Clinic ID 1
INSERT INTO clinic_codes (code, clinic_id, clinic_name, is_active, created_by)
SELECT 
    'CLINIC-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 8) AS code,
    1 AS clinic_id,
    'MediLink Main Clinic' AS clinic_name,
    true AS is_active,
    'admin@medilink.com' AS created_by
FROM GENERATE_SERIES(1, 10);
```

### Create Code with Expiration

```sql
INSERT INTO clinic_codes (code, clinic_id, clinic_name, is_active, created_by, expires_at)
VALUES (
    'CLINIC-TEMP-2024-001',
    1,
    'MediLink Main Clinic',
    true,
    'admin@medilink.com',
    NOW() + INTERVAL '30 days'
);
```

## Troubleshooting

### "Invalid or expired clinic validation code"
- Check code spelling (case-sensitive)
- Verify code is marked as `is_active = true`
- Check if code has already been used (`used_by` is not NULL)
- Check expiration date if set

### Doctor Can't Login (Not Verified)
- Admin needs to approve doctor in Doctor Validation tab
- Doctor will receive email notification once approved

### Admin Can't Access Dashboard
- Check if admin account was created with valid clinic code
- Verify `verified` field is `true` in user_profiles

## Next Steps

1. **For Clinic Admins**: Generate clinic codes and distribute securely
2. **For Doctors**: Wait for admin approval, then login to access dashboard
3. **For Super Admins**: Use Admin Dashboard to manage all validations
