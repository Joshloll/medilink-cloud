// Login Page Script

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (AuthService.isAuthenticated()) {
        AuthService.redirectToDashboard();
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.hideError(loginError);

        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Basic validation
        if (!email || !password) {
            Utils.showError(loginError, 'Please fill in all fields');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showError(loginError, 'Please enter a valid email address');
            return;
        }

        // Show loading state
        Utils.showLoading(loginBtn);

        try {
            // Make login request
            const response = await ApiService.post(API_ENDPOINTS.LOGIN, {
                email,
                password
            });

            if (response.status === 'success') {
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
            }
        } catch (error) {
            Utils.showError(loginError, error.message || 'Login failed. Please try again.');
            Utils.hideLoading(loginBtn);
        }
    });
});
