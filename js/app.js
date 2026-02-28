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
        
        // Dashboard shows all cards
        if (page === 'dashboard' || page === '') {
            cards.forEach(card => {
                card.style.display = '';
                card.classList.remove('hidden');
            });
            return;
        }
        
        // For other pages, show only matching cards
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
        // Ensure dashboard is shown
        const mainDashboard = document.getElementById('mainDashboard');
        if (mainDashboard) {
            mainDashboard.classList.remove('hidden');
        }
        // Show all cards on dashboard
        const cards = document.querySelectorAll('.dashboard-card');
        cards.forEach(card => {
            card.style.display = '';
            card.classList.remove('hidden');
        });
    },
    
    showTasks() {
        window.location.hash = 'tasks';
        const mainDashboard = document.getElementById('mainDashboard');
        if (mainDashboard) {
            mainDashboard.classList.remove('hidden');
        }
        this.showPage('tasks');
    },
    
    showAnalytics() {
        window.location.hash = 'analytics';
        const mainDashboard = document.getElementById('mainDashboard');
        if (mainDashboard) {
            mainDashboard.classList.remove('hidden');
        }
        this.showPage('analytics');
    },
    
    showCalendar() {
        window.location.hash = 'calendar';
        const mainDashboard = document.getElementById('mainDashboard');
        if (mainDashboard) {
            mainDashboard.classList.remove('hidden');
        }
        this.showPage('calendar');
    },
    
    showExpenses() {
        window.location.hash = 'expenses';
        const mainDashboard = document.getElementById('mainDashboard');
        if (mainDashboard) {
            mainDashboard.classList.remove('hidden');
        }
        this.showPage('expenses');
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
window.showDashboard = function() {
    window.location.hash = 'dashboard';
    // Ensure dashboard container is shown
    const authContainer = document.getElementById('authContainer');
    const mainDashboard = document.getElementById('mainDashboard');
    if (authContainer) authContainer.classList.add('hidden');
    if (mainDashboard) {
        mainDashboard.classList.remove('hidden');
    }
    // Show all cards
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.style.display = '';
        card.classList.remove('hidden');
    });
    // Update active nav
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#dashboard') {
            link.classList.add('active');
        }
    });
};
window.showTasks = function() {
    window.location.hash = 'tasks';
    const authContainer = document.getElementById('authContainer');
    const mainDashboard = document.getElementById('mainDashboard');
    if (authContainer) authContainer.classList.add('hidden');
    if (mainDashboard) mainDashboard.classList.remove('hidden');
    if (App) App.showPage('tasks');
    // Update active nav
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#tasks') link.classList.add('active');
    });
};
window.showAnalytics = function() {
    window.location.hash = 'analytics';
    const authContainer = document.getElementById('authContainer');
    const mainDashboard = document.getElementById('mainDashboard');
    if (authContainer) authContainer.classList.add('hidden');
    if (mainDashboard) mainDashboard.classList.remove('hidden');
    if (App) App.showPage('analytics');
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#analytics') link.classList.add('active');
    });
};
window.showCalendar = function() {
    window.location.hash = 'calendar';
    const authContainer = document.getElementById('authContainer');
    const mainDashboard = document.getElementById('mainDashboard');
    if (authContainer) authContainer.classList.add('hidden');
    if (mainDashboard) mainDashboard.classList.remove('hidden');
    if (App) App.showPage('calendar');
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#calendar') link.classList.add('active');
    });
};
window.showExpenses = function() {
    window.location.hash = 'expenses';
    const authContainer = document.getElementById('authContainer');
    const mainDashboard = document.getElementById('mainDashboard');
    if (authContainer) authContainer.classList.add('hidden');
    if (mainDashboard) mainDashboard.classList.remove('hidden');
    if (App) App.showPage('expenses');
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#expenses') link.classList.add('active');
    });
};

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

// ===== CALENDAR FUNCTIONS =====
let currentCalendarDate = new Date();

function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthDisplay = document.getElementById('currentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get tasks for this month
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const tasksByDate = {};
    tasks.forEach(task => {
        if (task.deadline) {
            tasksByDate[task.deadline] = (tasksByDate[task.deadline] || 0) + 1;
        }
    });
    
    // Build calendar HTML
    let html = '<div class="calendar-day-header">Sun</div>';
    html += '<div class="calendar-day-header">Mon</div>';
    html += '<div class="calendar-day-header">Tue</div>';
    html += '<div class="calendar-day-header">Wed</div>';
    html += '<div class="calendar-day-header">Thu</div>';
    html += '<div class="calendar-day-header">Fri</div>';
    html += '<div class="calendar-day-header">Sat</div>';
    
    // Empty cells for days before first
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Days of month
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today;
        const taskCount = tasksByDate[dateStr] || 0;
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="showTasksForDate('${dateStr}')">
            <span class="day-number">${day}</span>
            ${taskCount > 0 ? `<span class="task-indicator">${taskCount}</span>` : ''}
        </div>`;
    }
    
    calendarGrid.innerHTML = html;
    
    // Update upcoming tasks
    updateUpcomingTasks();
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateCalendar();
}

function showTasksForDate(date) {
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const tasksForDate = tasks.filter(t => t.deadline === date);
    
    if (tasksForDate.length === 0) {
        NotificationSystem.info('No tasks for this date');
        return;
    }
    
    const content = tasksForDate.map(task => `
        <div style="padding: 12px; margin-bottom: 8px; background: var(--bg-primary); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 500;">${SecurityUtils.escapeHtml(task.title)}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${task.category} • ${task.priority}</div>
            </div>
            <div style="font-size: 1.5rem;">${task.completed ? '✅' : '⬜'}</div>
        </div>
    `).join('');
    
    ModalManager.create({
        id: 'tasks-for-date-modal',
        title: 'Tasks for ' + new Date(date).toLocaleDateString(),
        content,
        size: 'medium',
        buttons: [{ id: 'close', text: 'Close', primary: true }]
    });
}

function updateUpcomingTasks() {
    const upcomingContainer = document.getElementById('upcomingTasks');
    if (!upcomingContainer) return;
    
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const today = new Date().toISOString().split('T')[0];
    
    const upcoming = tasks
        .filter(t => !t.completed && t.deadline >= today)
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        upcomingContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No upcoming tasks</div>';
        return;
    }
    
    upcomingContainer.innerHTML = upcoming.map(task => `
        <div class="upcoming-item">
            <div class="upcoming-task">${SecurityUtils.escapeHtml(task.title)}</div>
            <div class="upcoming-date">${new Date(task.deadline).toLocaleDateString()}</div>
        </div>
    `).join('');
}

// Productivity stats update function
function updateProductivityStats() {
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const rateEl = document.getElementById('completionRate');
    if (rateEl) rateEl.textContent = `${rate}%`;
    
    // Calculate streak based on completed tasks
    updateStreak();
}

function updateStreak() {
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const completedTasks = tasks.filter(t => t.completed);
    
    if (completedTasks.length === 0) {
        const streakEl = document.getElementById('streakCount');
        if (streakEl) streakEl.textContent = '0';
        return;
    }
    
    // Get unique dates when tasks were completed
    const completedDates = new Set();
    completedTasks.forEach(task => {
        if (task.completedAt) {
            completedDates.add(task.completedAt.split('T')[0]);
        }
    });
    
    // Calculate streak - count consecutive days backwards from today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (completedDates.has(dateStr)) {
            streak++;
        } else if (i > 0) {
            // Break streak if not today and no task completed
            break;
        }
    }
    
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = streak.toString();
}

// Update level/XP based on completed tasks
function updateGamification() {
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const completedCount = tasks.filter(t => t.completed).length;
    
    // Calculate XP: 10 XP per completed task
    const xp = completedCount * 10;
    
    // Calculate level: level up every 100 XP
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;
    const xpNeeded = 100;
    
    // Update DOM
    const levelEl = document.querySelector('.level-number');
    const xpEl = document.querySelector('.xp-points');
    const progressEl = document.querySelector('.progress-fill');
    
    if (levelEl) levelEl.textContent = `Level ${level}`;
    if (xpEl) xpEl.textContent = `${xpInLevel}/${xpNeeded} XP`;
    if (progressEl) progressEl.style.width = `${xpInLevel}%`;
}

// Update balance function
function updateBalance() {
    const transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
    const income = transactions.filter(t => t.category === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.category !== 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;
    
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.textContent = `${balance.toFixed(2)}`;
        balanceEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
    }
}

// I18n global object
const I18n = {
    t: function(key) {
        const lang = localStorage.getItem('language') || 'en';
        return translations[lang]?.[key] || translations['en']?.[key] || key;
    }
};
window.I18n = I18n;

// Make calendar functions global
window.generateCalendar = generateCalendar;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.showTasksForDate = showTasksForDate;
window.updateProductivityStats = updateProductivityStats;
window.updateBalance = updateBalance;
window.updateStreak = updateStreak;
window.updateGamification = updateGamification;
