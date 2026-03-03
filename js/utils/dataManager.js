/**
 * Central Data Manager Module
 * Handles all data persistence with validation and events
 */

const DataManager = (function() {
    'use strict';
    
    // Storage keys enumeration
    const STORAGE_KEYS = {
        USER: 'lifeos_user',
        USERS: 'lifeos_users',
        TASKS: 'lifeos_tasks',
        TRANSACTIONS: 'lifeos_transactions',
        MOODS: 'lifeos_moods',
        HABITS: 'lifeos_habits',
        NOTES: 'lifeos_notes',
        POMODORO_SETTINGS: 'lifeos_pomodoro_settings',
        POMODORO_SESSIONS: 'lifeos_pomodoro_sessions',
        WATER_TODAY: 'lifeos_water_today',
        WATER_GOAL: 'lifeos_water_goal',
        WATER_HISTORY: 'lifeos_water_history',
        ACHIEVEMENTS: 'lifeos_achievements',
        PRODUCTIVITY: 'lifeos_productivity',
        PREFERENCES: 'lifeos_preferences',
        CHAT_HISTORY: 'lifeos_chat_history'
    };
    
    /**
     * Get data from storage with validation
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Stored data or default
     */
    const get = (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            if (!data) return defaultValue;
            
            const parsed = JSON.parse(data);
            
            // Validate data structure
            if (isValidData(parsed)) {
                return parsed;
            }
            
            console.warn(`Data validation failed for key: ${key}`);
            return defaultValue;
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return defaultValue;
        }
    };
    
    /**
     * Set data to storage with validation
     * @param {string} key - Storage key
     * @param {*} value - Data to store
     * @returns {boolean} Success status
     */
    const set = (key, value) => {
        try {
            // Validate before saving
            if (!isValidData(value)) {
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
    };
    
    /**
     * Remove data from storage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    const remove = (key) => {
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
    };
    
    /**
     * Validate data structure
     * @param {*} data - Data to validate
     * @returns {boolean} True if valid
     */
    const isValidData = (data) => {
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
    };
    
    /**
     * Initialize with default values
     */
    const initialize = () => {
        const defaults = {
            [STORAGE_KEYS.TASKS]: [],
            [STORAGE_KEYS.TRANSACTIONS]: [],
            [STORAGE_KEYS.MOODS]: [],
            [STORAGE_KEYS.HABITS]: getDefaultHabits(),
            [STORAGE_KEYS.NOTES]: [],
            [STORAGE_KEYS.ACHIEVEMENTS]: getDefaultAchievements(),
            [STORAGE_KEYS.PRODUCTIVITY]: getDefaultProductivity(),
            [STORAGE_KEYS.WATER_GOAL]: 8,
            [STORAGE_KEYS.CHAT_HISTORY]: []
        };
        
        Object.entries(defaults).forEach(([key, value]) => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        });
        
        console.log('DataManager initialized');
    };
    
    /**
     * Get default habits
     * @returns {Array} Default habits
     */
    const getDefaultHabits = () => {
        return [
            { 
                id: 'habit_exercise', 
                name: 'Exercise', 
                icon: '🏃', 
                target: 1, 
                unit: 'time',
                completions: {},
                streak: 0,
                bestStreak: 0,
                createdAt: new Date().toISOString()
            },
            { 
                id: 'habit_reading', 
                name: 'Reading', 
                icon: '📖', 
                target: 30, 
                unit: 'minutes',
                completions: {},
                streak: 0,
                bestStreak: 0,
                createdAt: new Date().toISOString()
            },
            { 
                id: 'habit_meditation', 
                name: 'Meditation', 
                icon: '🧘', 
                target: 15, 
                unit: 'minutes',
                completions: {},
                streak: 0,
                bestStreak: 0,
                createdAt: new Date().toISOString()
            },
            { 
                id: 'habit_water', 
                name: 'Water', 
                icon: '💧', 
                target: 8, 
                unit: 'glasses',
                completions: {},
                streak: 0,
                bestStreak: 0,
                createdAt: new Date().toISOString()
            },
            { 
                id: 'habit_sleep', 
                name: 'Sleep', 
                icon: '😴', 
                target: 8, 
                unit: 'hours',
                completions: {},
                streak: 0,
                bestStreak: 0,
                createdAt: new Date().toISOString()
            }
        ];
    };
    
    /**
     * Get default achievements
     * @returns {Array} Default achievements
     */
    const getDefaultAchievements = () => {
        return [
            { id: 'streak_3', title: 'Getting Started', description: 'Complete 3 tasks in a row', icon: '🌱', xp: 50, unlocked: false },
            { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', xp: 100, unlocked: false },
            { id: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🏆', xp: 500, unlocked: false },
            { id: 'tasks_10', title: 'Task Tackler', description: 'Complete 10 tasks', icon: '✅', xp: 75, unlocked: false },
            { id: 'tasks_100', title: 'Productivity Pro', description: 'Complete 100 tasks', icon: '💪', xp: 250, unlocked: false },
            { id: 'mood_7', title: 'Mood Tracker', description: 'Log mood for 7 days', icon: '😊', xp: 75, unlocked: false },
            { id: 'expense_100', title: 'Money Mindful', description: 'Track 100 transactions', icon: '💰', xp: 100, unlocked: false },
            { id: 'habit_30', title: 'Habit Hero', description: 'Complete 30 days of habits', icon: '🎯', xp: 200, unlocked: false }
        ];
    };
    
    /**
     * Get default productivity stats
     * @returns {Object} Default productivity
     */
    const getDefaultProductivity = () => {
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
    };
    
    /**
     * Export all data
     * @returns {Object} All stored data
     */
    const exportAll = () => {
        const data = {};
        Object.values(STORAGE_KEYS).forEach(key => {
            data[key] = get(key);
        });
        return {
            ...data,
            exportedAt: new Date().toISOString(),
            version: '3.0.0'
        };
    };
    
    /**
     * Import data with validation
     * @param {Object} data - Data to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    const importData = (data, options = {}) => {
        const { merge = true } = options;
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid import data');
        }
        
        const results = { success: [], failed: [] };
        
        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
            if (data[storageKey] !== undefined) {
                try {
                    if (merge) {
                        // Merge with existing data
                        const existing = get(storageKey, []);
                        const imported = Array.isArray(existing) 
                            ? [...existing, ...data[storageKey]] 
                            : { ...existing, ...data[storageKey] };
                        set(storageKey, imported);
                    } else {
                        // Replace entirely
                        set(storageKey, data[storageKey]);
                    }
                    results.success.push(key);
                } catch (error) {
                    results.failed.push(key);
                }
            }
        });
        
        return results;
    };
    
    /**
     * Clear all data
     */
    const clearAll = () => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        initialize(); // Reinitialize with defaults
    };
    
    /**
     * Get storage usage information
     * @returns {Object} Storage info
     */
    const getStorageInfo = () => {
        let total = 0;
        const details = [];
        
        Object.values(STORAGE_KEYS).forEach(key => {
            const data = localStorage.getItem(key);
            const size = data ? data.length * 2 : 0; // Approximate bytes
            total += size;
            details.push({ key, size, items: data ? JSON.parse(data).length : 0 });
        });
        
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        return {
            total,
            formatted: formatBytes(total),
            details
        };
    };
    
    // Public API
    return {
        STORAGE_KEYS,
        get,
        set,
        remove,
        initialize,
        exportAll,
        importData,
        clearAll,
        getStorageInfo
    };
})();

// Initialize on load
DataManager.initialize();

// Export globally
window.DataManager = DataManager;