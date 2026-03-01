// ===== script.js - Main JavaScript File for LifeOS =====
// Combined and optimized version of all modules

// ===== SECURITY UTILITIES =====
const SecurityUtils = {
    // Input sanitization to prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    // HTML escape for rendering user content
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    },

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate password strength
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const score = [password.length >= minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
            .filter(Boolean).length;
        
        return {
            isValid: score >= 3,
            score: score,
            feedback: score < 3 ? [
                !password.length && 'Password must be at least 8 characters',
                !hasUpperCase && 'Add uppercase letter',
                !hasLowerCase && 'Add lowercase letter',
                !hasNumbers && 'Add numbers',
                !hasSpecialChar && 'Add special character'
            ].filter(Boolean) : []
        };
    },

    // Simple hash function for local storage (NOT for real security, just obfuscation)
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },

    // Generate secure random token
    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => chars[byte % chars.length]).join('');
    },

    // Secure local storage with encryption simulation
    secureStorage: {
        set(key, value) {
            try {
                const encrypted = btoa(JSON.stringify(value));
                localStorage.setItem(key, encrypted);
            } catch (e) {
                console.error('Storage error:', e);
            }
        },

        get(key) {
            try {
                const encrypted = localStorage.getItem(key);
                return encrypted ? JSON.parse(atob(encrypted)) : null;
            } catch (e) {
                console.error('Storage read error:', e);
                return null;
            }
        },

        remove(key) {
            localStorage.removeItem(key);
        }
    },

    // Content Security Policy helper
    validateCSP() {
        const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return !!meta;
    },

    // Check for common XSS patterns
    detectXSSAttempt(input) {
        if (typeof input !== 'string') return false;
        const patterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /eval\(/i
        ];
        return patterns.some(pattern => pattern.test(input));
    },

    // Rate limiting helper (client-side simulation)
    rateLimiter: {
        attempts: new Map(),
        maxAttempts: 5,
        windowMs: 60000, // 1 minute

        isAllowed(key) {
            const now = Date.now();
            const attempts = this.attempts.get(key) || [];
            const recentAttempts = attempts.filter(time => now - time < this.windowMs);
            
            if (recentAttempts.length >= this.maxAttempts) {
                return false;
            }
            
            recentAttempts.push(now);
            this.attempts.set(key, recentAttempts);
            return true;
        },

        reset(key) {
            this.attempts.delete(key);
        }
    }
};

// ===== CENTRALIZED DATA MANAGER =====
const DataManager = {
    // Storage keys
    STORAGE_KEYS: {
        TASKS: 'lifeos_tasks',
        TRANSACTIONS: 'lifeos_transactions',
        MOODS: 'lifeos_moods',
        USER: 'lifeos_user',
        PREFERENCES: 'lifeos_preferences',
        TIMEZONES: 'lifeos_timezones',
        ACHIEVEMENTS: 'lifeos_achievements',
        PRODUCTIVITY: 'lifeos_productivity'
    },

    // Generic get with validation
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return defaultValue;
            
            const parsed = JSON.parse(data);
            return parsed;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return defaultValue;
        }
    },

    // Generic set with validation
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            
            // Dispatch custom event for cross-module communication
            window.dispatchEvent(new CustomEvent('dataChanged', { 
                detail: { key, data: value } 
            }));
            
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    },

    // Remove data
    remove(key) {
        try {
            localStorage.removeItem(key);
            window.dispatchEvent(new CustomEvent('dataChanged', { 
                detail: { key, data: null } 
            }));
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    },

    // Initialize with defaults
    initialize() {
        const defaults = {
            [this.STORAGE_KEYS.TASKS]: [],
            [this.STORAGE_KEYS.TRANSACTIONS]: [],
            [this.STORAGE_KEYS.MOODS]: [],
            [this.STORAGE_KEYS.ACHIEVEMENTS]: this.getDefaultAchievements(),
            [this.STORAGE_KEYS.PRODUCTIVITY]: this.getDefaultProductivity()
        };

        Object.entries(defaults).forEach(([key, value]) => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        });
    },

    getDefaultAchievements() {
        return [
            { id: 'streak_3', title: 'Getting Started', description: 'Complete 3 tasks in a row', icon: '🌱', xp: 50, unlocked: false },
            { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', xp: 100, unlocked: false },
            { id: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🏆', xp: 500, unlocked: false },
            { id: 'tasks_10', title: 'Task Tackler', description: 'Complete 10 tasks', icon: '✅', xp: 75, unlocked: false },
            { id: 'tasks_100', title: 'Productivity Pro', description: 'Complete 100 tasks', icon: '💪', xp: 250, unlocked: false },
            { id: 'mood_7', title: 'Mood Tracker', description: 'Log mood for 7 days', icon: '😊', xp: 75, unlocked: false },
            { id: 'expense_100', title: 'Money Mindful', description: 'Track 100 transactions', icon: '💰', xp: 100, unlocked: false },
            { id: 'theme_switch', title: 'Theme Explorer', description: 'Switch themes 10 times', icon: '🎨', xp: 25, unlocked: false }
        ];
    },

    getDefaultProductivity() {
        return {
            currentStreak: 0,
            longestStreak: 0,
            totalTasksCompleted: 0,
            totalTasksCreated: 0,
            dailyStats: {},
            weeklyGoals: {
                tasksCompleted: 0,
                tasksTarget: 20
            }
        };
    },

    // Export all data
    exportAll() {
        const data = {};
        Object.values(this.STORAGE_KEYS).forEach(key => {
            data[key] = this.get(key);
        });
        return {
            ...data,
            exportedAt: new Date().toISOString(),
            version: '2.0.0'
        };
    },

    // Import data with validation
    importData(data, options = {}) {
        const { merge = true } = options;
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid import data');
        }

        const results = { success: [], failed: [] };

        Object.entries(this.STORAGE_KEYS).forEach(([key, storageKey]) => {
            if (data[key] !== undefined) {
                try {
                    if (merge) {
                        // Merge with existing data
                        const existing = this.get(storageKey, []);
                        const imported = Array.isArray(existing) 
                            ? [...existing, ...data[key]] 
                            : { ...existing, ...data[key] };
                        this.set(storageKey, imported);
                    } else {
                        // Replace entirely
                        this.set(storageKey, data[key]);
                    }
                    results.success.push(key);
                } catch (error) {
                    results.failed.push(key);
                }
            }
        });

        return results;
    },

    // Clear all data
    clearAll() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// ===== NOTIFICATION SYSTEM =====
const NotificationSystem = {
    container: null,
    stylesAdded: false,

    init() {
        // Create container if not exists
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        }

        // Add animation styles
        if (!this.stylesAdded) {
            this.addStyles();
            this.stylesAdded = true;
        }
    },

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-toast {
                padding: 1rem 1.5rem;
                border-radius: 12px;
                color: white;
                font-family: 'Inter', system-ui, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                animation: slideInRight 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 12px;
                backdrop-filter: blur(10px);
                border-left: 4px solid rgba(255,255,255,0.3);
            }
            .notification-toast.success {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .notification-toast.error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }
            .notification-toast.warning {
                background: linear-gradient(135deg, #f59e0b, #d97706);
            }
            .notification-toast.info {
                background: linear-gradient(135deg, #6366f1, #4f46e5);
            }
            .notification-toast.removing {
                animation: slideOutRight 0.3s ease-in forwards;
            }
            .notification-icon {
                font-size: 18px;
                flex-shrink: 0;
            }
            .notification-close {
                margin-left: auto;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                opacity: 0.8;
                transition: opacity 0.2s;
                font-size: 16px;
            }
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        
        // Get icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <span class="notification-message">${SecurityUtils.escapeHtml(message)}</span>
            <button class="notification-close">✕</button>
        `;

        // Add click to dismiss
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.dismiss(notification));

        this.container.appendChild(notification);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(notification), duration);
        }

        return notification;
    },

    dismiss(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.add('removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },

    // Clear all notifications
    clearAll() {
        if (this.container) {
            const notifications = this.container.querySelectorAll('.notification-toast');
            notifications.forEach(n => this.dismiss(n));
        }
    }
};

// ===== MODAL SYSTEM =====
const ModalManager = {
    modals: new Map(),
    zIndex: 1000,

    create(config) {
        const {
            id,
            title = '',
            content = '',
            size = 'medium', // small, medium, large, full
            closable = true,
            closeOnOverlay = true,
            closeOnEscape = true,
            showCloseButton = true,
            buttons = [],
            onOpen = null,
            onClose = null
        } = config;

        // Remove existing modal with same id
        if (this.modals.has(id)) {
            this.close(id);
        }

        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal-wrapper';
        modal.id = id;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: ${this.zIndex++};
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
        `;

        // Size classes
        const sizeClasses = {
            small: 'max-width: 400px',
            medium: 'max-width: 600px',
            large: 'max-width: 800px',
            full: 'max-width: 95vw; max-height: 95vh'
        };

        // Build modal HTML
        let buttonsHtml = '';
        if (buttons.length > 0) {
            buttonsHtml = '<div class="modal-buttons" style="display: flex; gap: 8px; justify-content: flex-end;">' + buttons.map(btn => `
                <button class="modal-btn ${btn.primary ? 'primary' : ''}" 
                        data-action="${btn.id}"
                        style="padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; ${btn.primary ? 'background: var(--accent-primary); color: white;' : 'background: var(--bg-tertiary); color: var(--text-primary);'}">
                    ${btn.icon ? `<i class="${btn.icon}"></i> ` : ''}${btn.text}
                </button>
            `).join('') + '</div>';
        }

        modal.innerHTML = `
            <div class="modal-overlay" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
            "></div>
            <div class="modal-content" style="
                ${sizeClasses[size]}
                background: var(--bg-secondary);
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                position: relative;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s;
                border: 1px solid var(--border-color);
            ">
                ${showCloseButton ? `
                    <button class="modal-close" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: transparent;
                        border: none;
                        color: var(--text-secondary);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 8px;
                        transition: all 0.2s;
                        z-index: 10;
                    ">&times;</button>
                ` : ''}
                ${title ? `<div class="modal-header" style="
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-color);
                ">
                    <h2 style="
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: var(--text-primary);
                    ">${SecurityUtils.escapeHtml(title)}</h2>
                </div>` : ''}
                <div class="modal-body" style="
                    padding: 24px;
                ">${content}</div>
                ${buttonsHtml ? `<div class="modal-footer" style="
                    padding: 16px 24px;
                    border-top: 1px solid var(--border-color);
                ">${buttonsHtml}</div>` : ''}
            </div>
        `;

        // Add event listeners
        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');

        if (closable && closeOnOverlay) {
            overlay.addEventListener('click', () => this.close(id));
        }

        if (closable && showCloseButton) {
            closeBtn.addEventListener('click', () => this.close(id));
        }

        // Button handlers
        buttons.forEach(btn => {
            const btnElement = modal.querySelector(`[data-action="${btn.id}"]`);
            if (btnElement && btn.onClick) {
                btnElement.addEventListener('click', (e) => btn.onClick(e, { close: () => this.close(id) }));
            }
        });

        // Escape key handler
        if (closable && closeOnEscape) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close(id);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            modal.escapeHandler = escapeHandler;
            document.addEventListener('keydown', escapeHandler);
        }

        // Store modal reference
        this.modals.set(id, {
            element: modal,
            config,
            onClose
        });

        // Add to DOM
        document.body.appendChild(modal);

        // Trigger open animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        });

        // Call onOpen callback
        if (onOpen) {
            onOpen(modal);
        }

        return modal;
    },

    close(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { element, onClose } = modalData;
        const content = element.querySelector('.modal-content');

        // Animate out
        element.style.opacity = '0';
        element.style.visibility = 'hidden';
        content.style.transform = 'scale(0.9)';

        // Remove after animation
        setTimeout(() => {
            if (element.escapeHandler) {
                document.removeEventListener('keydown', element.escapeHandler);
            }
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.modals.delete(id);
            
            if (onClose) {
                onClose();
            }
        }, 300);
    },

    closeAll() {
        this.modals.forEach((_, id) => this.close(id));
    },

    // Helper methods for common modals
    alert(message, type = 'info') {
        return new Promise((resolve) => {
            this.create({
                id: 'alert-' + Date.now(),
                title: type.charAt(0).toUpperCase() + type.slice(1),
                content: `<p style="font-size: 1rem; color: var(--text-secondary);">${SecurityUtils.escapeHtml(message)}</p>`,
                size: 'small',
                buttons: [{
                    id: 'ok',
                    text: 'OK',
                    primary: true,
                    onClick: () => resolve(true)
                }]
            });
        });
    },

    confirm(message) {
        return new Promise((resolve) => {
            this.create({
                id: 'confirm-' + Date.now(),
                title: 'Confirm',
                content: `<p style="font-size: 1rem; color: var(--text-secondary);">${SecurityUtils.escapeHtml(message)}</p>`,
                size: 'small',
                buttons: [
                    {
                        id: 'cancel',
                        text: 'Cancel',
                        onClick: () => resolve(false)
                    },
                    {
                        id: 'confirm',
                        text: 'Confirm',
                        primary: true,
                        onClick: () => resolve(true)
                    }
                ]
            });
        });
    },

    prompt(title, defaultValue = '') {
        return new Promise((resolve) => {
            const inputId = 'prompt-input-' + Date.now();
            
            this.create({
                id: 'prompt-' + Date.now(),
                title,
                content: `
                    <input type="text" id="${inputId}" 
                           style="
                               width: 100%;
                               padding: 12px;
                               border-radius: 8px;
                               border: 1px solid var(--border-color);
                               background: var(--bg-primary);
                               color: var(--text-primary);
                               font-size: 1rem;
                           "
                           value="${SecurityUtils.escapeHtml(defaultValue)}"
                           autofocus>
                `,
                size: 'small',
                onOpen: () => {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.focus();
                        input.select();
                    }
                },
                buttons: [
                    {
                        id: 'cancel',
                        text: 'Cancel',
                        onClick: () => resolve(null)
                    },
                    {
                        id: 'submit',
                        text: 'Submit',
                        primary: true,
                        onClick: () => {
                            const input = document.getElementById(inputId);
                            resolve(input ? input.value : null);
                        }
                    }
                ]
            });
        });
    }
};

// ===== PERFORMANCE UTILITIES =====
const PerformanceUtils = {
    // Debounce function
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Lazy load images
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    },

    // Optimize DOM updates with requestAnimationFrame
    rafUpdate(callback) {
        let scheduled = false;
        return function(...args) {
            if (!scheduled) {
                scheduled = true;
                requestAnimationFrame(() => {
                    callback.apply(this, args);
                    scheduled = false;
                });
            }
        };
    },

    // Initialize intersection observer for animations
    initIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
};

// ===== INTERNATIONALIZATION =====
const translations = {
    en: {
        dashboard: 'Dashboard',
        tasks: 'Tasks',
        analytics: 'Analytics',
        calendar: 'Calendar',
        expenses: 'Expenses',
        team: 'Team',
        aiAssistant: 'AI Assistant',
        welcomeBack: 'Welcome Back!',
        createAccount: 'Create Account',
        haveAccount: 'Already have an account?',
        login: 'Login',
        noAccount: "Don't have an account?",
        signup: 'Sign up',
        welcomeMessage: 'Welcome back',
        dayStreak: 'day streak',
        smartTaskManager: 'Smart Task Manager',
        taskPlaceholder: 'Add a new task...',
        study: 'Study',
        health: 'Health',
        work: 'Work',
        personal: 'Personal',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        all: 'All',
        completed: 'Completed',
        pending: 'Pending',
        productivityAnalytics: 'Productivity Analytics',
        completionRate: 'Completion Rate',
        mostProductive: 'Most Productive',
        mentalHealth: 'Mental Health Tracker',
        gratitudeNote: 'I\'m grateful for:',
        expenseTracker: 'Expense Tracker',
        currentBalance: 'Current Balance',
        income: 'Income',
        food: 'Food',
        transport: 'Transport',
        entertainment: 'Entertainment',
        bills: 'Bills',
        add: 'Add',
        smartCalendar: 'Smart Calendar',
        upcomingTasks: 'Upcoming Tasks',
        globalTime: 'Global Time Zone',
        pakistan: 'Pakistan',
        usa: 'USA (NY)',
        uk: 'UK',
        japan: 'Japan',
        addTimezone: 'Add Timezone',
        achievements: 'Achievements',
        streakMaster: 'Streak Master',
        taskHero: 'Task Hero',
        saver: 'Saver',
        mindful: 'Mindful',
        installApp: 'Install LifeOS App',
        installDesc: 'Install on your device for offline use',
        install: 'Install',
        logout: 'Logout',
        settings: 'Settings',
        profile: 'Profile',
        help: 'Help'
    },
    ur: {
        dashboard: 'ڈیش بورڈ',
        tasks: 'کام',
        analytics: 'تجزیہ',
        calendar: 'کیلنڈر',
        expenses: 'اخراجات',
        team: 'ٹیم',
        aiAssistant: 'AI مددگار',
        welcomeBack: 'خوش آمدید!',
        createAccount: 'اکاؤنٹ بنائیں',
        haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
        login: 'لاگ ان',
        noAccount: 'اکاؤنٹ نہیں ہے؟',
        signup: 'سائن اپ',
        welcomeMessage: 'خوش آمدید',
        dayStreak: 'دن کا سلسلہ',
        smartTaskManager: 'سمارٹ ٹاسک مینیجر',
        taskPlaceholder: 'نیا کام شامل کریں...',
        study: 'مطالعہ',
        health: 'صحت',
        work: 'کام',
        personal: 'ذاتی',
        high: 'اعلی',
        medium: 'درمیانہ',
        low: 'کم',
        all: 'سب',
        completed: 'مکمل',
        pending: 'زیر التواء',
        productivityAnalytics: 'پیداواری تجزیہ',
        completionRate: 'تکمیل کی شرح',
        mostProductive: 'سب سے زیادہ پیداواری',
        mentalHealth: 'ذہنی صحت',
        gratitudeNote: 'میں شکرگزار ہوں:',
        expenseTracker: 'اخراجات ٹریکر',
        currentBalance: 'موجودہ بیلنس',
        income: 'آمدنی',
        food: 'کھانا',
        transport: 'ٹرانسپورٹ',
        entertainment: 'تفریح',
        bills: 'بلز',
        add: 'شامل کریں',
        smartCalendar: 'سمارٹ کیلنڈر',
        upcomingTasks: 'آنے والے کام',
        globalTime: 'عالمی ٹائم زون',
        pakistan: 'پاکستان',
        usa: 'امریکہ (NY)',
        uk: 'برطانیہ',
        japan: 'جاپان',
        addTimezone: 'ٹائم زون شامل کریں',
        achievements: 'کامیابیاں',
        streakMaster: 'اسٹریک ماسٹر',
        taskHero: 'ٹاسک ہیرو',
        saver: 'بچت کرنے والا',
        mindful: 'ذہنی',
        installApp: 'LifeOS ایپ انسٹال کریں',
        installDesc: 'آف لائن استعمال کے لیے انسٹال کریں',
        install: 'انسٹال',
        logout: 'لاگ آؤٹ',
        settings: 'ترتیبات',
        profile: 'پروفائل',
        help: 'مدد'
    },
    ar: {
        dashboard: 'لوحة التحكم',
        tasks: 'المهام',
        analytics: 'التحليلات',
        calendar: 'التقويم',
        expenses: 'المصروفات',
        team: 'الفريق',
        aiAssistant: 'المساعد الذكي',
        welcomeBack: 'مرحباً بعودتك!',
        createAccount: 'إنشاء حساب',
        haveAccount: 'لديك حساب بالفعل؟',
        login: 'تسجيل الدخول',
        noAccount: 'ليس لديك حساب؟',
        signup: 'اشتراك',
        welcomeMessage: 'مرحباً بعودتك',
        dayStreak: 'أيام متتالية',
        smartTaskManager: 'مدير المهام الذكي',
        taskPlaceholder: 'أضف مهمة جديدة...',
        study: 'دراسة',
        health: 'صحة',
        work: 'عمل',
        personal: 'شخصي',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض',
        all: 'الكل',
        completed: 'مكتمل',
        pending: 'معلق',
        productivityAnalytics: 'تحليلات الإنتاجية',
        completionRate: 'معدل الإنجاز',
        mostProductive: 'الأكثر إنتاجية',
        mentalHealth: 'تتبع الصحة النفسية',
        gratitudeNote: 'أنا ممتن لـ:',
        expenseTracker: 'تتبع المصروفات',
        currentBalance: 'الرصيد الحالي',
        income: 'دخل',
        food: 'طعام',
        transport: 'مواصلات',
        entertainment: 'ترفيه',
        bills: 'فواتير',
        add: 'إضافة',
        smartCalendar: 'التقويم الذكي',
        upcomingTasks: 'المهام القادمة',
        globalTime: 'التوقيت العالمي',
        pakistan: 'باكستان',
        usa: 'أمريكا (نيويورك)',
        uk: 'المملكة المتحدة',
        japan: 'اليابان',
        addTimezone: 'إضافة منطقة زمنية',
        achievements: 'الإنجازات',
        streakMaster: 'سيد الاستمرارية',
        taskHero: 'بطل المهام',
        saver: 'مدخر',
        mindful: 'واعي',
        installApp: 'تثبيت تطبيق LifeOS',
        installDesc: 'ثبت على جهازك للاستخدام دون اتصال',
        install: 'تثبيت',
        logout: 'تسجيل خروج',
        settings: 'إعدادات',
        profile: 'الملف الشخصي',
        help: 'مساعدة'
    },
    es: {
        dashboard: 'Tablero',
        tasks: 'Tareas',
        analytics: 'Análisis',
        calendar: 'Calendario',
        expenses: 'Gastos',
        team: 'Equipo',
        aiAssistant: 'Asistente IA',
        welcomeBack: '¡Bienvenido de nuevo!',
        createAccount: 'Crear cuenta',
        haveAccount: '¿Ya tienes cuenta?',
        login: 'Iniciar sesión',
        noAccount: '¿No tienes cuenta?',
        signup: 'Registrarse',
        welcomeMessage: '¡Bienvenido de nuevo',
        dayStreak: 'días seguidos',
        smartTaskManager: 'Gestor Inteligente de Tareas',
        taskPlaceholder: 'Añadir nueva tarea...',
        study: 'Estudio',
        health: 'Salud',
        work: 'Trabajo',
        personal: 'Personal',
        high: 'Alta',
        medium: 'Media',
        low: 'Baja',
        all: 'Todos',
        completed: 'Completados',
        pending: 'Pendientes',
        productivityAnalytics: 'Análisis de Productividad',
        completionRate: 'Tasa de Finalización',
        mostProductive: 'Más Productivo',
        mentalHealth: 'Seguimiento de Salud Mental',
        gratitudeNote: 'Estoy agradecido por:',
        expenseTracker: 'Seguimiento de Gastos',
        currentBalance: 'Saldo Actual',
        income: 'Ingresos',
        food: 'Comida',
        transport: 'Transporte',
        entertainment: 'Entretenimiento',
        bills: 'Facturas',
        add: 'Añadir',
        smartCalendar: 'Calendario Inteligente',
        upcomingTasks: 'Próximas Tareas',
        globalTime: 'Zona Horaria Global',
        pakistan: 'Pakistán',
        usa: 'EE.UU. (NY)',
        uk: 'Reino Unido',
        japan: 'Japón',
        addTimezone: 'Añadir Zona Horaria',
        achievements: 'Logros',
        streakMaster: 'Maestro de Racha',
        taskHero: 'Héroe de Tareas',
        saver: 'Ahorrador',
        mindful: 'Consciente',
        installApp: 'Instalar App LifeOS',
        installDesc: 'Instala en tu dispositivo para uso sin conexión',
        install: 'Instalar',
        logout: 'Cerrar sesión',
        settings: 'Configuración',
        profile: 'Perfil',
        help: 'Ayuda'
    }
};

let currentLanguage = localStorage.getItem('language') || 'en';

function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(lang)) {
            btn.classList.add('active');
        }
    });
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'OPTION') {
                element.textContent = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Update welcome message with name if logged in
    if (AuthManager && AuthManager.currentUser) {
        const welcomeEl = document.querySelector('[data-i18n="welcomeMessage"]');
        if (welcomeEl) {
            welcomeEl.textContent = `${translations[lang].welcomeMessage}, ${AuthManager.currentUser.name}! 👋`;
        }
    }
    
    localStorage.setItem('language', lang);
}

// ===== CHARTS MODULE =====
const ChartManager = {
    charts: {
        productivity: null,
        mood: null,
        expense: null
    },

    init() {
        this.initializeCharts();
        this.loadData();
        
        // Listen for data changes
        window.addEventListener('dataChanged', (e) => {
            if (e.detail.key === DataManager.STORAGE_KEYS.TASKS) {
                this.updateProductivityChart();
            } else if (e.detail.key === DataManager.STORAGE_KEYS.MOODS) {
                this.updateMoodChart();
            } else if (e.detail.key === DataManager.STORAGE_KEYS.TRANSACTIONS) {
                this.updateExpenseChart();
            }
        });
    },

    loadData() {
        this.updateProductivityChart();
        this.updateMoodChart();
        this.updateExpenseChart();
    },

    initializeCharts() {
        this.initializeProductivityChart();
        this.initializeMoodChart();
        this.initializeExpenseChart();
    },

    initializeProductivityChart() {
        const canvas = document.getElementById('productivityChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        this.charts.productivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Tasks Completed',
                    data: this.getProductivityData(),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: this.getChartOptions('Tasks Completed')
        });
    },

    initializeMoodChart() {
        const canvas = document.getElementById('moodChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        this.charts.mood = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Mood',
                    data: this.getMoodData(),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: this.getChartOptions('Mood', {
                min: 1,
                max: 5,
                stepSize: 1,
                callback: (value) => {
                    const moods = ['', '😔', '😤', '😐', '😊', '😄'];
                    return moods[value] || '';
                }
            })
        });
    },

    initializeExpenseChart() {
        const canvas = document.getElementById('expenseChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        this.charts.expense = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Food', 'Transport', 'Entertainment', 'Bills', 'Other'],
                datasets: [{
                    data: this.getExpenseData(),
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#6366f1',
                        '#8b5cf6'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: $${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    getChartOptions(title, yOptions = {}) {
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'var(--bg-secondary)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'var(--border-color)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        ...yOptions
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'var(--text-secondary)' }
                }
            }
        };

        if (yOptions.min !== undefined) {
            defaultOptions.scales.y.min = yOptions.min;
            defaultOptions.scales.y.max = yOptions.max;
            defaultOptions.scales.y.ticks.stepSize = yOptions.stepSize;
            defaultOptions.scales.y.ticks.callback = yOptions.callback;
        }

        return defaultOptions;
    },

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        return days;
    },

    getProductivityData() {
        const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const count = tasks.filter(t => 
                t.completed && t.completedAt && 
                t.completedAt.startsWith(dateStr)
            ).length;
            
            data.push(count);
        }
        
        return data;
    },

    getMoodData() {
        const moods = DataManager.get(DataManager.STORAGE_KEYS.MOODS, []);
        const moodMap = { '😊': 5, '😄': 5, '😐': 3, '😔': 1, '😤': 2, '😴': 2, '🤔': 3, '🥰': 5 };
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const dayMoods = moods.filter(m => m.date === dateStr);
            
            if (dayMoods.length > 0) {
                const avg = dayMoods.reduce((sum, m) => sum + (moodMap[m.mood] || 3), 0) / dayMoods.length;
                data.push(Math.round(avg));
            } else {
                data.push(0);
            }
        }
        
        return data;
    },

    getExpenseData() {
        const transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
        
        // Only consider expenses (not income)
        const expenses = transactions.filter(t => t.category !== 'income');
        
        const categories = ['food', 'transport', 'entertainment', 'bills', 'other'];
        
        return categories.map(cat => {
            return expenses
                .filter(t => t.category === cat)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        });
    },

    updateProductivityChart() {
        if (this.charts.productivity) {
            this.charts.productivity.data.labels = this.getLast7Days();
            this.charts.productivity.data.datasets[0].data = this.getProductivityData();
            this.charts.productivity.update();
        }
    },

    updateMoodChart() {
        if (this.charts.mood) {
            this.charts.mood.data.labels = this.getLast7Days();
            this.charts.mood.data.datasets[0].data = this.getMoodData();
            this.charts.mood.update();
        }
    },

    updateExpenseChart() {
        if (this.charts.expense) {
            this.charts.expense.data.datasets[0].data = this.getExpenseData();
            this.charts.expense.update();
        }
    },

    getAnalyticsSummary() {
        const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
        const transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
        const moods = DataManager.get(DataManager.STORAGE_KEYS.MOODS, []);

        const completedTasks = tasks.filter(t => t.completed).length;
        const totalIncome = transactions
            .filter(t => t.category === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.category !== 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            totalTasks: tasks.length,
            completedTasks,
            completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            moodEntries: moods.length
        };
    }
};

// ===== MOOD TRACKER MANAGER =====
const MoodManager = {
    moods: [],
    moodTypes: [
        { emoji: '😊', label: 'Happy', value: 5, color: '#10b981' },
        { emoji: '😄', label: 'Excited', value: 5, color: '#34d399' },
        { emoji: '😐', label: 'Neutral', value: 3, color: '#f59e0b' },
        { emoji: '😔', label: 'Sad', value: 1, color: '#6366f1' },
        { emoji: '😤', label: 'Frustrated', value: 2, color: '#ef4444' },
        { emoji: '😴', label: 'Tired', value: 2, color: '#8b5cf6' },
        { emoji: '🤔', label: 'Thoughtful', value: 3, color: '#3b82f6' },
        { emoji: '🥰', label: 'Loved', value: 5, color: '#ec4899' }
    ],

    init() {
        this.moods = DataManager.get(DataManager.STORAGE_KEYS.MOODS, []);
        this.updateMoodChart();
    },

    logMood(mood, journal = '', gratitude = '') {
        // Get mood info
        const moodInfo = this.moodTypes.find(m => m.emoji === mood);
        
        const moodEntry = {
            id: `mood_${Date.now()}_${SecurityUtils.generateToken(6)}`,
            date: new Date().toISOString().split('T')[0],
            mood: mood,
            moodValue: moodInfo?.value || 3,
            journal: SecurityUtils.sanitizeInput(journal),
            gratitude: SecurityUtils.sanitizeInput(gratitude),
            timestamp: new Date().toISOString()
        };

        // Check if already logged today
        const existingToday = this.moods.find(m => m.date === moodEntry.date);
        
        if (existingToday) {
            ModalManager.confirm('You already logged your mood today. Update it?').then(confirmed => {
                if (confirmed) {
                    // Update existing
                    Object.assign(existingToday, moodEntry);
                    this.save();
                    this.updateMoodChart();
                    NotificationSystem.success('Mood updated!', 2000);
                }
            });
        } else {
            this.moods.push(moodEntry);
            this.save();
            this.updateMoodChart();
            NotificationSystem.success('Mood logged! 🌟', 2000);
        }
    },

    deleteMood(id) {
        this.moods = this.moods.filter(m => m.id !== id);
        this.save();
        this.updateMoodChart();
        NotificationSystem.info('Mood entry deleted', 2000);
    },

    getMoods(filter = {}) {
        let filtered = [...this.moods];

        if (filter.startDate) {
            filtered = filtered.filter(m => m.date >= filter.startDate);
        }

        if (filter.endDate) {
            filtered = filtered.filter(m => m.date <= filter.endDate);
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getWeeklyAverage() {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const weekMoods = this.moods.filter(m => m.date >= weekAgoStr && m.date <= today);
        
        if (weekMoods.length === 0) return 0;

        const sum = weekMoods.reduce((acc, m) => acc + (m.moodValue || 3), 0);
        return (sum / weekMoods.length).toFixed(1);
    },

    getMonthlyAverage() {
        const today = new Date().toISOString().split('T')[0];
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];

        const monthMoods = this.moods.filter(m => m.date >= monthAgoStr && m.date <= today);
        
        if (monthMoods.length === 0) return 0;

        const sum = monthMoods.reduce((acc, m) => acc + (m.moodValue || 3), 0);
        return (sum / monthMoods.length).toFixed(1);
    },

    getMoodTrend() {
        const recent = this.moods.slice(-7);
        
        if (recent.length < 2) return 'stable';

        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));

        const firstAvg = firstHalf.reduce((s, m) => s + (m.moodValue || 3), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s, m) => s + (m.moodValue || 3), 0) / secondHalf.length;

        const diff = secondAvg - firstAvg;
        
        if (diff > 0.5) return 'improving';
        if (diff < -0.5) return 'declining';
        return 'stable';
    },

    getCommonGratitudes() {
        const gratitudes = this.moods
            .filter(m => m.gratitude)
            .map(m => m.gratitude.toLowerCase());

        const counts = {};
        gratitudes.forEach(g => {
            counts[g] = (counts[g] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text, count]) => ({ text, count }));
    },

    updateMoodChart() {
        if (window.ChartManager) {
            ChartManager.updateMoodChart();
        }
    },

    save() {
        DataManager.set(DataManager.STORAGE_KEYS.MOODS, this.moods);
    },

    showHistory() {
        const moods = this.getMoods();
        
        const content = moods.length > 0
            ? moods.map(m => {
                const moodInfo = this.moodTypes.find(t => t.emoji === m.mood);
                return `
                    <div style="padding: 16px; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 2rem;">${m.mood}</span>
                                <div>
                                    <div style="font-weight: 500;">${moodInfo?.label || 'Unknown'}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${m.date}</div>
                                </div>
                            </div>
                            <button onclick="MoodManager.deleteMood('${m.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        ${m.journal ? `<div style="margin-top: 12px; padding: 12px; background: var(--bg-primary); border-radius: 8px; font-size: 0.9rem;">${SecurityUtils.escapeHtml(m.journal)}</div>` : ''}
                        ${m.gratitude ? `<div style="margin-top: 8px; font-size: 0.9rem; color: var(--warning);"><i class="fas fa-sun"></i> ${SecurityUtils.escapeHtml(m.gratitude)}</div>` : ''}
                    </div>
                `;
            }).join('')
            : '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No mood entries yet</div>';

        ModalManager.create({
            id: 'mood-history-modal',
            title: 'Mood History',
            content: `<div style="max-height: 400px; overflow-y: auto;">${content}</div>`,
            size: 'large',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    },

    showAnalytics() {
        const weekly = this.getWeeklyAverage();
        const monthly = this.getMonthlyAverage();
        const trend = this.getMoodTrend();
        const commonGratitudes = this.getCommonGratitudes();

        const trendEmoji = {
            improving: '📈',
            declining: '📉',
            stable: '➡️'
        };

        const trendLabel = {
            improving: 'Improving',
            declining: 'Declining',
            stable: 'Stable'
        };

        const gratitudeHtml = commonGratitudes.length > 0
            ? commonGratitudes.map(g => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>${SecurityUtils.escapeHtml(g.text)}</span>
                    <span style="color: var(--text-secondary);">${g.count}x</span>
                </div>
            `).join('')
            : '<div style="color: var(--text-secondary);">No gratitudes logged yet</div>';

        const content = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Weekly Avg</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${weekly}/5</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Monthly Avg</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${monthly}/5</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Trend</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${trendEmoji[trend]} ${trendLabel[trend]}</div>
                </div>
            </div>
            <h4 style="margin-bottom: 12px;">Common Gratitudes</h4>
            ${gratitudeHtml}
        `;

        ModalManager.create({
            id: 'mood-analytics-modal',
            title: 'Mood Analytics',
            content,
            size: 'medium',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    }
};

// ===== TASK MANAGEMENT MODULE =====
const TaskManager = {
    tasks: [],
    filters: {
        search: '',
        status: 'all',
        category: 'all',
        priority: 'all'
    },

    init() {
        // Load tasks from DataManager
        this.tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
    },

    setupEventListeners() {
        const searchInput = document.getElementById('taskSearch');
        const filterSelect = document.getElementById('taskFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.render();
            });
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.render();
            });
        }
    },

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const category = document.getElementById('taskCategory');
        const priority = document.getElementById('taskPriority');
        const deadline = document.getElementById('taskDeadline');
        
        if (!taskInput || !category || !priority) {
            NotificationSystem.error('Form elements not found');
            return;
        }

        const title = taskInput.value.trim();
        
        if (!title) {
            NotificationSystem.warning('Please enter a task title');
            return;
        }

        // XSS check
        if (SecurityUtils.detectXSSAttempt(title)) {
            NotificationSystem.error('Invalid characters in task title');
            return;
        }

        const task = {
            id: `task_${Date.now()}_${SecurityUtils.generateToken(6)}`,
            title: SecurityUtils.sanitizeInput(title),
            category: category.value,
            priority: priority.value,
            deadline: deadline?.value || new Date().toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString(),
            notes: '',
            tags: []
        };

        this.tasks.push(task);
        this.save();
        this.render();
        
        // Clear input
        taskInput.value = '';
        taskInput.focus();
        
        // Update productivity stats
        updateProductivityStats();
        
        // Update streak
        updateStreak();
        
        // Update gamification
        updateGamification();

        NotificationSystem.success('Task added successfully!', 2000);
    },

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            
            if (task.completed) {
                task.completedAt = new Date().toISOString();
            }
            
            this.save();
            this.render();
            
            updateProductivityStats();

            if (task.completed) {
                NotificationSystem.success('Task completed! 🎉', 2000);
            }
        }
    },

    deleteTask(taskId) {
        ModalManager.confirm('Are you sure you want to delete this task?').then(confirmed => {
            if (confirmed) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.save();
                this.render();
                
                updateProductivityStats();
                
                NotificationSystem.info('Task deleted', 2000);
            }
        });
    },

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task) return;

        ModalManager.prompt('Edit Task', task.title).then(newTitle => {
            if (newTitle !== null && newTitle.trim()) {
                // XSS check
                if (SecurityUtils.detectXSSAttempt(newTitle)) {
                    NotificationSystem.error('Invalid characters in task title');
                    return;
                }
                
                task.title = SecurityUtils.sanitizeInput(newTitle.trim());
                task.updatedAt = new Date().toISOString();
                
                this.save();
                this.render();
                
                NotificationSystem.success('Task updated', 2000);
            }
        });
    },

    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(this.filters.search) ||
                task.category.toLowerCase().includes(this.filters.search)
            );
        }
        
        // Status filter
        if (this.filters.status === 'completed') {
            filtered = filtered.filter(task => task.completed);
        } else if (this.filters.status === 'pending') {
            filtered = filtered.filter(task => !task.completed);
        }
        
        return filtered;
    },

    render() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        const filteredTasks = this.getFilteredTasks();

        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No tasks yet. Add one above! ✨</div>';
            return;
        }

        // Sort: incomplete first, then by priority
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', task.id);
            
            const priorityClass = `priority-${task.priority}`;
            const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline';
            
            li.innerHTML = `
                <div class="task-checkbox" onclick="TaskManager.toggleTask('${task.id}')">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-priority ${priorityClass}"></div>
                    <span class="task-text" ondblclick="TaskManager.editTask('${task.id}')">${SecurityUtils.escapeHtml(task.title)}</span>
                </div>
                <span class="task-category">${SecurityUtils.escapeHtml(task.category)}</span>
                <span class="task-deadline">${SecurityUtils.escapeHtml(deadline)}</span>
                <div class="task-actions">
                    <i class="fas fa-edit" onclick="TaskManager.editTask('${task.id}')" style="color: var(--accent-primary); cursor: pointer; margin-right: 8px;" title="Edit"></i>
                    <i class="fas fa-trash" onclick="TaskManager.deleteTask('${task.id}')" style="color: var(--danger); cursor: pointer;" title="Delete"></i>
                </div>
            `;
            
            taskList.appendChild(li);
        });

        // Update stats
        const stats = this.getStats();
        document.getElementById('pendingTasks').textContent = stats.pending;
        document.getElementById('completedTasks').textContent = stats.completed;
        document.getElementById('overdueTasks').textContent = stats.overdue;
        
        // Update progress bar
        const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        document.getElementById('taskProgressPercent').textContent = `${progressPercent}%`;
        document.getElementById('taskProgressBar').style.width = `${progressPercent}%`;
    },

    save() {
        DataManager.set(DataManager.STORAGE_KEYS.TASKS, this.tasks);
    },

    // Statistics
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        // Overdue tasks
        const today = new Date().toISOString().split('T')[0];
        const overdue = this.tasks.filter(t => !t.completed && t.deadline && t.deadline < today).length;
        
        const byCategory = {};
        const byPriority = { high: 0, medium: 0, low: 0 };
        
        this.tasks.forEach(task => {
            byCategory[task.category] = (byCategory[task.category] || 0) + 1;
            byPriority[task.priority]++;
        });

        return {
            total,
            completed,
            pending,
            overdue,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            byCategory,
            byPriority
        };
    }
};

// ===== TRANSACTION MANAGER =====
const TransactionManager = {
    transactions: [],
    categories: {
        income: { label: 'Income', color: '#10b981', icon: '💰' },
        food: { label: 'Food', color: '#f59e0b', icon: '🍔' },
        transport: { label: 'Transport', color: '#3b82f6', icon: '🚗' },
        entertainment: { label: 'Entertainment', color: '#ef4444', icon: '🎬' },
        bills: { label: 'Bills', color: '#8b5cf6', icon: '📄' },
        shopping: { label: 'Shopping', color: '#ec4899', icon: '🛍️' },
        healthcare: { label: 'Healthcare', color: '#14b8a6', icon: '🏥' },
        education: { label: 'Education', color: '#f97316', icon: '📚' },
        other: { label: 'Other', color: '#6b7280', icon: '📦' }
    },

    init() {
        this.transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
        this.updateBalance();
    },

    addTransaction(description, amount, category) {
        // Validate inputs
        if (!description || !amount || !category) {
            NotificationSystem.error('Please fill in all fields');
            return false;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            NotificationSystem.error('Please enter a valid amount');
            return false;
        }

        // XSS check
        if (SecurityUtils.detectXSSAttempt(description)) {
            NotificationSystem.error('Invalid description');
            return false;
        }

        const transaction = {
            id: `txn_${Date.now()}_${SecurityUtils.generateToken(6)}`,
            description: SecurityUtils.sanitizeInput(description),
            amount: numAmount,
            category: category,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.save();
        this.updateBalance();
        
        // Update expense chart
        if (window.ChartManager) {
            ChartManager.updateExpenseChart();
        }

        NotificationSystem.success('Transaction added!', 2000);
        return true;
    },

    deleteTransaction(id) {
        ModalManager.confirm('Delete this transaction?').then(confirmed => {
            if (confirmed) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.save();
                this.updateBalance();
                
                if (window.ChartManager) {
                    ChartManager.updateExpenseChart();
                }
                
                NotificationSystem.info('Transaction deleted', 2000);
            }
        });
    },

    getBalance() {
        const income = this.transactions
            .filter(t => t.category === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.category !== 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            income,
            expenses,
            balance: income - expenses
        };
    },

    updateBalance() {
        const { balance } = this.getBalance();
        const balanceEl = document.getElementById('balance');
        
        if (balanceEl) {
            balanceEl.textContent = `$${balance.toFixed(2)}`;
            
            // Color coding
            if (balance < 0) {
                balanceEl.style.color = 'var(--danger)';
            } else {
                balanceEl.style.color = 'var(--success)';
            }
        }
    },

    save() {
        DataManager.set(DataManager.STORAGE_KEYS.TRANSACTIONS, this.transactions);
    },

    showTransactionHistory() {
        const transactions = this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const content = transactions.length > 0 
            ? transactions.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <div style="font-weight: 500;">${SecurityUtils.escapeHtml(t.description)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${this.categories[t.category]?.icon || ''} ${this.categories[t.category]?.label || t.category} • ${t.date}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: ${t.category === 'income' ? 'var(--success)' : 'var(--text-primary)'};">
                            ${t.category === 'income' ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}
                        </div>
                        <button onclick="TransactionManager.deleteTransaction('${t.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.8rem;">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('')
            : '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No transactions yet</div>';

        ModalManager.create({
            id: 'transactions-modal',
            title: 'Transaction History',
            content: `<div style="max-height: 400px; overflow-y: auto;">${content}</div>`,
            size: 'large',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    },

    getCategoryBreakdown() {
        const expenses = this.transactions.filter(t => t.category !== 'income');
        const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const breakdown = {};
        
        expenses.forEach(t => {
            breakdown[t.category] = (breakdown[t.category] || 0) + Math.abs(t.amount);
        });

        return Object.entries(breakdown).map(([category, amount]) => ({
            category,
            amount,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
            ...this.categories[category]
        })).sort((a, b) => b.amount - a.amount);
    },

    showAnalytics() {
        const breakdown = this.getCategoryBreakdown();
        const { income, expenses, balance } = this.getBalance();

        const breakdownHtml = breakdown.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${item.icon}</span>
                    <span>${item.label}</span>
                </div>
                <div style="text-align: right;">
                    <div>$${item.amount.toFixed(2)}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${item.percentage}%</div>
                </div>
            </div>
        `).join('');

        const content = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Income</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">$${income.toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Expenses</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">$${expenses.toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Balance</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${balance >= 0 ? 'var(--success)' : 'var(--danger)'};">$${balance.toFixed(2)}</div>
                </div>
            </div>
            <h4 style="margin-bottom: 12px;">Expense Breakdown</h4>
            ${breakdownHtml}
        `;

        ModalManager.create({
            id: 'expense-analytics-modal',
            title: 'Expense Analytics',
            content,
            size: 'medium',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    }
};

// ===== AUTHENTICATION MODULE =====
const AuthManager = {
    currentUser: null,
    sessionToken: null,

    init() {
        // Load user from secure storage
        this.loadSession();
        
        // Handle auth state on page load
        this.handleAuthState();
        
        // Setup event listeners for forms
        this.setupFormListeners();
    },

    setupFormListeners() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Password strength checker
        const passwordInput = document.getElementById('signupPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }
    },

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (!strengthBar || !strengthText) return;
        
        let strength = 0;
        let color = 'var(--danger)';
        let text = 'Weak';
        
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]+/)) strength += 25;
        if (password.match(/[A-Z]+/)) strength += 25;
        if (password.match(/[0-9]+/)) strength += 25;
        if (password.match(/[$@#&!]+/)) strength += 25;
        
        strength = Math.min(strength, 100);
        
        if (strength <= 25) {
            color = 'var(--danger)';
            text = 'Weak';
        } else if (strength <= 50) {
            color = 'var(--warning)';
            text = 'Fair';
        } else if (strength <= 75) {
            color = 'var(--info)';
            text = 'Good';
        } else {
            color = 'var(--success)';
            text = 'Strong';
        }
        
        strengthBar.style.width = strength + '%';
        strengthBar.style.background = color;
        strengthText.textContent = text;
    },

    handleAuthState() {
        const authContainer = document.getElementById('authContainer');
        const mainDashboard = document.getElementById('mainDashboard');
        const userMenuContainer = document.getElementById('userMenuContainer');
        
        if (this.currentUser) {
            if (authContainer) authContainer.classList.add('hidden');
            if (mainDashboard) mainDashboard.classList.remove('hidden');
            if (userMenuContainer) userMenuContainer.style.display = 'block';
            
            this.updateWelcomeMessage();
            this.updateUserUI();
        } else {
            if (authContainer) authContainer.classList.remove('hidden');
            if (mainDashboard) mainDashboard.classList.add('hidden');
            if (userMenuContainer) userMenuContainer.style.display = 'none';
        }
    },

    updateUserUI() {
        if (!this.currentUser) return;
        
        const userNameEl = document.getElementById('userName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        const userAvatar = document.getElementById('userAvatar');
        const userIcon = document.getElementById('userIcon');
        
        if (userNameEl) userNameEl.textContent = this.currentUser.name || this.currentUser.email.split('@')[0];
        if (dropdownUserName) dropdownUserName.textContent = this.currentUser.name || this.currentUser.email;
        if (dropdownUserEmail) dropdownUserEmail.textContent = this.currentUser.email;
        
        if (this.currentUser.avatar && userAvatar) {
            userAvatar.src = this.currentUser.avatar;
            userAvatar.style.display = 'block';
            if (userIcon) userIcon.style.display = 'none';
        }
    },

    async handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const remember = document.getElementById('rememberMe')?.checked || false;

        if (!email || !password) {
            NotificationSystem.error('Please fill in all fields');
            return;
        }

        if (!SecurityUtils.validateEmail(email)) {
            NotificationSystem.error('Please enter a valid email address');
            return;
        }

        // Rate limiting check
        const rateLimitKey = `login_${email}`;
        if (!SecurityUtils.rateLimiter.isAllowed(rateLimitKey)) {
            NotificationSystem.error('Too many login attempts. Please wait a minute.');
            return;
        }

        try {
            // Get users from storage
            const users = DataManager.get(DataManager.STORAGE_KEYS.USER + '_list', []);
            
            // Find user by email
            const user = users.find(u => u.email === email);
            
            if (!user) {
                NotificationSystem.error('Invalid email or password');
                return;
            }

            // Verify password
            const passwordHash = SecurityUtils.simpleHash(password);
            if (user.passwordHash !== passwordHash) {
                NotificationSystem.error('Invalid email or password');
                return;
            }

            // Generate session token
            const token = SecurityUtils.generateToken(64);

            // Store user without password
            const { passwordHash: _, ...safeUser } = user;
            this.currentUser = safeUser;
            this.sessionToken = token;
            
            // Save session
            this.saveSession(safeUser, token, remember);
            
            // Update UI
            this.handleAuthState();
            
            // Clear form
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            
            NotificationSystem.success('Login successful! Welcome back!', 3000);
            
        } catch (error) {
            NotificationSystem.error(error.message || 'Login failed');
        }
    },

    async handleSignup(event) {
        event.preventDefault();

        const name = document.getElementById('signupName')?.value.trim();
        const email = document.getElementById('signupEmail')?.value.trim();
        const password = document.getElementById('signupPassword')?.value;
        const confirmPassword = document.getElementById('signupConfirmPassword')?.value;

        if (!name || !email || !password) {
            NotificationSystem.error('Please fill in all fields');
            return;
        }

        if (!SecurityUtils.validateEmail(email)) {
            NotificationSystem.error('Please enter a valid email address');
            return;
        }

        if (password !== confirmPassword) {
            NotificationSystem.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            NotificationSystem.error('Password must be at least 6 characters');
            return;
        }

        // Rate limiting
        const rateLimitKey = `signup_${email}`;
        if (!SecurityUtils.rateLimiter.isAllowed(rateLimitKey)) {
            NotificationSystem.error('Too many signup attempts. Please wait.');
            return;
        }

        try {
            const users = DataManager.get(DataManager.STORAGE_KEYS.USER + '_list', []);
            
            // Check if email exists
            if (users.some(u => u.email === email)) {
                NotificationSystem.error('Email already registered');
                return;
            }

            // Hash password
            const passwordHash = SecurityUtils.simpleHash(password);

            // Create new user
            const newUser = {
                id: `user_${Date.now()}_${SecurityUtils.generateToken(8)}`,
                email: email,
                name: SecurityUtils.sanitizeInput(name),
                passwordHash: passwordHash,
                createdAt: new Date().toISOString()
            };

            // Save to storage
            users.push(newUser);
            DataManager.set(DataManager.STORAGE_KEYS.USER + '_list', users);

            // Generate token
            const token = SecurityUtils.generateToken(64);

            // Store user without password
            const { passwordHash: _, ...safeUser } = newUser;
            this.currentUser = safeUser;
            this.sessionToken = token;
            
            // Save session
            this.saveSession(safeUser, token, true);
            
            // Update UI
            this.handleAuthState();
            
            // Clear forms
            document.getElementById('signupName').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupConfirmPassword').value = '';
            
            NotificationSystem.success('Account created! Welcome to LifeOS!', 3000);
            
        } catch (error) {
            NotificationSystem.error(error.message || 'Registration failed');
        }
    },

    saveSession(user, token, remember = false) {
        const sessionData = {
            user: user,
            token: token,
            expiresAt: Date.now() + (remember ? 30 : 7) * 24 * 60 * 60 * 1000 // 30 or 7 days
        };
        
        SecurityUtils.secureStorage.set(DataManager.STORAGE_KEYS.USER, sessionData);
    },

    loadSession() {
        const session = SecurityUtils.secureStorage.get(DataManager.STORAGE_KEYS.USER);
        
        if (session) {
            // Check if session is expired
            if (session.expiresAt && Date.now() > session.expiresAt) {
                this.logout();
                return false;
            }
            
            this.currentUser = session.user;
            this.sessionToken = session.token;
            return true;
        }
        
        return false;
    },

    logout() {
        this.currentUser = null;
        this.sessionToken = null;
        
        SecurityUtils.secureStorage.remove(DataManager.STORAGE_KEYS.USER);
        
        this.handleAuthState();
        
        NotificationSystem.info('Logged out successfully');
    },

    handleLogout() {
        this.logout();
    },

    toggleUserMenu(event) {
        event?.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        if (!dropdown) return;
        
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    },

    closeUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    },

    updateWelcomeMessage() {
        if (this.currentUser) {
            const welcomeEl = document.querySelector('[data-i18n="welcomeMessage"]');
            if (welcomeEl) {
                const lang = localStorage.getItem('language') || 'en';
                welcomeEl.textContent = `${translations[lang].welcomeMessage}, ${this.currentUser.name}! 👋`;
            }
        }
    },

    viewProfile() {
        if (!this.currentUser) return;
        
        // Get user stats
        const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
        const completedTasks = tasks.filter(t => t.completed).length;
        const transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
        const moods = DataManager.get(DataManager.STORAGE_KEYS.MOODS, []);
        
        ModalManager.create({
            id: 'profile-modal',
            title: 'My Profile',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 80px; margin-bottom: 20px;">
                        <i class="fas fa-user-circle" style="color: var(--accent-primary);"></i>
                    </div>
                    <h3 style="margin-bottom: 5px;">${SecurityUtils.escapeHtml(this.currentUser.name)}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 5px;">${SecurityUtils.escapeHtml(this.currentUser.email)}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">
                        <i class="fas fa-calendar"></i> Member since: ${this.currentUser.createdAt ? new Date(this.currentUser.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    
                    <!-- User Stats -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; padding: 15px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: 700; color: var(--accent-primary);">${tasks.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Total Tasks</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${completedTasks}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Completed</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${moods.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Mood Entries</div>
                        </div>
                    </div>
                </div>
            `,
            size: 'medium',
            buttons: [{
                id: 'close',
                text: 'Close',
                primary: true,
                onClick: () => ModalManager.close('profile-modal')
            }]
        });
    },

    viewSettings() {
        const currentLang = localStorage.getItem('language') || 'en';
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const notifications = localStorage.getItem('notifications_enabled') !== 'false';
        
        ModalManager.create({
            id: 'settings-modal',
            title: 'Settings',
            content: `
                <div style="display: flex; flex-direction: column; gap: 16px; padding: 10px;">
                    <!-- Theme Settings -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-${currentTheme === 'dark' ? 'moon' : 'sun'}" style="color: var(--accent-primary); font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">Theme</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Current: ${currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                            </div>
                        </div>
                        <button onclick="App.toggleTheme(); setTimeout(() => { ModalManager.close('settings-modal'); AuthManager.viewSettings(); }, 300);" class="modal-btn" style="padding: 8px 16px; background: var(--bg-tertiary); border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-toggle-on"></i> Toggle
                        </button>
                    </div>
                    
                    <!-- Language Settings -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-globe" style="color: var(--accent-primary); font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">Language</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Select your preferred language</div>
                            </div>
                        </div>
                        <select id="settingsLanguage" onchange="AuthManager.changeSettingsLanguage(this.value)" style="padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); min-width: 120px;">
                            <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
                            <option value="ur" ${currentLang === 'ur' ? 'selected' : ''}>اردو</option>
                            <option value="ar" ${currentLang === 'ar' ? 'selected' : ''}>عربي</option>
                            <option value="es" ${currentLang === 'es' ? 'selected' : ''}>Español</option>
                        </select>
                    </div>
                    
                    <!-- Notifications Settings -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-bell" style="color: var(--accent-primary); font-size: 20px;"></i>
                            <div>
                                <div style="font-weight: 600;">Notifications</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Task reminders & alerts</div>
                            </div>
                        </div>
                        <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                            <input type="checkbox" id="notificationsToggle" ${notifications ? 'checked' : ''} onchange="AuthManager.toggleNotifications(this.checked)" style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${notifications ? 'var(--accent-primary)' : 'var(--bg-tertiary)'}; transition: .4s; border-radius: 24px;"></span>
                            <span style="position: absolute; content: ''; height: 20px; width: 20px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; transform: ${notifications ? 'translateX(26px)' : 'translateX(0)'};"></span>
                        </label>
                    </div>
                    
                    <!-- Data Management -->
                    <div style="padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                        <h4 style="margin-bottom: 15px; color: var(--text-primary);"><i class="fas fa-database"></i> Data Management</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="App.exportData()" style="flex: 1; min-width: 120px; padding: 10px; background: var(--bg-tertiary); border: none; border-radius: 6px; color: var(--text-primary); cursor: pointer;">
                                <i class="fas fa-download"></i> Export Data
                            </button>
                            <button onclick="document.getElementById('importFile').click()" style="flex: 1; min-width: 120px; padding: 10px; background: var(--bg-tertiary); border: none; border-radius: 6px; color: var(--text-primary); cursor: pointer;">
                                <i class="fas fa-upload"></i> Import Data
                            </button>
                            <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importDataFromFile(event)">
                        </div>
                    </div>
                    
                    <!-- About Section -->
                    <div style="padding: 16px; background: var(--bg-primary); border-radius: 12px; text-align: center;">
                        <h4 style="margin-bottom: 10px; color: var(--text-primary);">LifeOS</h4>
                        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">Version 2.0.0</p>
                        <p style="font-size: 11px; color: var(--text-secondary);">AI-Powered Life Manager</p>
                    </div>
                </div>
            `,
            size: 'medium',
            buttons: [{
                id: 'close',
                text: 'Close',
                primary: true,
                onClick: () => ModalManager.close('settings-modal')
            }]
        });
    },

    changeSettingsLanguage(lang) {
        changeLanguage(lang);
        NotificationSystem.success(`Language changed to ${lang === 'en' ? 'English' : lang === 'ur' ? 'اردو' : lang === 'ar' ? 'عربي' : 'Español'}`);
    },

    toggleNotifications(enabled) {
        localStorage.setItem('notifications_enabled', enabled);
        if (enabled) {
            NotificationSystem.success('Notifications enabled');
        } else {
            NotificationSystem.info('Notifications disabled');
        }
    }
};

// ===== MAIN APPLICATION MODULE =====
const App = {
    initialized: false,
    pwaDeferredPrompt: null,
    theme: 'dark',
    currentLanguage: 'en',

    init() {
        if (this.initialized) return;
        
        // Initialize all modules
        DataManager.initialize();
        NotificationSystem.init();
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize components
        this.initializeComponents();
        this.initializeEventListeners();
        this.initializePWA();
        
        // Initialize auth
        AuthManager.init();
        
        // Initialize charts after auth
        setTimeout(() => {
            ChartManager.init();
        }, 100);
        
        this.initialized = true;
        console.log('LifeOS initialized');
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
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
        NotificationSystem.success(`Theme changed to ${newTheme}`);
    },

    initializeComponents() {
        // Time zones
        this.updateTimeZones();
        
        // Calendar
        if (typeof generateCalendar === 'function') {
            generateCalendar();
        }
        
        // Cards animation
        this.animateCards();
    },

    initializeEventListeners() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleNavigation());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Handle online/offline status
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOfflineStatus());
        
        // Listen for data changes
        window.addEventListener('dataChanged', (e) => {
            console.log('Data changed:', e.detail.key);
        });

        // Click outside for dropdowns
        document.addEventListener('click', (event) => {
            const dropdown = document.getElementById('userDropdown');
            const userMenuBtn = document.getElementById('userMenuBtn');
            
            if (dropdown && dropdown.style.display === 'block') {
                if (!dropdown.contains(event.target) && !userMenuBtn.contains(event.target)) {
                    dropdown.style.display = 'none';
                }
            }
            
            const quickDropdown = document.getElementById('quickActionsDropdown');
            const quickBtn = document.querySelector('.quick-actions-btn');
            
            if (quickDropdown && quickDropdown.style.display === 'block') {
                if (!quickDropdown.contains(event.target) && !quickBtn.contains(event.target)) {
                    quickDropdown.style.display = 'none';
                }
            }
            
            const notifDropdown = document.getElementById('notificationsDropdown');
            const notifBtn = document.querySelector('.notifications-btn');
            
            if (notifDropdown && notifDropdown.style.display === 'block') {
                if (!notifDropdown.contains(event.target) && !notifBtn.contains(event.target)) {
                    notifDropdown.style.display = 'none';
                }
            }
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
            <button class="modal-btn" onclick="App.addTimezoneToDisplay('${tz.code}', '${tz.name}', '${tz.zone}')" style="padding: 10px; margin: 5px; background: var(--bg-tertiary); border: none; border-radius: 6px; color: var(--text-primary); cursor: pointer;">
                ${tz.code} ${tz.name}
            </button>
        `).join('');

        ModalManager.create({
            id: 'add-timezone-modal',
            title: 'Add Timezone',
            content: `<div style="display: flex; flex-wrap: wrap; gap: 8px;">${content}</div>`,
            size: 'small',
            buttons: [{ id: 'close', text: 'Close', primary: true, onClick: () => ModalManager.close('add-timezone-modal') }]
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
            <div class="timezone-date"></div>
        `;
        grid.appendChild(newTimezone);

        // Update time for new timezone
        const updateNewTime = () => {
            const timeEl = newTimezone.querySelector('.timezone-time');
            const dateEl = newTimezone.querySelector('.timezone-date');
            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString('en-US', { 
                    timeZone: zone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                dateEl.textContent = new Date().toLocaleDateString('en-US', { 
                    timeZone: zone,
                    month: 'short',
                    day: 'numeric'
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
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    },

    // ===== NAVIGATION =====
    handleNavigation() {
        // Get current hash (default to dashboard)
        let hash = window.location.hash.slice(1) || 'dashboard';
        
        // Validate hash against allowed pages
        const allowedPages = ['dashboard', 'tasks', 'analytics', 'calendar', 'expenses', 'team', 'ai-assistant'];
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
            'expenses': 'Expenses',
            'team': 'Team',
            'ai-assistant': 'AI Assistant'
        };
        
        // Update welcome message based on page
        const welcomeSection = document.querySelector('.welcome-section h1');
        if (welcomeSection && AuthManager.currentUser) {
            const lang = localStorage.getItem('language') || 'en';
            welcomeSection.textContent = `${translations[lang].welcomeMessage}, ${AuthManager.currentUser.name}! 👋`;
        }
    },
    
    showDashboard() {
        window.location.hash = 'dashboard';
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
    },
    
    showTasks() {
        window.location.hash = 'tasks';
        const authContainer = document.getElementById('authContainer');
        const mainDashboard = document.getElementById('mainDashboard');
        if (authContainer) authContainer.classList.add('hidden');
        if (mainDashboard) mainDashboard.classList.remove('hidden');
        this.showPage('tasks');
        // Update active nav
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#tasks') link.classList.add('active');
        });
    },
    
    showAnalytics() {
        window.location.hash = 'analytics';
        const authContainer = document.getElementById('authContainer');
        const mainDashboard = document.getElementById('mainDashboard');
        if (authContainer) authContainer.classList.add('hidden');
        if (mainDashboard) mainDashboard.classList.remove('hidden');
        this.showPage('analytics');
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#analytics') link.classList.add('active');
        });
    },
    
    showCalendar() {
        window.location.hash = 'calendar';
        const authContainer = document.getElementById('authContainer');
        const mainDashboard = document.getElementById('mainDashboard');
        if (authContainer) authContainer.classList.add('hidden');
        if (mainDashboard) mainDashboard.classList.remove('hidden');
        this.showPage('calendar');
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#calendar') link.classList.add('active');
        });
    },
    
    showExpenses() {
        window.location.hash = 'expenses';
        const authContainer = document.getElementById('authContainer');
        const mainDashboard = document.getElementById('mainDashboard');
        if (authContainer) authContainer.classList.add('hidden');
        if (mainDashboard) mainDashboard.classList.remove('hidden');
        this.showPage('expenses');
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#expenses') link.classList.add('active');
        });
    },
    
    showTeam() {
        window.location.hash = 'team';
        ModalManager.create({
            id: 'team-modal',
            title: 'Team Collaboration',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-users" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 20px;"></i>
                    <h3>Team Collaboration Coming Soon!</h3>
                    <p style="color: var(--text-secondary); margin-top: 10px;">Work together with your team members on shared tasks and projects.</p>
                </div>
            `,
            size: 'medium',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    },
    
    showAIAssistant() {
        window.location.hash = 'ai-assistant';
        ModalManager.create({
            id: 'ai-modal',
            title: 'AI Assistant',
            content: `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-robot" style="font-size: 48px; color: var(--accent-primary); margin-bottom: 20px;"></i>
                    <h3>AI Assistant Coming Soon!</h3>
                    <p style="color: var(--text-secondary); margin-top: 10px;">Get intelligent suggestions and insights powered by AI.</p>
                </div>
            `,
            size: 'medium',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
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
                        TaskManager.render();
                        TransactionManager.updateBalance();
                        updateProductivityStats();
                        updateStreak();
                        updateGamification();
                        ChartManager.loadData();
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

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration.scope);
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed:', error);
                });
        }
    }
};

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
            ${taskCount > 0 ? `<span class="task-indicator" style="position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; background: var(--accent-primary); color: white; border-radius: 50%; font-size: 10px; display: flex; align-items: center; justify-content: center;">${taskCount}</span>` : ''}
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
        .filter(t => !t.completed && t.deadline && t.deadline >= today)
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        upcomingContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No upcoming tasks</div>';
        return;
    }
    
    upcomingContainer.innerHTML = upcoming.map(task => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--border-color);">
            <span>${SecurityUtils.escapeHtml(task.title)}</span>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${new Date(task.deadline).toLocaleDateString()}</span>
        </div>
    `).join('');
}

// ===== PRODUCTIVITY FUNCTIONS =====
function updateProductivityStats() {
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const rateEl = document.getElementById('completionRate');
    if (rateEl) rateEl.textContent = `${rate}%`;
    
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
    
    // Calculate streak
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

function updateGamification() {
    const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
    const completedCount = tasks.filter(t => t.completed).length;
    
    // Calculate XP: 10 XP per completed task
    const xp = completedCount * 10;
    
    // Calculate level: level up every 100 XP
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;
    
    // Update DOM
    const levelEl = document.getElementById('userLevel');
    const xpEl = document.getElementById('userXP');
    const progressEl = document.getElementById('xpProgressBar');
    
    if (levelEl) levelEl.textContent = level;
    if (xpEl) xpEl.textContent = `${xpInLevel}/100 XP`;
    if (progressEl) progressEl.style.width = `${xpInLevel}%`;
}

// ===== GLOBAL FUNCTION ASSIGNMENTS =====
window.SecurityUtils = SecurityUtils;
window.DataManager = DataManager;
window.NotificationSystem = NotificationSystem;
window.ModalManager = ModalManager;
window.PerformanceUtils = PerformanceUtils;
window.ChartManager = ChartManager;
window.MoodManager = MoodManager;
window.TaskManager = TaskManager;
window.TransactionManager = TransactionManager;
window.AuthManager = AuthManager;
window.App = App;

// Global functions for HTML onclick handlers
window.logMood = function(mood) {
    const journal = document.getElementById('journalEntry')?.value || '';
    const gratitude = document.getElementById('gratitudeInput')?.value || '';
    MoodManager.logMood(mood, journal, gratitude);
    
    // Clear inputs
    const journalInput = document.getElementById('journalEntry');
    const gratitudeInput = document.getElementById('gratitudeInput');
    if (journalInput) journalInput.value = '';
    if (gratitudeInput) gratitudeInput.value = '';
};

window.addTransaction = function() {
    const desc = document.getElementById('expenseDesc');
    const amount = document.getElementById('expenseAmount');
    const category = document.getElementById('expenseCategory');

    if (desc && amount && category) {
        const success = TransactionManager.addTransaction(
            desc.value,
            amount.value,
            category.value
        );

        if (success) {
            desc.value = '';
            amount.value = '';
        }
    }
};

window.toggleTheme = () => App.toggleTheme();
window.addTimezone = () => App.addTimezone();
window.installPWA = () => App.installPWA();
window.dismissInstall = () => App.dismissInstall();
window.exportData = () => App.exportData();
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
                TaskManager.render();
                TransactionManager.updateBalance();
                updateProductivityStats();
                updateStreak();
                updateGamification();
                ChartManager.loadData();
            } else {
                NotificationSystem.warning('Some data could not be imported');
            }
            
            ModalManager.close('settings-modal');
        } catch (error) {
            NotificationSystem.error('Invalid file format');
        }
    };
    reader.readAsText(file);
};

// Quick actions
window.toggleQuickActions = function() {
    const dropdown = document.getElementById('quickActionsDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
};

window.quickAddTask = function() {
    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.focus();
        toggleQuickActions();
    }
};

window.quickLogMood = function() {
    document.querySelector('.mood-btn')?.scrollIntoView({ behavior: 'smooth' });
    toggleQuickActions();
};

window.quickAddExpense = function() {
    const expenseDesc = document.getElementById('expenseDesc');
    if (expenseDesc) {
        expenseDesc.focus();
        toggleQuickActions();
    }
};

// Notifications
window.toggleNotifications = function() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
};

window.markAllNotificationsRead = function() {
    document.getElementById('notificationBadge').style.display = 'none';
    NotificationSystem.success('All notifications marked as read');
};

// Change language
window.changeLanguage = changeLanguage;

// Calendar functions
window.generateCalendar = generateCalendar;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.showTasksForDate = showTasksForDate;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Initialize service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        App.registerServiceWorker();
    });
}