// Supabase Configuration
// Use environment variables in production, fallback to hardcoded values for development
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://zczlhrsmlecannuqknju.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjemxocnNtbGVjYW5udXFrbmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njk3MjEsImV4cCI6MjA4ODA0NTcyMX0.bymF387OBZ_5JNojgm2cbm8rAUMyUfdaSKScrjnvMfc'; 

// Initialize Supabase client
const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication functions
export const auth = {
    // Sign up new user
    async signUp(email, password, userData) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in user
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out user
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { success: true, user };
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to auth state changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Database functions
export const db = {
    // Generic CRUD operations
    async create(table, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .insert(data)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error('Create error:', error);
            return { success: false, error: error.message };
        }
    },

    async read(table, filters = {}) {
        try {
            let query = supabase.from(table).select('*');
            
            // Apply filters
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null) {
                    query = query.eq(key, filters[key]);
                }
            });
            
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Read error:', error);
            return { success: false, error: error.message };
        }
    },

    async update(table, id, data) {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error('Update error:', error);
            return { success: false, error: error.message };
        }
    },

    async delete(table, id) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message };
        }
    }
};

// User profile functions
export const userProfile = {
    // Create user profile
    async createProfile(userId, profileData) {
        return db.create('user_profiles', {
            user_id: userId,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    },

    // Get user profile
    async getProfile(userId) {
        const result = await db.read('user_profiles', { user_id: userId });
        return result.success && result.data.length > 0 
            ? { success: true, data: result.data[0] }
            : { success: false, error: 'Profile not found' };
    },

    // Update user profile
    async updateProfile(userId, profileData) {
        return db.update('user_profiles', userId, {
            ...profileData,
            updated_at: new Date().toISOString()
        });
    }
};

// Appointment functions
export const appointments = {
    // Create appointment
    async create(appointmentData) {
        return db.create('appointments', {
            ...appointmentData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    },

    // Get appointments for user
    async getUserAppointments(userId, role = 'patient') {
        const filterField = role === 'doctor' ? 'doctor_id' : 'patient_id';
        return db.read('appointments', { [filterField]: userId });
    },

    // Update appointment
    async update(id, appointmentData) {
        return db.update('appointments', id, {
            ...appointmentData,
            updated_at: new Date().toISOString()
        });
    },

    // Delete appointment
    async delete(id) {
        return db.delete('appointments', id);
    }
};

// Medical records functions
export const medicalRecords = {
    // Create medical record
    async create(recordData) {
        return db.create('medical_records', {
            ...recordData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    },

    // Get patient records
    async getPatientRecords(patientId) {
        return db.read('medical_records', { patient_id: patientId });
    },

    // Get doctor records
    async getDoctorRecords(doctorId) {
        return db.read('medical_records', { doctor_id: doctorId });
    },

    // Update record
    async update(id, recordData) {
        return db.update('medical_records', id, {
            ...recordData,
            updated_at: new Date().toISOString()
        });
    }
};

// Utility functions
export const utils = {
    // Check if user is authenticated
    isAuthenticated() {
        return supabase.auth.getSession().then(({ data: { session } }) => {
            return !!session;
        });
    },

    // Get user role
    async getUserRole(userId) {
        const profile = await userProfile.getProfile(userId);
        return profile.success ? profile.data.role : null;
    },

    // Redirect based on role
    async redirectBasedOnRole() {
        const { user } = await auth.getCurrentUser();
        if (!user) return '/login.html';
        
        const role = await this.getUserRole(user.id);
        return role === 'doctor' ? '/Doctor_Schedule/doctor_dashboard.html' : '/dashboard.html';
    },

    // Format date for database
    formatDate(date) {
        return new Date(date).toISOString();
    },

    // Handle errors
    handleError(error, message = 'An error occurred') {
        console.error(message, error);
        return { success: false, error: error.message || message };
    }
};

// Export supabase client for direct use if needed
export { supabase };
