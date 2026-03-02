// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// API Endpoints
const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    
    // Patients
    PATIENTS: '/patients',
    PATIENT_BY_ID: (id) => `/patients/${id}`,
    PATIENT_APPOINTMENTS: (id) => `/patients/${id}/appointments`,
    PATIENT_HEALTH_RECORDS: (id) => `/patients/${id}/health-records`,
    
    // Doctors
    DOCTORS: '/doctors',
    DOCTOR_BY_ID: (id) => `/doctors/${id}`,
    DOCTOR_SCHEDULE: (id) => `/doctors/${id}/schedule`,
    DOCTOR_AVAILABILITY: (id) => `/doctors/${id}/availability`,
    DOCTOR_STATISTICS: (id) => `/doctors/${id}/statistics`,
    
    // Appointments
    APPOINTMENTS: '/appointments',
    APPOINTMENT_BY_ID: (id) => `/appointments/${id}`,
    AVAILABLE_SLOTS: (doctorId) => `/appointments/available-slots/${doctorId}`,
    
    // Health Records
    HEALTH_RECORDS: '/health-records',
    HEALTH_RECORD_BY_ID: (id) => `/health-records/${id}`,
    
    // Admin
    ADMIN_STATISTICS: '/admin/statistics',
    ADMIN_USERS: '/admin/users',
    ADMIN_APPOINTMENTS: '/admin/appointments',
    ADMIN_ACTIVITY: '/admin/activity'
};

// Storage Keys
const STORAGE_KEYS = {
    TOKEN: 'medilink_token',
    REFRESH_TOKEN: 'medilink_refresh_token',
    USER: 'medilink_user'
};

// User Roles
const USER_ROLES = {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    ADMIN: 'admin'
};

// Appointment Status
const APPOINTMENT_STATUS = {
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no-show'
};

// Status Display Names and Badges
const STATUS_CONFIG = {
    scheduled: { label: 'Scheduled', class: 'badge-primary' },
    confirmed: { label: 'Confirmed', class: 'badge-success' },
    completed: { label: 'Completed', class: 'badge-success' },
    cancelled: { label: 'Cancelled', class: 'badge-danger' },
    'no-show': { label: 'No Show', class: 'badge-warning' }
};
