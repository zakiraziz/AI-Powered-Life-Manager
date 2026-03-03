// ===== waterTracker.js - Water Intake Tracking Module =====

const WaterTracker = {
    dailyGoal: 8, // glasses per day
    currentIntake: 0,
    history: [],
    reminderInterval: null,
    
    // Glass sizes in ml
    glassSizes: [
        { name: 'Small Glass', size: 150 },
        { name: 'Medium Glass', size: 250 },
        { name: 'Large Glass', size: 350 },
        { name: 'Bottle', size: 500 },
        { name: 'Large Bottle', size: 1000 }
    ],

    init() {
        this.loadData();
        this.render();
        this.setupEventListeners();
        this.startReminder();
        console.log('[WaterTracker] Initialized');
    },

    loadData() {
        const today = new Date().toISOString().split('T')[0];
        
        // Load daily goal
        const storedGoal = DataManager.get(DataManager.STORAGE_KEYS.WATER_GOAL, null);
        if (storedGoal) {
            this.dailyGoal = storedGoal;
        }
        
        // Load today's intake
        const todayData = DataManager.get(DataManager.STORAGE_KEYS.WATER_TODAY, null);
        if (todayData && todayData.date === today) {
            this.currentIntake = todayData.intake || 0;
        } else {
            this.currentIntake = 0;
        }
        
        // Load history
        this.history = DataManager.get(DataManager.STORAGE_KEYS.WATER_HISTORY, []);
    },

    saveData() {
        const today = new Date().toISOString().split('T')[0];
        
        // Save today's intake
        DataManager.set(DataManager.STORAGE_KEYS.WATER_TODAY, {
            date: today,
            intake: this.currentIntake
        });
        
        // Save goal
        DataManager.set(DataManager.STORAGE_KEYS.WATER_GOAL, this.dailyGoal);
        
        // Update history
        this.updateHistory();
        
        // Render
        this.render();
    },

    updateHistory() {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if today's entry exists
        const todayEntry = this.history.find(function(h) {
            return h.date === today;
        });
        
        if (todayEntry) {
            todayEntry.intake = this.currentIntake;
            todayEntry.goal = this.dailyGoal;
            todayEntry.percentage = Math.round((this.currentIntake / this.dailyGoal) * 100);
        } else {
            this.history.push({
                date: today,
                intake: this.currentIntake,
                goal: this.dailyGoal,
                percentage: Math.round((this.currentIntake / this.dailyGoal) * 100)
            });
        }
        
        // Keep only last 30 days
        if (this.history.length > 30) {
            this.history = this.history.slice(-30);
        }
        
        DataManager.set(DataManager.STORAGE_KEYS.WATER_HISTORY, this.history);
    },

    addGlass(size) {
        size = size || 250; // Default medium glass
        
        this.currentIntake += 1;
        this.saveData();
        
        // Check if goal reached
        if (this.currentIntake >= this.dailyGoal && this.currentIntake - 1 < this.dailyGoal) {
            NotificationSystem.success('Daily goal reached! 💧🎉', 3000);
        } else {
            NotificationSystem.info('+' + (size / 250) + ' glass(es) added!', 1500);
        }
    },

    removeGlass() {
        if (this.currentIntake > 0) {
            this.currentIntake--;
            this.saveData();
            NotificationSystem.info('Removed one glass', 1500);
        }
    },

    setGoal(goal) {
        goal = parseInt(goal) || 8;
        if (goal < 1) goal = 1;
        if (goal > 20) goal = 20;
        
        this.dailyGoal = goal;
        this.saveData();
        NotificationSystem.success('Daily goal updated to ' + goal + ' glasses!', 2000);
    },

    resetToday() {
        ModalManager.confirm('Reset today\'s water intake?').then(function(confirmed) {
            if (confirmed) {
                WaterTracker.currentIntake = 0;
                WaterTracker.saveData();
                NotificationSystem.info('Water intake reset', 2000);
            }
        });
    },

    getProgress() {
        return Math.min(100, Math.round((this.currentIntake / this.dailyGoal) * 100));
    },

    getRemaining() {
        return Math.max(0, this.dailyGoal - this.currentIntake);
    },

    getWeeklyStats() {
        const today = new Date();
        const weekData = [];
        
        for (var i = 6; i >= 0; i--) {
            var date = new Date(today);
            date.setDate(date.getDate() - i);
            var dateStr = date.toISOString().split('T')[0];
            
            var dayEntry = this.history.find(function(h) {
                return h.date === dateStr;
            });
            
            weekData.push({
                day: date.toLocaleDateString('en', { weekday: 'short' }),
                intake: dayEntry ? dayEntry.intake : 0,
                goal: dayEntry ? dayEntry.goal : this.dailyGoal,
                percentage: dayEntry ? dayEntry.percentage : 0
            });
        }
        
        return weekData;
    },

    getStreak() {
        if (this.history.length === 0) return 0;
        
        var streak = 0;
        var today = new Date();
        
        // Sort history by date descending
        var sortedHistory = this.history.slice().sort(function(a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        
        for (var i = 0; i < sortedHistory.length; i++) {
            var entry = sortedHistory[i];
            var entryDate = new Date(entry.date);
            var expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);
            
            // Check if dates match (ignoring time)
            if (entryDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                if (entry.percentage >= 100) {
                    streak++;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        return streak;
    },

    render() {
        // Update water count display
        var countEl = document.getElementById('waterCount');
        if (countEl) {
            countEl.textContent = this.currentIntake;
        }
        
        // Update water goal display
        var goalEl = document.getElementById('waterGoal');
        if (goalEl) {
            goalEl.textContent = '/' + this.dailyGoal;
        }
        
        // Update progress percentage
        var percentEl = document.getElementById('waterPercent');
        if (percentEl) {
            percentEl.textContent = this.getProgress() + '%';
        }
        
        // Update progress bar
        var progressBar = document.getElementById('waterProgressBar');
        if (progressBar) {
            progressBar.style.width = this.getProgress() + '%';
        }
        
        // Update remaining
        var remainingEl = document.getElementById('waterRemaining');
        if (remainingEl) {
            remainingEl.textContent = this.getRemaining() + ' glasses to go';
        }
        
        // Update streak
        var streakEl = document.getElementById('waterStreak');
        if (streakEl) {
            streakEl.textContent = '🔥 ' + this.getStreak() + ' day streak';
        }
        
        // Update visualization
        this.renderVisual();
    },

    renderVisual() {
        var container = document.getElementById('waterVisual');
        if (!container) return;
        
        var filled = this.currentIntake;
        var total = this.dailyGoal;
        var html = '';
        
        // Create glass representations
        for (var i = 0; i < total; i++) {
            var isFilled = i < filled;
            html += '<div class="water-glass ' + (isFilled ? 'filled' : '') + '" ' +
                    'style="background: ' + (isFilled ? 'var(--info)' : 'var(--bg-tertiary)') + ';">' +
                    '<i class="fas fa-tint"></i></div>';
        }
        
        container.innerHTML = html;
    },

    openSettings() {
        var modal = document.getElementById('waterSettingsModal');
        if (!modal) return;
        
        var goalInput = document.getElementById('waterGoalInput');
        if (goalInput) {
            goalInput.value = this.dailyGoal;
        }
        
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    },

    closeSettings() {
        var modal = document.getElementById('waterSettingsModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    saveSettings() {
        var goalInput = document.getElementById('waterGoalInput');
        if (goalInput) {
            this.setGoal(goalInput.value);
        }
        this.closeSettings();
    },

    startReminder() {
        // Check every hour
        this.reminderInterval = setInterval(function() {
            var hour = new Date().getHours();
            // Remind between 8 AM and 10 PM
            if (hour >= 8 && hour <= 22) {
                if (WaterTracker.currentIntake < WaterTracker.dailyGoal) {
                    // Show notification
                    if (Notification.permission === 'granted') {
                        new Notification('LifeOS Water Reminder', {
                            body: 'Don\'t forget to drink water! You have ' + WaterTracker.getRemaining() + ' glasses to go.',
                            icon: 'assets/icons/icon-192x192.png'
                        });
                    }
                }
            }
        }, 3600000); // Every hour
    },

    stopReminder() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    setupEventListeners: function() {
        document.addEventListener('DOMContentLoaded', function() {
            // Add water buttons
            var addSmallBtn = document.getElementById('addWaterSmall');
            var addMediumBtn = document.getElementById('addWaterMedium');
            var addLargeBtn = document.getElementById('addWaterLarge');
            var addBottleBtn = document.getElementById('addWaterBottle');
            
            if (addSmallBtn) addSmallBtn.addEventListener('click', function() { WaterTracker.addGlass(150); });
            if (addMediumBtn) addMediumBtn.addEventListener('click', function() { WaterTracker.addGlass(250); });
            if (addLargeBtn) addLargeBtn.addEventListener('click', function() { WaterTracker.addGlass(350); });
            if (addBottleBtn) addBottleBtn.addEventListener('click', function() { WaterTracker.addGlass(500); });
            
            // Remove water
            var removeBtn = document.getElementById('removeWater');
            if (removeBtn) removeBtn.addEventListener('click', function() { WaterTracker.removeGlass(); });
            
            // Reset
            var resetBtn = document.getElementById('resetWater');
            if (resetBtn) resetBtn.addEventListener('click', function() { WaterTracker.resetToday(); });
            
            // Settings
            var settingsBtn = document.getElementById('waterSettingsBtn');
            var saveSettingsBtn = document.getElementById('saveWaterSettings');
            var closeSettingsBtn = document.getElementById('closeWaterSettings');
            
            if (settingsBtn) settingsBtn.addEventListener('click', function() { WaterTracker.openSettings(); });
            if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', function() { WaterTracker.saveSettings(); });
            if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', function() { WaterTracker.closeSettings(); });
            
            // Request notification permission on first interaction
            document.body.addEventListener('click', function() {
                WaterTracker.requestNotificationPermission();
            }, { once: true });
        });
    }
};

// Make available globally
window.WaterTracker = WaterTracker;
