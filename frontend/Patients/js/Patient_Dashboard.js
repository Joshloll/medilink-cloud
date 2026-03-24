// Patient Dashboard JavaScript Module
// This module contains all the OOP classes for the patient dashboard functionality

// Notification System Class
class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.body;
    }

    show(message, type = 'info') {
        const notification = this.createNotificationElement(message, type);
        this.container.appendChild(notification);
        this.animateIn(notification);
        this.scheduleRemoval(notification);
    }

    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            'success': 'bg-emerald-500 text-white',
            'error': 'bg-red-500 text-white',
            'info': 'bg-primary text-white',
            'warning': 'bg-amber-500 text-white'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined">${this.getIcon(type)}</span>
                <span class="font-medium">${message}</span>
            </div>
        `;
        
        return notification;
    }

    getIcon(type) {
        const icons = {
            'success': 'check_circle',
            'error': 'error',
            'info': 'info',
            'warning': 'warning'
        };
        return icons[type] || icons.info;
    }

    animateIn(notification) {
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        }, 100);
    }

    scheduleRemoval(notification) {
        setTimeout(() => {
            this.animateOut(notification);
        }, 3000);
    }

    animateOut(notification) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Theme Manager Class
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        document.documentElement.classList.add(this.currentTheme);
    }

    toggle() {
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        html.classList.add(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
            this.currentTheme = theme;
            localStorage.setItem('theme', theme);
        }
    }
}

// Navigation Manager Class
class NavigationManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.navLinks = [];
        this.init();
    }

    init() {
        this.navLinks = document.querySelectorAll('nav a');
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e, link));
        });
    }

    handleNavClick(e, link) {
        e.preventDefault();
        this.updateActiveState(link);
        const pageName = link.querySelector('span:last-child').textContent;
        this.notificationManager.show(`Navigating to ${pageName}`, 'info');
    }

    updateActiveState(activeLink) {
        this.navLinks.forEach(link => {
            link.classList.remove('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
            link.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        
        activeLink.classList.remove('text-slate-600', 'dark:text-slate-400');
        activeLink.classList.add('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
    }
}

// Search Manager Class
class SearchManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.searchInput = null;
        this.init();
    }

    init() {
        this.searchInput = document.querySelector('input[placeholder="Search records, doctors..."]');
        this.attachEventListeners();
    }

    attachEventListeners() {
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => this.handleSearch(e));
        }
    }

    handleSearch(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.searchInput.value.trim();
            if (searchTerm) {
                this.performSearch(searchTerm);
            }
        }
    }

    performSearch(searchTerm) {
        this.notificationManager.show(`Searching for: ${searchTerm}`, 'info');
        // Here you would typically make an API call
        console.log('Searching for:', searchTerm);
    }
}

// User Interface Manager Class
class UIManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.elements = {};
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
    }

    cacheElements() {
        this.elements = {
            notificationBtn: this.findButtonByContent('notifications'),
            profilePic: document.querySelector('[data-alt*="Profile picture"]'),
            mobileMenuBtn: this.findButtonByContent('menu'),
            chatBtn: this.findButtonByContent('chat_bubble')
        };
    }

    findButtonByContent(content) {
        return Array.from(document.querySelectorAll('button')).find(btn => 
            btn.innerHTML.includes(content)
        );
    }

    attachEventListeners() {
        if (this.elements.notificationBtn) {
            this.elements.notificationBtn.addEventListener('click', () => {
                this.notificationManager.show('You have 3 new notifications', 'info');
            });
        }

        if (this.elements.profilePic) {
            this.elements.profilePic.addEventListener('click', () => {
                this.notificationManager.show('Opening user profile menu', 'info');
            });
        }

        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', () => {
                this.notificationManager.show('Toggling mobile menu', 'info');
            });
        }

        if (this.elements.chatBtn) {
            this.elements.chatBtn.addEventListener('click', () => {
                this.notificationManager.show('Opening messaging', 'info');
            });
        }
    }
}

// Quick Actions Manager Class
class QuickActionsManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.elements = {};
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
    }

    cacheElements() {
        this.elements = {
            findSpecialist: this.findCardByTitle('Find a Specialist'),
            requestRefill: this.findCardByTitle('Request Refill'),
            bookAppointment: this.findButtonByText('Book Appointment'),
            getHelp: this.findButtonByText('Get Help')
        };
    }

    findCardByTitle(title) {
        return Array.from(document.querySelectorAll('h4')).find(h4 => 
            h4.textContent.includes(title)
        )?.parentElement;
    }

    findButtonByText(text) {
        return Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes(text)
        );
    }

    attachEventListeners() {
        if (this.elements.findSpecialist) {
            this.elements.findSpecialist.addEventListener('click', () => {
                this.notificationManager.show('Opening specialist search', 'info');
            });
        }

        if (this.elements.requestRefill) {
            this.elements.requestRefill.addEventListener('click', () => {
                this.notificationManager.show('Opening prescription refill request', 'info');
            });
        }

        if (this.elements.bookAppointment) {
            this.elements.bookAppointment.addEventListener('click', () => {
                this.notificationManager.show('Opening appointment booking form', 'success');
            });
        }

        if (this.elements.getHelp) {
            this.elements.getHelp.addEventListener('click', () => {
                this.notificationManager.show('Opening help center', 'info');
            });
        }
    }
}

// Appointment Manager Class
class AppointmentManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.elements = {};
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
    }

    cacheElements() {
        this.elements = {
            joinCall: this.findButtonByText('Join Call'),
            details: this.findButtonByText('Details')
        };
    }

    findButtonByText(text) {
        return Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes(text)
        );
    }

    attachEventListeners() {
        if (this.elements.joinCall) {
            this.elements.joinCall.addEventListener('click', () => {
                this.notificationManager.show('Starting video call with Dr. Emily Chen', 'success');
                this.initiateVideoCall();
            });
        }

        if (this.elements.details) {
            this.elements.details.addEventListener('click', () => {
                this.notificationManager.show('Opening appointment details', 'info');
                this.showAppointmentDetails();
            });
        }
    }

    initiateVideoCall() {
        console.log('Initiating video call...');
        // Here you would typically integrate with a video calling service
    }

    showAppointmentDetails() {
        console.log('Showing appointment details...');
        // Here you would typically show a modal or navigate to details page
    }
}

// Activity Manager Class
class ActivityManager {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.elements = {};
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
    }

    cacheElements() {
        this.elements = {
            downloadBtns: this.findButtonsByContent('download'),
            viewBtn: this.findButtonByContent('visibility'),
            viewAllHistory: this.findLinkByText('View All History')
        };
    }

    findButtonsByContent(content) {
        return Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.innerHTML.includes(content)
        );
    }

    findButtonByContent(content) {
        return Array.from(document.querySelectorAll('button')).find(btn => 
            btn.innerHTML.includes(content)
        );
    }

    findLinkByText(text) {
        return Array.from(document.querySelectorAll('a')).find(link => 
            link.textContent.includes(text)
        );
    }

    attachEventListeners() {
        this.elements.downloadBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleDownload(btn));
        });

        if (this.elements.viewBtn) {
            this.elements.viewBtn.addEventListener('click', () => {
                this.notificationManager.show('Opening blood test results', 'info');
            });
        }

        if (this.elements.viewAllHistory) {
            this.elements.viewAllHistory.addEventListener('click', (e) => {
                e.preventDefault();
                this.notificationManager.show('Loading complete medical history', 'info');
            });
        }
    }

    handleDownload(btn) {
        const row = btn.closest('tr');
        const doctorName = row.querySelector('p.font-bold').textContent;
        this.notificationManager.show(`Downloading records for ${doctorName}`, 'success');
        this.downloadRecords(doctorName);
    }

    downloadRecords(doctorName) {
        console.log(`Downloading records for ${doctorName}...`);
        // Here you would typically initiate a file download
    }
}

// Main Patient Dashboard Controller Class
class PatientDashboardController {
    constructor() {
        this.notificationManager = new NotificationManager();
        this.themeManager = new ThemeManager();
        this.managers = {};
        this.init();
    }

    init() {
        this.initializeManagers();
        this.setupGlobalEventListeners();
    }

    initializeManagers() {
        this.managers = {
            navigation: new NavigationManager(this.notificationManager),
            search: new SearchManager(this.notificationManager),
            ui: new UIManager(this.notificationManager),
            quickActions: new QuickActionsManager(this.notificationManager),
            appointments: new AppointmentManager(this.notificationManager),
            activities: new ActivityManager(this.notificationManager)
        };
    }

    setupGlobalEventListeners() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.managers.search.searchInput?.focus();
            }
            
            // Ctrl/Cmd + D for dark mode toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.themeManager.toggle();
            }
        });

        // Add global error handling
        window.addEventListener('error', (e) => {
            this.notificationManager.show('An unexpected error occurred', 'error');
            console.error('Patient Dashboard error:', e.error);
        });
    }

    // Public API methods
    showNotification(message, type = 'info') {
        this.notificationManager.show(message, type);
    }

    toggleTheme() {
        this.themeManager.toggle();
    }

    setTheme(theme) {
        this.themeManager.setTheme(theme);
    }
}

// Initialize Patient Dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.patientDashboard = new PatientDashboardController();
    
    // Expose dashboard controller globally for debugging
    console.log('Patient Dashboard initialized successfully');
});

// Export for module usage
export { PatientDashboardController, NotificationManager, ThemeManager };
