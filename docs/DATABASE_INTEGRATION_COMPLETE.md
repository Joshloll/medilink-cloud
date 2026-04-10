# MEDILINK CLOUD - COMPLETE DATABASE INTEGRATION GUIDE
## Step-by-Step Implementation Instructions

---

## PART 1: INITIAL SETUP & VERIFICATION

### Step 1.1: Verify Your Supabase Connection
Before integrating the database, ensure Supabase is properly configured in your project.

1. Open `frontend/js/config.js` and verify:
```javascript
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
window.supabase = window.supabase || supabase.createClient(supabaseUrl, supabaseKey);
```

2. Test connection by opening browser console and running:
```javascript
const user = await window.supabase.auth.getUser();
console.log('Connected:', user);
```

### Step 1.2: Verify Database Tables
Run this in Supabase SQL Editor to confirm all tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

Expected tables:
- ✅ appointments
- ✅ doctors
- ✅ patients
- ✅ audit_log
- ✅ clinic_codes
- ✅ lab_results
- ✅ medical_records
- ✅ notifications

---

## PART 2: ADD API CLIENT TO YOUR PROJECT

### Step 2.1: Include the New API Client
Add this to every HTML file that needs database access (before other JavaScript):

**In `frontend/auth.html` (in `<head>` or before `</body>`):**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-api-complete.js"></script>
```

**In `frontend/dashboard.html`:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-api-complete.js"></script>
```

**In `frontend/Patients/BookAppointment.html`:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../js/config.js"></script>
<script src="../../js/supabase-api-complete.js"></script>
```

**And similarly for all other pages that need database access.**

### Step 2.2: Verify API Client is Loaded
In browser console, verify the API is available:
```javascript
console.log(window.API); // Should show SupabaseAPI instance
```

---

## PART 3: DOCTOR REGISTRATION FLOW

### Step 3.1: Update Doctor Registration Page

In your doctor registration HTML form, use this JavaScript:

```javascript
// Handle doctor registration form submission
document.getElementById('doctorRegistrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        // 1. Register doctor profile
        const doctorData = {
            license_number: document.getElementById('licenseNumber').value,
            specialization: document.getElementById('specialization').value,
            years_of_experience: parseInt(document.getElementById('experience').value),
            education: document.getElementById('education').value,
            hospital_affiliation: document.getElementById('hospital').value,
            consultation_fee: parseFloat(document.getElementById('consultationFee').value),
            bio: document.getElementById('bio').value,
            available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            available_time_start: '09:00:00',
            available_time_end: '17:00:00'
        };

        const result = await window.API.registerDoctor(doctorData);

        // 2. Show success message
        alert('✅ Doctor account created! Waiting for admin approval. You will receive an email notification.');

        // 3. Redirect to pending page
        window.location.href = '/doctor-pending.html';

    } catch (error) {
        console.error('Registration error:', error);
        alert('❌ Error: ' + error.message);
    }
});
```

### Step 3.2: Create Doctor Status Page
Create `frontend/Doctor_Schedule/doctor-pending.html` to show:
```html
<div class="pending-container">
    <h2>⏳ Your Account is Pending Approval</h2>
    <p>An admin will review your registration and send you an email notification once approved.</p>
    <p>You'll be able to log in and start accepting appointments once approved.</p>
    
    <button onclick="checkApprovalStatus()">Check Status</button>
</div>

<script>
async function checkApprovalStatus() {
    try {
        const user = await window.API.getCurrentUser();
        const doctor = await window.API.getDoctorByUserId(user.id);
        
        if (doctor.verified) {
            alert('✅ Your account has been approved! Redirecting to dashboard...');
            window.location.href = '/doctor-dashboard.html';
        } else {
            alert('⏳ Still pending approval. Please check back later.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
</script>
```

---

## PART 4: PATIENT REGISTRATION FLOW

### Step 4.1: Update Patient Registration

In your patient registration form:

```javascript
document.getElementById('patientRegistrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        // 1. Register patient profile
        const patientData = {
            blood_type: document.getElementById('bloodType').value,
            allergies: document.getElementById('allergies').value.split(',').map(a => a.trim())
        };

        const result = await window.API.registerPatient(patientData);

        // 2. Show success
        alert('✅ Patient account created successfully!');

        // 3. Redirect to dashboard
        window.location.href = '/patient-dashboard.html';

    } catch (error) {
        console.error('Registration error:', error);
        alert('❌ Error: ' + error.message);
    }
});
```

---

## PART 5: APPOINTMENT BOOKING FLOW

### Step 5.1: Update BookAppointment.html

**Step 1: Populate Doctor Dropdown**
```javascript
async function loadDoctors() {
    try {
        const doctors = await window.API.getVerifiedDoctors();
        
        const doctorSelect = document.getElementById('doctorSelect');
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `Dr. ${doctor.bio} - ${doctor.specialization} ($${doctor.consultation_fee})`;
            doctorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

// Call on page load
window.addEventListener('DOMContentLoaded', loadDoctors);
```

**Step 2: Check Availability**
```javascript
async function checkAvailability() {
    try {
        const doctorId = document.getElementById('doctorSelect').value;
        const appointmentDate = document.getElementById('appointmentDate').value;
        const appointmentTime = document.getElementById('appointmentTime').value;

        const available = await window.API.isTimeSlotAvailable(
            doctorId,
            appointmentDate,
            appointmentTime,
            30
        );

        if (available) {
            document.getElementById('availabilityStatus').innerHTML = '✅ Time slot is available';
            document.getElementById('bookBtn').disabled = false;
        } else {
            document.getElementById('availabilityStatus').innerHTML = '❌ Time slot is not available';
            document.getElementById('bookBtn').disabled = true;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
```

**Step 3: Book Appointment**
```javascript
async function bookAppointment() {
    try {
        const appointmentData = {
            doctor_id: document.getElementById('doctorSelect').value,
            appointment_date: document.getElementById('appointmentDate').value,
            appointment_time: document.getElementById('appointmentTime').value,
            duration: 30,
            appointment_type: 'Consultation',
            reason_for_visit: document.getElementById('reasonForVisit').value,
            notes: document.getElementById('notes').value
        };

        const result = await window.API.bookAppointment(appointmentData);

        alert('✅ Appointment booked successfully! Waiting for doctor confirmation.');
        window.location.href = './MyAppointments.html';

    } catch (error) {
        console.error('Booking error:', error);
        alert('❌ Error: ' + error.message);
    }
}
```

---

## PART 6: PATIENT DASHBOARD - MY APPOINTMENTS

### Step 6.1: Update MyAppointments.html

```javascript
async function loadMyAppointments() {
    try {
        // Get current user
        const user = await window.API.getCurrentUser();
        const patient = await window.API.getPatientByUserId(user.id);

        // Get all appointments
        const appointments = await window.API.getPatientAppointments(patient.id);

        // Display appointments
        displayAppointments(appointments);

        // Subscribe to real-time updates
        appointments.forEach(apt => {
            window.API.subscribeToAppointmentChanges(apt.id, (payload) => {
                console.log('Appointment updated:', payload);
                loadMyAppointments(); // Reload on changes
            });
        });

    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsContainer');
    container.innerHTML = '';

    // Filter by status
    const pending = appointments.filter(a => a.status === 'Pending Confirmation');
    const confirmed = appointments.filter(a => a.status === 'Confirmed');
    const completed = appointments.filter(a => a.status === 'Completed');
    const cancelled = appointments.filter(a => a.status === 'Cancelled');

    // Display Pending Confirmations
    if (pending.length > 0) {
        container.innerHTML += '<h3>⏳ Pending Confirmation</h3>';
        pending.forEach(apt => {
            container.innerHTML += `
                <div class="appointment-card pending">
                    <p><strong>Date:</strong> ${apt.appointment_date} at ${apt.appointment_time}</p>
                    <p><strong>Reason:</strong> ${apt.reason_for_visit}</p>
                    <p><strong>Status:</strong> ⏳ Waiting for doctor confirmation</p>
                </div>
            `;
        });
    }

    // Display Confirmed
    if (confirmed.length > 0) {
        container.innerHTML += '<h3>✅ Confirmed Appointments</h3>';
        confirmed.forEach(apt => {
            container.innerHTML += `
                <div class="appointment-card confirmed">
                    <p><strong>Date:</strong> ${apt.appointment_date} at ${apt.appointment_time}</p>
                    <p><strong>Reason:</strong> ${apt.reason_for_visit}</p>
                    <p><strong>Status:</strong> ✅ Confirmed</p>
                </div>
            `;
        });
    }

    // Display Completed
    if (completed.length > 0) {
        container.innerHTML += '<h3>✔️ Completed Appointments</h3>';
        completed.forEach(apt => {
            container.innerHTML += `
                <div class="appointment-card completed">
                    <p><strong>Date:</strong> ${apt.appointment_date}</p>
                    <p><strong>Diagnosis:</strong> ${apt.diagnosis || 'N/A'}</p>
                    <p><strong>Status:</strong> ✔️ Completed</p>
                </div>
            `;
        });
    }

    // Display Cancelled
    if (cancelled.length > 0) {
        container.innerHTML += '<h3>❌ Cancelled Appointments</h3>';
        cancelled.forEach(apt => {
            container.innerHTML += `
                <div class="appointment-card cancelled">
                    <p><strong>Date:</strong> ${apt.appointment_date}</p>
                    <p><strong>Status:</strong> ❌ Cancelled</p>
                </div>
            `;
        });
    }
}

// Load on page load
window.addEventListener('DOMContentLoaded', loadMyAppointments);
```

---

## PART 7: DOCTOR DASHBOARD

### Step 7.1: Update Doctor Dashboard

```javascript
async function loadDoctorDashboard() {
    try {
        const user = await window.API.getCurrentUser();
        
        // Check if doctor is verified
        const doctor = await window.API.getDoctorByUserId(user.id);
        if (!doctor || !doctor.verified) {
            alert('Your account is not approved yet.');
            window.location.href = '/doctor-pending.html';
            return;
        }

        // Load dashboard data
        const dashboardData = await window.API.getDoctorDashboard(doctor.id);

        // Display pending confirmations
        displayPendingAppointments(dashboardData.pending_appointments);

        // Display today's schedule
        displayTodaySchedule(dashboardData.today_schedule);

        // Subscribe to changes
        setInterval(() => loadDoctorDashboard(), 30000); // Refresh every 30 seconds

    } catch (error) {
        console.error('Error loading doctor dashboard:', error);
    }
}

function displayPendingAppointments(pendingAppointments) {
    const container = document.getElementById('pendingAppointmentsContainer');
    container.innerHTML = `<h3>⏳ Pending Confirmations (${pendingAppointments.length})</h3>`;

    pendingAppointments.forEach(apt => {
        container.innerHTML += `
            <div class="pending-card">
                <p><strong>Date:</strong> ${apt.appointment_date} at ${apt.appointment_time}</p>
                <p><strong>Reason:</strong> ${apt.reason_for_visit}</p>
                <button onclick="confirmAppointment('${apt.id}')">✅ Confirm</button>
                <button onclick="cancelAppointment('${apt.id}')">❌ Cancel</button>
            </div>
        `;
    });
}

function displayTodaySchedule(todaySchedule) {
    const container = document.getElementById('todayScheduleContainer');
    container.innerHTML = `<h3>📅 Today's Schedule (${todaySchedule.length} appointments)</h3>`;

    todaySchedule.forEach(apt => {
        container.innerHTML += `
            <div class="schedule-card">
                <p><strong>Time:</strong> ${apt.appointment_time}</p>
                <p><strong>Duration:</strong> ${apt.duration} minutes</p>
                <p><strong>Status:</strong> ${apt.status}</p>
                <button onclick="editAppointmentDetails('${apt.id}')">Edit Details</button>
            </div>
        `;
    });
}

async function confirmAppointment(appointmentId) {
    if (confirm('Confirm this appointment?')) {
        const result = await window.API.confirmAppointment(appointmentId);
        alert('✅ Appointment confirmed!');
        loadDoctorDashboard();
    }
}

async function cancelAppointment(appointmentId) {
    if (confirm('Cancel this appointment?')) {
        const result = await window.API.cancelAppointment(appointmentId);
        alert('❌ Appointment cancelled!');
        loadDoctorDashboard();
    }
}

// Load on page load
window.addEventListener('DOMContentLoaded', loadDoctorDashboard);
```

---

## PART 8: ADMIN DASHBOARD

### Step 8.1: Update Admin Dashboard

```javascript
async function loadAdminDashboard() {
    try {
        // Verify user is admin
        const user = await window.API.getCurrentUser();
        if (user.user_metadata?.role !== 'admin') {
            alert('Admin access required');
            window.location.href = '/';
            return;
        }

        // Load statistics
        const stats = await window.API.getDashboardStats();
        displayStatistics(stats);

        // Load pending doctors
        const pendingDoctors = await window.API.getPendingDoctors();
        displayPendingDoctors(pendingDoctors);

        // Load all appointments
        const appointments = await window.API.getAllAppointments();
        displayAllAppointments(appointments);

    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

function displayStatistics(stats) {
    const container = document.getElementById('statsContainer');
    container.innerHTML = `
        <div class="stat-card">
            <h3>Total Doctors</h3>
            <p>${stats.total_doctors}</p>
        </div>
        <div class="stat-card pending">
            <h3>Pending Doctors</h3>
            <p>${stats.pending_doctors}</p>
        </div>
        <div class="stat-card">
            <h3>Total Patients</h3>
            <p>${stats.total_patients}</p>
        </div>
        <div class="stat-card pending">
            <h3>Pending Appointments</h3>
            <p>${stats.pending_appointments}</p>
        </div>
        <div class="stat-card confirmed">
            <h3>Confirmed Appointments</h3>
            <p>${stats.confirmed_appointments}</p>
        </div>
        <div class="stat-card completed">
            <h3>Completed Appointments</h3>
            <p>${stats.completed_appointments}</p>
        </div>
    `;
}

function displayPendingDoctors(pendingDoctors) {
    const container = document.getElementById('pendingDoctorsContainer');
    container.innerHTML = `<h3>👨‍⚕️ Pending Doctor Approvals (${pendingDoctors.length})</h3>`;

    pendingDoctors.forEach(doctor => {
        container.innerHTML += `
            <div class="doctor-card">
                <p><strong>Name:</strong> ${doctor.full_name}</p>
                <p><strong>Email:</strong> ${doctor.email}</p>
                <p><strong>License:</strong> ${doctor.license_number}</p>
                <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                <p><strong>Experience:</strong> ${doctor.years_of_experience} years</p>
                <button onclick="approveDoctorById('${doctor.id}')">✅ Approve</button>
                <button onclick="rejectDoctorById('${doctor.id}')">❌ Reject</button>
            </div>
        `;
    });
}

function displayAllAppointments(appointments) {
    const container = document.getElementById('appointmentsContainer');
    container.innerHTML = '<h3>📋 All Appointments</h3>';

    // Group by status
    const byStatus = {};
    appointments.forEach(apt => {
        if (!byStatus[apt.status]) {
            byStatus[apt.status] = [];
        }
        byStatus[apt.status].push(apt);
    });

    // Display each status group
    Object.entries(byStatus).forEach(([status, apts]) => {
        container.innerHTML += `<h4>${status} (${apts.length})</h4>`;
        apts.forEach(apt => {
            container.innerHTML += `
                <div class="appointment-row">
                    <td>${apt.appointment_date}</td>
                    <td>${apt.appointment_time}</td>
                    <td>${apt.status}</td>
                    <td>$${apt.cost}</td>
                    <td>${apt.payment_status}</td>
                </div>
            `;
        });
    });
}

async function approveDoctorById(doctorId) {
    if (confirm('Approve this doctor?')) {
        const result = await window.API.approveDoctorById(doctorId);
        alert('✅ Doctor approved! They have been sent a notification.');
        loadAdminDashboard();
    }
}

async function rejectDoctorById(doctorId) {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
        const result = await window.API.rejectDoctor(doctorId, reason);
        alert('❌ Doctor rejected.');
        loadAdminDashboard();
    }
}

// Load on page load
window.addEventListener('DOMContentLoaded', loadAdminDashboard);
```

---

## PART 9: DATABASE QUERIES REFERENCE

### For Custom Queries
If you need to run custom queries directly in Supabase, use the files:
- `database/COMPLETE_QUERIES.sql` - All available queries
- Replace placeholders (like USER_ID_HERE) with actual values

### Example: Get all pending doctors as CSV
```sql
SELECT 
    d.id,
    d.license_number,
    d.specialization,
    u.email,
    u.user_metadata->>'full_name' as full_name,
    d.created_at
FROM doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE d.verified = false
ORDER BY d.created_at DESC;
```

---

## PART 10: TESTING & VERIFICATION

### Test Checklist

**Doctor Registration Flow:**
- [ ] Doctor registers with account form
- [ ] Account shows as "verified=false" in database
- [ ] Doctor appears in admin's pending list
- [ ] Admin can approve/reject
- [ ] Doctor receives notification
- [ ] Doctor can login only after approval

**Appointment Booking Flow:**
- [ ] Patient can view available doctors
- [ ] Patient can check time slot availability
- [ ] Patient books appointment
- [ ] Appointment shows as "Pending Confirmation"
- [ ] Doctor sees pending appointment in dashboard
- [ ] Doctor can confirm/reject appointment
- [ ] Patient gets notification of confirmation/rejection
- [ ] Status updates in real-time across all dashboards

**Admin Dashboard:**
- [ ] Can view all statistics
- [ ] Can see all doctors and their status
- [ ] Can see all patients
- [ ] Can see all appointments grouped by status
- [ ] Can approve/reject pending doctors
- [ ] Can view appointment details

**Real-time Sync:**
- [ ] Open 2 browser windows (doctor + patient)
- [ ] Book appointment from patient window
- [ ] Doctor window shows notification immediately
- [ ] Confirm appointment from doctor window
- [ ] Patient window updates immediately

### Run in Browser Console to Test:
```javascript
// Test 1: Get current user
const user = await window.API.getCurrentUser();
console.log('Current user:', user);

// Test 2: Get user role
const role = await window.API.getCurrentUserRole();
console.log('User role:', role);

// Test 3: Get pending doctors (admin)
const pending = await window.API.getPendingDoctors();
console.log('Pending doctors:', pending);

// Test 4: Get verified doctors
const doctors = await window.API.getVerifiedDoctors();
console.log('Verified doctors:', doctors);

// Test 5: Get appointment by patient
const patient = await window.API.getPatientByUserId(user.id);
const aptsby = await window.API.getPatientAppointments(patient.id);
console.log('Patient appointments:', apts);
```

---

## PART 11: TROUBLESHOOTING

### Issue: "Cannot read property 'client' of undefined"
**Solution:** Make sure `supabase-api-complete.js` is loaded AFTER `config.js`

### Issue: Appointments not showing in real-time
**Solution:** Check browser console for permission errors. Ensure Row-Level Security (RLS) is properly configured in Supabase.

### Issue: Doctor registration stuck at "pending"
**Solution:** 
1. Log into Supabase dashboard
2. Go to SQL Editor
3. Run: `UPDATE doctors SET verified=true WHERE id='DOCTOR_ID'`

### Issue: API functions return null
**Solution:** Verify all database tables exist using:
```sql
SELECT * FROM information_schema.tables WHERE table_schema='public';
```

---

## PART 12: IMPLEMENTATION CHECKLIST

### Phase 1: Setup
- [ ] Verify Supabase connection
- [ ] Confirm all tables exist
- [ ] Add API client to each HTML file

### Phase 2: Authentication
- [ ] Update login/registration flows
- [ ] Test user role detection
- [ ] Test redirect logic based on role

### Phase 3: Doctor Features
- [ ] Doctor registration form works
- [ ] Doctor appears in pending list
- [ ] Admin can approve/reject
- [ ] Doctor can login after approval
- [ ] Doctor dashboard shows pending appointments

### Phase 4: Patient Features
- [ ] Patient registration works
- [ ] Patient can view doctors
- [ ] Patient can check availability
- [ ] Patient can book appointment
- [ ] Appointment shows in MyAppointments

### Phase 5: Admin Features
- [ ] Admin can see all statistics
- [ ] Admin can approve doctors
- [ ] Admin can view all appointments
- [ ] Admin can filter by status

### Phase 6: Real-time
- [ ] Set up subscriptions to appointment changes
- [ ] Test real-time status updates
- [ ] Verify notifications are created

### Phase 7: Testing
- [ ] Run all console tests
- [ ] Test each user role workflow
- [ ] Verify all status transitions
- [ ] Check appointment synchronization

---

## NEXT STEPS

1. ✅ Copy `supabase-api-complete.js` to `/frontend/js/`
2. ✅ Copy `COMPLETE_QUERIES.sql` to `/database/`
3. ✅ Update each HTML file with the API client script tag
4. ✅ Implement the JavaScript code blocks in each page
5. ✅ Run the testing checklist
6. ✅ Deploy to production

**Questions? Check the troubleshooting section or review the complete SQL queries file for reference.**

---

**Last Updated:** April 10, 2026
**Version:** 1.0 - Complete Integration
