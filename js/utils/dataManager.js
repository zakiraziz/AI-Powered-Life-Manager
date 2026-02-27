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
            
            // Validate data structure
            if (this.isValidData(parsed)) {
                return parsed;
            }
            
            console.warn(`Data validation failed for key: ${key}`);
            return defaultValue;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return defaultValue;
        }
    },

    // Generic set with validation
    set(key, value) {
        try {
            // Validate before saving
            if (!this.isValidData(value)) {
                console.error(`Invalid data for key: ${key}`);
                return false;
            }

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

    // Basic data validation
    isValidData(data) {
        // Allow null and primitives
        if (data === null || data === undefined) return true;
        
        // Check for reasonable data types
        if (typeof data === 'function') return false;
        
        // For objects and arrays, check for circular references
        if (typeof data === 'object') {
            try {
                JSON.stringify(data);
                return true;
            } catch (e) {
                return false;
            }
        }
        
        return true;
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
    },

    // Get storage usage info
    getStorageInfo() {
        let total = 0;
        const details = [];
        
        Object.values(this.STORAGE_KEYS).forEach(key => {
            const data = localStorage.getItem(key);
            const size = data ? data.length * 2 : 0; // Approximate bytes
            total += size;
            details.push({ key, size });
        });

        return {
            total,
            formatted: this.formatBytes(total),
            details
        };
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// Initialize on load
DataManager.initialize();

// Export globally
window.DataManager = DataManager;
