// ===== MAIN APPLICATION MODULE (ENHANCED) =====

// Global state
const App = {
    initialized: false,
    pwaDeferredPrompt: null,
    theme: 'dark',
    currentLanguage: 'en',

    init() {
        if (this.initialized) return;
        
        // Initialize all modules
        this.initializeTheme();
        this.initializeComponents();
        this.initializeEventListeners();
        this.initializePWA();
        
        this.initialized = true;
        console.log('LifeOS initialized');
    },

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    },

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update icon
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    },

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Track theme switch for achievements
        const productivity = DataManager.get(DataManager.STORAGE_KEYS.PRODUCTIVITY, {});
        productivity.themeSwitches = (productivity.themeSwitches || 0) + 1;
        DataManager.set(DataManager.STORAGE_KEYS.PRODUCTIVITY, productivity);
        
        NotificationSystem.success(`Theme changed to ${newTheme}`);
    },

    initializeComponents() {
        // Time zones
        this.updateTimeZones();
        
        // Calendar
        if (typeof generateCalendar === 'function') {
            generateCalendar();
        }
        
        // Balance
        if (typeof updateBalance === 'function') {
            updateBalance();
        }
        
        // Productivity stats
        if (typeof updateProductivityStats === 'function') {
            updateProductivityStats();
        }
        
        // Charts
        if (typeof initializeCharts === 'function') {
            initializeCharts();
        }
        
        // Cards animation
        this.animateCards();
    },

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
            
            // Initialize navigation
            this.handleNavigation();
            
            // Listen for hash changes
            window.addEventListener('hashchange', () => this.handleNavigation());
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
            
            // Handle online/offline status
            window.addEventListener('online', () => this.handleOnlineStatus());
            window.addEventListener('offline', () => this.handleOfflineStatus());
            
            // Service worker update
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('updatefound', () => {
                    NotificationSystem.info('App update available. Refresh to update.');
                });
            }
        });

        // Listen for data changes
        window.addEventListener('dataChanged', (e) => {
            this.handleDataChange(e.detail);
        });
    },

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N for new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const taskInput = document.getElementById('taskInput');
            if (taskInput) taskInput.focus();
        }
        
        // Ctrl/Cmd + / for search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const searchInput = document.getElementById('taskSearch');
            if (searchInput) searchInput.focus();
        }
        
        // Ctrl/Cmd + D for dashboard
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.showDashboard();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            ModalManager.closeAll();
        }
    },

    handleOnlineStatus() {
        NotificationSystem.success('Back online! Changes will sync.');
    },

    handleOfflineStatus() {
        NotificationSystem.warning('You are offline. Changes saved locally.');
    },

    handleDataChange(detail) {
        console.log('Data changed:', detail.key);
        
        // Refresh relevant components
        if (detail.key === DataManager.STORAGE_KEYS.TASKS) {
            if (typeof generateCalendar === 'function') generateCalendar();
            if (typeof updateProductivityStats === 'function') updateProductivityStats();
        }
    },

    animateCards() {
        const cards = document.querySelectorAll('.dashboard-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s, transform 0.5s';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    },

    // ===== TIME ZONE MANAGEMENT =====
    updateTimeZones() {
        const updateTime = () => {
            const timezones = [
                { id: 'pkTime', zone: 'Asia/Karachi' },
                { id: 'usTime', zone: 'America/New_York' },
                { id: 'ukTime', zone: 'Europe/London' },
                { id: 'jpTime', zone: 'Asia/Tokyo' }
            ];

            timezones.forEach(tz => {
                const el = document.getElementById(tz.id);
                if (el) {
                    el.textContent = new Date().toLocaleTimeString('en-US', { 
                        timeZone: tz.zone,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    });
                }
            });
        };

        updateTime();
        setInterval(updateTime, 1000);
    },

    addTimezone() {
        const timezones = [
            { code: '🇩🇪', name: 'Germany', zone: 'Europe/Berlin' },
            { code: '🇦🇪', name: 'UAE', zone: 'Asia/Dubai' },
            { code: '🇮🇳', name: 'India', zone: 'Asia/Kolkata' },
            { code: '🇦🇺', name: 'Australia', zone: 'Australia/Sydney' },
            { code: '🇫🇷', name: 'France', zone: 'Europe/Paris' },
            { code: '🇨🇦', name: 'Canada', zone: 'America/Toronto' }
        ];

        const content = timezones.map(tz => `
            <button class="modal-btn" onclick="App.addTimezoneToDisplay('${tz.code}', '${tz.name}', '${tz.zone}')">
                ${tz.code} ${tz.name}
            </button>
        `).join('');

        ModalManager.create({
            id: 'add-timezone-modal',
            title: 'Add Timezone',
            content: `<div style="display: flex; flex-wrap: wrap; gap: 8px;">${content}</div>`,
            size: 'small',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    },

    addTimezoneToDisplay(emoji, name, zone) {
        ModalManager.close('add-timezone-modal');
        
        const grid = document.getElementById('timezoneGrid');
        if (!grid) return;

        const newTimezone = document.createElement('div');
        newTimezone.className = 'timezone-item';
        newTimezone.innerHTML = `
            <div class="timezone-country">${emoji} ${name}</div>
            <div class="timezone-time" data-zone="${zone}">--:--</div>
        `;
        grid.appendChild(newTimezone);

        // Update time for new timezone
        const updateNewTime = () => {
            const timeEl = newTimezone.querySelector('.timezone-time');
            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString('en-US', { 
                    timeZone: zone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
            }
        };
        
        updateNewTime();
        setInterval(updateNewTime, 1000);
        
        NotificationSystem.success('Timezone added!');
    },

    // ===== PWA =====
    initializePWA() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.pwaDeferredPrompt = e;
            
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.classList.remove('hidden');
            }
        });

        window.addEventListener('appinstalled', () => {
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.classList.add('hidden');
            }
            this.pwaDeferredPrompt = null;
            NotificationSystem.success('App installed successfully!');
        });

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.classList.add('hidden');
            }
        }
    },

    installPWA() {
        if (!this.pwaDeferredPrompt) {
            NotificationSystem.info('App is already installed or cannot be installed');
            return;
        }

        this.pwaDeferredPrompt.prompt();
        
        this.pwaDeferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted install');
            }
            this.pwaDeferredPrompt = null;
            
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.classList.add('hidden');
            }
        });
    },

    dismissInstall() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.classList.add('hidden');
        }
        // Remember user dismissed for a few days
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    },

    // ===== NAVIGATION =====
    handleNavigation() {
        // Get current hash (default to dashboard)
        let hash = window.location.hash.slice(1) || 'dashboard';
        
        // Validate hash against allowed pages
        const allowedPages = ['dashboard', 'tasks', 'analytics', 'calendar', 'expenses'];
        if (!allowedPages.includes(hash)) {
            hash = 'dashboard';
            window.location.hash = 'dashboard';
        }
        
        // Update nav links active state
        document.querySelectorAll('.nav-links a').forEach(link => {
            const linkHash = link.getAttribute('href').slice(1);
            if (linkHash === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Show/hide cards based on page
        this.showPage(hash);
    },
    
    showPage(page) {
        const cards = document.querySelectorAll('.dashboard-card');
        
        cards.forEach(card => {
            const cardPage = card.getAttribute('data-page');
            
            if (cardPage === page) {
                card.style.display = '';
                card.classList.remove('hidden');
            } else {
                card.style.display = 'none';
                card.classList.add('hidden');
            }
        });
        
        // Update page title
        const pageTitles = {
            'dashboard': 'Dashboard',
            'tasks': 'Tasks',
            'analytics': 'Analytics',
            'calendar': 'Calendar',
            'expenses': 'Expenses'
        };
        
        // Update welcome message based on page
        const welcomeSection = document.querySelector('.welcome-section h1');
        if (welcomeSection) {
            const pageKey = page + 'Title';
            const translations = {
                'dashboard': 'welcomeMessage',
                'tasks': 'tasks',
                'analytics': 'analytics',
                'calendar': 'calendar',
                'expenses': 'expenses'
            };
            welcomeSection.setAttribute('data-i18n', translations[page] || 'welcomeMessage');
            if (typeof I18n !== 'undefined' && I18n.t) {
                welcomeSection.textContent = I18n.t(translations[page] || 'welcomeMessage');
            }
        }
    },
    
    showDashboard() {
        window.location.hash = 'dashboard';
    },
    
    showTasks() {
        window.location.hash = 'tasks';
    },
    
    showAnalytics() {
        window.location.hash = 'analytics';
    },
    
    showCalendar() {
        window.location.hash = 'calendar';
    },
    
    showExpenses() {
        window.location.hash = 'expenses';
    },

    // ===== DATA EXPORT/IMPORT =====
    exportData() {
        try {
            const data = DataManager.exportAll();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            NotificationSystem.success('Data exported successfully!');
        } catch (error) {
            NotificationSystem.error('Failed to export data');
            console.error('Export error:', error);
        }
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const results = DataManager.importData(data, { merge: false });
                    
                    if (results.failed.length === 0) {
                        NotificationSystem.success('Data imported successfully!');
                        
                        // Refresh UI
                        if (typeof renderTasks === 'function') renderTasks();
                        if (typeof updateBalance === 'function') updateBalance();
                        if (typeof updateProductivityStats === 'function') updateProductivityStats();
                    } else {
                        NotificationSystem.warning(`Some data failed to import: ${results.failed.join(', ')}`);
                    }
                } catch (error) {
                    NotificationSystem.error('Invalid file format');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    },

    // ===== SERVICE WORKER =====
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration.scope);
                    
                    // Check for updates
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000); // Every hour
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed:', error);
                });
        }
    }
};

// Global assignments
window.App = App;
window.toggleTheme = () => App.toggleTheme();
window.addTimezone = () => App.addTimezone();
window.installPWA = () => App.installPWA();
window.dismissInstall = () => App.dismissInstall();
window.exportData = () => App.exportData();
window.importData = () => App.importData();

// Navigation functions
window.navigateTo = (page) => {
    window.location.hash = page;
};
window.showDashboard = () => App.showDashboard();
window.showTasks = () => App.showTasks();
window.showAnalytics = () => App.showAnalytics();
window.showCalendar = () => App.showCalendar();
window.showExpenses = () => App.showExpenses();

// Import data from file handler
window.importDataFromFile = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const results = DataManager.importData(data);
            
            if (results.failed.length === 0) {
                NotificationSystem.success('Data imported successfully!');
                
                // Refresh
                if (typeof TaskManager !== 'undefined') TaskManager.render();
                if (typeof updateBalance === 'function') updateBalance();
            } else {
                NotificationSystem.warning('Some data could not be imported');
            }
            
            // Close modal
            ModalManager.close('settings-modal');
        } catch (error) {
            NotificationSystem.error('Invalid file format');
        }
    };
    reader.readAsText(file);
};

// Initialize service worker
document.addEventListener('DOMContentLoaded', () => App.registerServiceWorker());
