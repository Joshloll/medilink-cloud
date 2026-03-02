// Main JavaScript File

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Mobile menu toggle (if needed)
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        // Add mobile menu functionality here if needed
    }

    // Check if user is logged in and update navigation
    if (AuthService && AuthService.isAuthenticated()) {
        updateNavForLoggedInUser();
    }
});

// Update navigation for logged in users
function updateNavForLoggedInUser() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        const user = AuthService.getUser();
        navMenu.innerHTML = `
            <a href="dashboard/${user.role}.html">Dashboard</a>
            <a href="#" onclick="AuthService.logout()" class="btn-nav btn-primary">Logout</a>
        `;
    }
}

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards and role cards
document.querySelectorAll('.feature-card, .role-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});
