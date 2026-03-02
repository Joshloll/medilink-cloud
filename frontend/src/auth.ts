// Authentication and API Services

import { 
    API_CONFIG, 
    STORAGE_KEYS, 
    USER_ROLES,
    User, 
    UserRole,
    ApiResponse
} from './config.js';

// Authentication Service
export class AuthService {
    /**
     * Store authentication data in localStorage
     */
    static setAuth(token: string, refreshToken: string, user: User): void {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    /**
     * Get stored authentication token
     */
    static getToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }

    /**
     * Get stored user object
     */
    static getUser(): User | null {
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        return !!this.getToken();
    }

    /**
     * Check if user has a specific role
     */
    static hasRole(role: UserRole): boolean {
        const user = this.getUser();
        return user ? user.role === role : false;
    }

    /**
     * Clear all authentication data
     */
    static clearAuth(): void {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    /**
     * Logout user and redirect to login page
     */
    static logout(): void {
        this.clearAuth();
        window.location.href = 'login.html';
    }

    /**
     * Redirect to appropriate dashboard based on user role
     */
    static redirectToDashboard(): void {
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

    /**
     * Require authentication - redirect to login if not authenticated
     */
    static requireAuth(): boolean {
        if (!this.isAuthenticated()) {
            window.location.href = '../login.html';
            return false;
        }
        return true;
    }

    /**
     * Require specific role - redirect to login if not authorized
     */
    static requireRole(role: UserRole): boolean {
        if (!this.isAuthenticated() || !this.hasRole(role)) {
            window.location.href = '../login.html';
            return false;
        }
        return true;
    }
}

// API Request Options Interface
interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

// API Service
export class ApiService {
    /**
     * Make an API request
     */
    static async request<T = any>(
        endpoint: string, 
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const token = AuthService.getToken();

        const config: RequestInit = {
            ...options,
            headers: {
                ...API_CONFIG.HEADERS,
                ...options.headers,
                ...(token && { Authorization: `Bearer ${token}` })
            }
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                // Handle 401 Unauthorized - token expired
                if (response.status === 401) {
                    AuthService.clearAuth();
                    window.location.href = 'login.html';
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                throw error;
            }
            throw new Error('An unknown error occurred');
        }
    }

    /**
     * Make a GET request
     */
    static async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * Make a POST request
     */
    static async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Make a PUT request
     */
    static async put<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Make a DELETE request
     */
    static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Upload a file
     */
    static async uploadFile<T = any>(endpoint: string, file: File): Promise<ApiResponse<T>> {
        const formData = new FormData();
        formData.append('file', file);

        const token = AuthService.getToken();
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    }
}

// Utility Functions
export class Utils {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number
     */
    static isValidPhone(phone: string): boolean {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    /**
     * Format date
     */
    static formatDate(date: string | Date): string {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format time
     */
    static formatTime(time: string): string {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    /**
     * Show error message
     */
    static showError(element: HTMLElement, message: string): void {
        element.textContent = message;
        element.style.display = 'block';
    }

    /**
     * Hide error message
     */
    static hideError(element: HTMLElement): void {
        element.textContent = '';
        element.style.display = 'none';
    }

    /**
     * Show loading state on button
     */
    static showLoading(button: HTMLButtonElement, text: string = 'Loading...'): void {
        button.disabled = true;
        button.dataset.originalText = button.textContent || '';
        button.textContent = text;
    }

    /**
     * Hide loading state on button
     */
    static hideLoading(button: HTMLButtonElement): void {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }

    /**
     * Show toast notification
     */
    static showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Debounce function
     */
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: ReturnType<typeof setTimeout>;
        return function(this: any, ...args: Parameters<T>) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}
