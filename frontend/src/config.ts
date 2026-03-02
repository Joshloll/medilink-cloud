// Type Definitions

export interface ApiConfig {
    BASE_URL: string;
    TIMEOUT: number;
    HEADERS: Record<string, string>;
}

export interface ApiEndpoints {
    LOGIN: string;
    REGISTER: string;
    ME: string;
    PATIENTS: string;
    PATIENT_BY_ID: (id: string | number) => string;
    PATIENT_APPOINTMENTS: (id: string | number) => string;
    PATIENT_HEALTH_RECORDS: (id: string | number) => string;
    DOCTORS: string;
    DOCTOR_BY_ID: (id: string | number) => string;
    DOCTOR_SCHEDULE: (id: string | number) => string;
    DOCTOR_AVAILABILITY: (id: string | number) => string;
    DOCTOR_STATISTICS: (id: string | number) => string;
    APPOINTMENTS: string;
    APPOINTMENT_BY_ID: (id: string | number) => string;
    AVAILABLE_SLOTS: (doctorId: string | number) => string;
    HEALTH_RECORDS: string;
    HEALTH_RECORD_BY_ID: (id: string | number) => string;
    ADMIN_STATISTICS: string;
    ADMIN_USERS: string;
    ADMIN_APPOINTMENTS: string;
    ADMIN_ACTIVITY: string;
}

export interface StorageKeys {
    TOKEN: string;
    REFRESH_TOKEN: string;
    USER: string;
}

export enum UserRole {
    PATIENT = 'patient',
    DOCTOR = 'doctor',
    ADMIN = 'admin'
}

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    specialization?: string;
    license_number?: string;
}

export interface AuthResponse {
    status: string;
    data: {
        token: string;
        refreshToken: string;
        user: User;
    };
}

export interface ApiResponse<T = any> {
    status: string;
    data: T;
    message?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    specialization?: string;
    license_number?: string;
}

// API Configuration
export const API_CONFIG: ApiConfig = {
    BASE_URL: 'http://localhost:5000/api',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// API Endpoints
export const API_ENDPOINTS: ApiEndpoints = {
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
export const STORAGE_KEYS: StorageKeys = {
    TOKEN: 'medilink_token',
    REFRESH_TOKEN: 'medilink_refresh_token',
    USER: 'medilink_user'
};

// User Roles
export const USER_ROLES = {
    PATIENT: UserRole.PATIENT,
    DOCTOR: UserRole.DOCTOR,
    ADMIN: UserRole.ADMIN
};

// Status Constants
export const STATUS = {
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Appointment Status
export enum AppointmentStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show'
}
