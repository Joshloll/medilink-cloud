// Login Page TypeScript

import { AuthService, ApiService, Utils } from './auth.js';
import { API_ENDPOINTS, LoginCredentials, AuthResponse } from './config.js';

// Login Form Handler
class LoginPage {
    private form: HTMLFormElement;
    private errorElement: HTMLElement;
    private submitButton: HTMLButtonElement;
    private emailInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;

    constructor() {
        this.form = document.getElementById('loginForm') as HTMLFormElement;
        this.errorElement = document.getElementById('loginError') as HTMLElement;
        this.submitButton = document.getElementById('loginBtn') as HTMLButtonElement;
        this.emailInput = document.getElementById('email') as HTMLInputElement;
        this.passwordInput = document.getElementById('password') as HTMLInputElement;

        this.init();
    }

    /**
     * Initialize the login page
     */
    private init(): void {
        // Redirect if already logged in
        if (AuthService.isAuthenticated()) {
            AuthService.redirectToDashboard();
            return;
        }

        // Setup form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Setup password toggle
        this.setupPasswordToggle();

        // Setup role selector
        this.setupRoleSelector();
    }

    /**
     * Setup password visibility toggle
     */
    private setupPasswordToggle(): void {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = this.passwordInput;
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
    }

    /**
     * Setup role selector buttons
     */
    private setupRoleSelector(): void {
        const roleButtons = document.querySelectorAll('.role-btn');
        roleButtons.forEach(button => {
            button.addEventListener('click', () => {
                roleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    /**
     * Validate login form
     */
    private validateForm(email: string, password: string): string | null {
        if (!email || !password) {
            return 'Please fill in all fields';
        }

        if (!Utils.isValidEmail(email)) {
            return 'Please enter a valid email address';
        }

        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }

        return null;
    }

    /**
     * Handle form submission
     */
    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();
        Utils.hideError(this.errorElement);

        // Get form data
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        // Validate form
        const validationError = this.validateForm(email, password);
        if (validationError) {
            Utils.showError(this.errorElement, validationError);
            return;
        }

        // Show loading state
        Utils.showLoading(this.submitButton, 'Signing in...');

        try {
            // Make login request
            const credentials: LoginCredentials = { email, password };
            const response = await ApiService.post<AuthResponse['data']>(
                API_ENDPOINTS.LOGIN,
                credentials
            );

            if (response.status === 'success' && response.data) {
                // Store auth data
                AuthService.setAuth(
                    response.data.token,
                    response.data.refreshToken,
                    response.data.user
                );

                // Show success message
                Utils.showToast('Login successful! Redirecting...', 'success');

                // Redirect to appropriate dashboard
                setTimeout(() => {
                    AuthService.redirectToDashboard();
                }, 1000);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Login failed. Please try again.';
            
            Utils.showError(this.errorElement, errorMessage);
            Utils.hideLoading(this.submitButton);
        }
    }
}

// Initialize the login page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
