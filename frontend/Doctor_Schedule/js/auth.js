// Authentication Helper Functions

class AuthService {
    // Store auth data
    static setAuth(token, refreshToken, user) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    // Get stored token
    static getToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }

    // Get stored user
    static getUser() {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Check if user is authenticated
    static isAuthenticated() {
        return !!this.getToken();
    }

    // Check user role
    static hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    }

    // Clear auth data (logout)
    static clearAuth() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    // Logout
    static logout() {
        this.clearAuth();
        window.location.href = 'login.html';
    }

    // Redirect to dashboard based on role
    static redirectToDashboard() {
        const user = this.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        switch (user.role) {
            case USER_ROLES.PATIENT:
                window.location.href = 'dashboard/patient.html';
                break;
            case USER_ROLES.DOCTOR:
                window.location.href = 'dashboard/doctor.html';
                break;
            case USER_ROLES.ADMIN:
                window.location.href = 'dashboard/admin.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    // Protect pages (require authentication)
    static requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '../login.html';
            return false;
        }
        return true;
    }

    // Protect pages (require specific role)
    static requireRole(role) {
        if (!this.isAuthenticated() || !this.hasRole(role)) {
            window.location.href = '../login.html';
            return false;
        }
        return true;
    }
}

// API Helper Functions
class ApiService {
    // Make API request
    static async request(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const token = AuthService.getToken();

        const config = {
            ...options,
            headers: {
                ...API_CONFIG.HEADERS,
                ...options.headers,
                ...(token && { Authorization: `Bearer ${token}` })
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Handle unauthorized errors
            if (error.message.includes('token') || error.message.includes('auth')) {
                AuthService.logout();
            }
            
            throw error;
        }
    }

    // GET request
    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PATCH request
    static async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Utility Functions
class Utils {
    // Format date
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format time
    static formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    // Format datetime
    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Show loading state
    static showLoading(button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner"></span> Loading...';
    }

    // Hide loading state
    static hideLoading(button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }

    // Show error message
    static showError(element, message) {
        element.style.display = 'block';
        element.textContent = message;
    }

    // Hide error message
    static hideError(element) {
        element.style.display = 'none';
        element.textContent = '';
    }

    // Get status badge HTML
    static getStatusBadge(status) {
        const config = STATUS_CONFIG[status] || { label: status, class: 'badge-primary' };
        return `<span class="badge ${config.class}">${config.label}</span>`;
    }

    // Validate email
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate password
    static isValidPassword(password) {
        // Min 8 chars, uppercase, lowercase, number, special char
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return re.test(password);
    }

    // Show success toast (simple implementation)
    static showToast(message, type = 'success') {
        alert(message); // Replace with a proper toast library if needed
    }
}
