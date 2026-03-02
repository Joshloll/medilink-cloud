// Register Page Script

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (AuthService.isAuthenticated()) {
        AuthService.redirectToDashboard();
        return;
    }

    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');
    const registerBtn = document.getElementById('registerBtn');
    const roleSelect = document.getElementById('role');
    const doctorFields = document.getElementById('doctorFields');
    const patientFields = document.getElementById('patientFields');

    // Show/hide role-specific fields
    roleSelect.addEventListener('change', () => {
        const role = roleSelect.value;

        if (role === 'doctor') {
            doctorFields.style.display = 'block';
            patientFields.style.display = 'none';
            // Make doctor fields required
            document.getElementById('specialization').required = true;
            document.getElementById('licenseNumber').required = true;
        } else if (role === 'patient') {
            doctorFields.style.display = 'none';
            patientFields.style.display = 'block';
            // Remove required from doctor fields
            document.getElementById('specialization').required = false;
            document.getElementById('licenseNumber').required = false;
        } else {
            doctorFields.style.display = 'none';
            patientFields.style.display = 'none';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.hideError(registerError);

        // Get form data
        const formData = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            role: document.getElementById('role').value
        };

        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.role) {
            Utils.showError(registerError, 'Please fill in all required fields');
            return;
        }

        if (!Utils.isValidEmail(formData.email)) {
            Utils.showError(registerError, 'Please enter a valid email address');
            return;
        }

        if (!Utils.isValidPassword(formData.password)) {
            Utils.showError(registerError, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            return;
        }

        if (formData.password !== confirmPassword) {
            Utils.showError(registerError, 'Passwords do not match');
            return;
        }

        // Add role-specific fields
        if (formData.role === 'doctor') {
            formData.specialization = document.getElementById('specialization').value.trim();
            formData.licenseNumber = document.getElementById('licenseNumber').value.trim();
            formData.department = document.getElementById('department').value.trim();

            if (!formData.specialization || !formData.licenseNumber) {
                Utils.showError(registerError, 'Please fill in all required doctor fields');
                return;
            }
        } else if (formData.role === 'patient') {
            formData.dateOfBirth = document.getElementById('dateOfBirth').value;
            formData.gender = document.getElementById('gender').value;
        }

        // Check terms acceptance
        if (!document.getElementById('termsAccepted').checked) {
            Utils.showError(registerError, 'Please accept the terms and conditions');
            return;
        }

        // Show loading state
        Utils.showLoading(registerBtn);

        try {
            // Make registration request
            const response = await ApiService.post(API_ENDPOINTS.REGISTER, formData);

            if (response.status === 'success') {
                // Store auth data
                AuthService.setAuth(
                    response.data.token,
                    response.data.refreshToken,
                    response.data.user
                );

                // Show success message
                Utils.showToast('Registration successful! Redirecting...', 'success');

                // Redirect to appropriate dashboard
                setTimeout(() => {
                    AuthService.redirectToDashboard();
                }, 1000);
            }
        } catch (error) {
            Utils.showError(registerError, error.message || 'Registration failed. Please try again.');
            Utils.hideLoading(registerBtn);
        }
    });
});
