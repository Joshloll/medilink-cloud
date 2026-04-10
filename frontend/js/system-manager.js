/**
 * System Manager - Central hub for managing doctors, patients, and appointments across roles
 * Handles validation, synchronization, and state management
 */

const STORAGE_KEYS = {
    DOCTORS: 'medilinkDoctors',
    PATIENTS: 'medilinkPatients',
    APPOINTMENTS: 'medilinkAppointments',
    CURRENT_USER: 'medilinkCurrentUser'
};

const DOCTOR_STATUS = {
    PENDING_APPROVAL: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

/**
 * Doctor Management
 */
class DoctorManager {
    static getAllDoctors() {
        const stored = localStorage.getItem(STORAGE_KEYS.DOCTORS);
        return stored ? JSON.parse(stored) : [];
    }

    static getPendingDoctors() {
        return this.getAllDoctors().filter(d => d.status === DOCTOR_STATUS.PENDING_APPROVAL);
    }

    static getApprovedDoctors() {
        return this.getAllDoctors().filter(d => d.status === DOCTOR_STATUS.APPROVED);
    }

    static saveDoctors(doctors) {
        localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    }

    static registerDoctor(doctorData) {
        const doctors = this.getAllDoctors();
        const newDoctor = {
            id: Date.now(),
            ...doctorData,
            status: DOCTOR_STATUS.PENDING_APPROVAL,
            createdAt: new Date().toISOString(),
            approvedAt: null,
            approvedBy: null
        };
        doctors.push(newDoctor);
        this.saveDoctors(doctors);
        return newDoctor;
    }

    static approveDoctorById(doctorId, adminName) {
        const doctors = this.getAllDoctors();
        const doctor = doctors.find(d => d.id === doctorId);
        if (doctor) {
            doctor.status = DOCTOR_STATUS.APPROVED;
            doctor.approvedAt = new Date().toISOString();
            doctor.approvedBy = adminName;
            this.saveDoctors(doctors);
            return doctor;
        }
        return null;
    }

    static rejectDoctorById(doctorId, reason) {
        const doctors = this.getAllDoctors();
        const doctor = doctors.find(d => d.id === doctorId);
        if (doctor) {
            doctor.status = DOCTOR_STATUS.REJECTED;
            doctor.rejectionReason = reason || '';
            this.saveDoctors(doctors);
            return doctor;
        }
        return null;
    }

    static getDoctorById(doctorId) {
        return this.getAllDoctors().find(d => d.id === doctorId);
    }

    static getDoctorByName(name) {
        return this.getAllDoctors().find(d => 
            `Dr. ${d.firstName} ${d.lastName}`.toLowerCase() === name.toLowerCase() ||
            `${d.firstName} ${d.lastName}`.toLowerCase() === name.toLowerCase()
        );
    }

    static canDoctorLogin(doctorData) {
        const doctor = this.getDoctorByName(`${doctorData.firstName} ${doctorData.lastName}`);
        return doctor && doctor.status === DOCTOR_STATUS.APPROVED;
    }
}

/**
 * Patient Management
 */
class PatientManager {
    static getAllPatients() {
        const stored = localStorage.getItem(STORAGE_KEYS.PATIENTS);
        return stored ? JSON.parse(stored) : [];
    }

    static savePatients(patients) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    }

    static registerPatient(patientData) {
        const patients = this.getAllPatients();
        const newPatient = {
            id: Date.now(),
            ...patientData,
            createdAt: new Date().toISOString()
        };
        patients.push(newPatient);
        this.savePatients(patients);
        return newPatient;
    }

    static getPatientByName(name) {
        return this.getAllPatients().find(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase() === name.toLowerCase()
        );
    }

    static getPatientById(patientId) {
        return this.getAllPatients().find(p => p.id === patientId);
    }
}

/**
 * Appointment Management
 */
class AppointmentManager {
    static getAllAppointments() {
        const stored = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        return stored ? JSON.parse(stored) : [];
    }

    static getAppointmentsByPatient(patientName) {
        return this.getAllAppointments().filter(a => a.patientName === patientName);
    }

    static getAppointmentsByDoctor(doctorName) {
        return this.getAllAppointments().filter(a => a.doctor === doctorName);
    }

    static getAppointmentsByStatus(status) {
        return this.getAllAppointments().filter(a => a.status === status);
    }

    static saveAppointments(appointments) {
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    }

    static createAppointment(appointmentData) {
        const appointments = this.getAllAppointments();
        const newAppointment = {
            id: Date.now(),
            ...appointmentData,
            status: appointmentData.status || APPOINTMENT_STATUS.PENDING,
            createdAt: new Date().toISOString()
        };
        appointments.push(newAppointment);
        this.saveAppointments(appointments);
        return newAppointment;
    }

    static updateAppointmentById(appointmentId, updates) {
        const appointments = this.getAllAppointments();
        const appointment = appointments.find(a => a.id === appointmentId);
        if (appointment) {
            Object.assign(appointment, updates);
            this.saveAppointments(appointments);
            return appointment;
        }
        return null;
    }

    static confirmAppointmentById(appointmentId) {
        return this.updateAppointmentById(appointmentId, {
            status: APPOINTMENT_STATUS.CONFIRMED,
            confirmedAt: new Date().toISOString()
        });
    }

    static completeAppointmentById(appointmentId) {
        return this.updateAppointmentById(appointmentId, {
            status: APPOINTMENT_STATUS.COMPLETED,
            completedAt: new Date().toISOString()
        });
    }

    static cancelAppointmentById(appointmentId) {
        return this.updateAppointmentById(appointmentId, {
            status: APPOINTMENT_STATUS.CANCELLED,
            cancelledAt: new Date().toISOString()
        });
    }

    static getAppointmentById(appointmentId) {
        return this.getAllAppointments().find(a => a.id === appointmentId);
    }

    static getTodaysAppointments(doctorName) {
        const today = new Date().toISOString().split('T')[0];
        return this.getAppointmentsByDoctor(doctorName).filter(a => a.date === today);
    }

    static getPendingAppointments() {
        return this.getAppointmentsByStatus(APPOINTMENT_STATUS.PENDING);
    }

    static getConfirmedAppointments() {
        return this.getAppointmentsByStatus(APPOINTMENT_STATUS.CONFIRMED);
    }
}

/**
 * Current User Session
 */
class SessionManager {
    static getCurrentUser() {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return stored ? JSON.parse(stored) : null;
    }

    static setCurrentUser(userData) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
    }

    static clearCurrentUser() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    static isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    static getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    static getUserName() {
        const user = this.getCurrentUser();
        return user ? user.name : null;
    }
}

/**
 * System Synchronization & Validation
 */
class SystemValidator {
    /**
     * Verify appointment consistency across all users
     */
    static validateAppointmentSync() {
        const appointments = AppointmentManager.getAllAppointments();
        const issues = [];

        appointments.forEach(app => {
            // Verify doctor exists and is approved
            if (app.doctor) {
                const doctor = DoctorManager.getDoctorByName(app.doctor);
                if (!doctor) {
                    issues.push(`Appointment ${app.id}: Doctor "${app.doctor}" not found`);
                } else if (doctor.status !== DOCTOR_STATUS.APPROVED) {
                    issues.push(`Appointment ${app.id}: Doctor "${app.doctor}" is not approved`);
                }
            }

            // Verify patient exists
            if (app.patientName) {
                const patient = PatientManager.getPatientByName(app.patientName);
                if (!patient) {
                    issues.push(`Appointment ${app.id}: Patient "${app.patientName}" not found`);
                }
            }

            // Verify status is valid
            if (!Object.values(APPOINTMENT_STATUS).includes(app.status)) {
                issues.push(`Appointment ${app.id}: Invalid status "${app.status}"`);
            }
        });

        return { valid: issues.length === 0, issues };
    }

    /**
     * Verify doctor validation workflow
     */
    static validateDoctorApprovals() {
        const doctors = DoctorManager.getAllDoctors();
        const issues = [];

        doctors.forEach(doctor => {
            // Check for orphaned approvals
            if (doctor.status === DOCTOR_STATUS.APPROVED && !doctor.approvedAt) {
                issues.push(`Doctor ${doctor.id}: Marked approved but no approval timestamp`);
            }

            // Verify status transitions
            if (doctor.rejectionReason && doctor.status !== DOCTOR_STATUS.REJECTED) {
                issues.push(`Doctor ${doctor.id}: Has rejection reason but status is not rejected`);
            }
        });

        return { valid: issues.length === 0, issues };
    }

    /**
     * Full system health check
     */
    static performFullSystemCheck() {
        const appointmentCheck = this.validateAppointmentSync();
        const doctorCheck = this.validateDoctorApprovals();

        return {
            timestamp: new Date().toISOString(),
            appointments: appointmentCheck,
            doctors: doctorCheck,
            systemHealthy: appointmentCheck.valid && doctorCheck.valid
        };
    }
}

// Export for use in pages
window.SystemManager = {
    Doctor: DoctorManager,
    Patient: PatientManager,
    Appointment: AppointmentManager,
    Session: SessionManager,
    Validator: SystemValidator,
    Constants: {
        DOCTOR_STATUS,
        APPOINTMENT_STATUS
    }
};
