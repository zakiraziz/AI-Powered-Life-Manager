// ===== habitTracker.js - Habit Tracking Module =====

const HabitTracker = {
    habits: [],
    defaultHabits: [
        { id: 'exercise', name: 'Exercise', icon: '🏃', target: 1, unit: 'times' },
        { id: 'reading', name: 'Reading', icon: '📖', target: 30, unit: 'minutes' },
        { id: 'meditation', name: 'Meditation', icon: '🧘', target: 15, unit: 'minutes' },
        { id: 'water', name: 'Drink Water', icon: '💧', target: 8, unit: 'glasses' },
        { id: 'sleep', name: 'Sleep 8 hours', icon: '😴', target: 1, unit: 'time' },
        { id: 'healthy_food', name: 'Healthy Eating', icon: '🥗', target: 1, unit: 'time' }
    ],

    init() {
        this.loadHabits();
        this.renderHabits();
        this.setupEventListeners();
        console.log('[HabitTracker] Initialized');
    },

    loadHabits() {
        const stored = DataManager.get(DataManager.STORAGE_KEYS.HABITS, []);
        if (stored.length === 0) {
            this.habits = this.defaultHabits.map(h => ({
                ...h,
                completions: {},
                streak: 0,
                bestStreak: 0
            }));
        } else {
            this.habits = stored;
        }
    },

    saveHabits() {
        DataManager.set(DataManager.STORAGE_KEYS.HABITS, this.habits);
        this.renderHabits();
    },

    addHabit(name, icon, target, unit) {
        const id = 'habit_' + Date.now();
        const newHabit = {
            id: id,
            name: SecurityUtils.sanitizeInput(name),
            icon: icon || '⭐',
            target: parseInt(target) || 1,
            unit: unit || 'time',
            completions: {},
            streak: 0,
            bestStreak: 0
        };
        
        this.habits.push(newHabit);
        this.saveHabits();
        NotificationSystem.success('Habit added! 🎯', 2000);
        return newHabit;
    },

    toggleHabitCompletion(habitId, date) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const dateKey = date || new Date().toISOString().split('T')[0];
        
        if (habit.completions[dateKey]) {
            delete habit.completions[dateKey];
            this.updateStreak(habit);
        } else {
            habit.completions[dateKey] = {
                count: 1,
                timestamp: new Date().toISOString()
            };
            this.updateStreak(habit);
        }
        
        this.saveHabits();
    },

    incrementHabit(habitId, amount) {
        amount = amount || 1;
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const dateKey = new Date().toISOString().split('T')[0];
        
        if (!habit.completions[dateKey]) {
            habit.completions[dateKey] = { count: 0, timestamp: new Date().toISOString() };
        }
        
        habit.completions[dateKey].count += amount;
        
        // Check if target reached
        if (habit.completions[dateKey].count >= habit.target) {
            this.updateStreak(habit);
            // Show notification only when target is first reached
            if (habit.completions[dateKey].count === habit.target) {
                NotificationSystem.success(habit.name + ' goal reached! 🔥', 2000);
            }
        }
        
        this.saveHabits();
    },

    updateStreak(habit) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (habit.completions[today]) {
            // Check if yesterday was completed
            if (habit.completions[yesterday] || habit.streak === 0) {
                // Continue or start streak
                let currentStreak = 0;
                let checkDate = new Date();
                
                while (true) {
                    const checkKey = checkDate.toISOString().split('T')[0];
                    if (habit.completions[checkKey] && habit.completions[checkKey].count >= habit.target) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else if (checkKey === today) {
                        // Today doesn't count towards streak yet
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
                
                habit.streak = currentStreak;
                if (currentStreak > habit.bestStreak) {
                    habit.bestStreak = currentStreak;
                }
            }
        } else {
            habit.streak = 0;
        }
    },

    getHabitProgress(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return 0;
        
        const today = new Date().toISOString().split('T')[0];
        const completion = habit.completions[today];
        
        if (!completion) return 0;
        return Math.min(100, Math.round((completion.count / habit.target) * 100));
    },

    getTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const completed = this.habits.filter(h => 
            h.completions[today] && h.completions[today].count >= h.target
        ).length;
        
        return {
            total: this.habits.length,
            completed: completed,
            percentage: this.habits.length > 0 ? Math.round((completed / this.habits.length) * 100) : 0
        };
    },

    deleteHabit(habitId) {
        ModalManager.confirm('Delete this habit?').then(function(confirmed) {
            if (confirmed) {
                HabitTracker.habits = HabitTracker.habits.filter(function(h) { return h.id !== habitId; });
                HabitTracker.saveHabits();
                NotificationSystem.info('Habit deleted', 2000);
            }
        });
    },

    renderHabits() {
        const container = document.getElementById('habitList');
        if (!container) return;

        const today = new Date().toISOString().split('T')[0];
        
        container.innerHTML = this.habits.map(function(habit) {
            const progress = HabitTracker.getHabitProgress(habit.id);
            const isCompleted = progress >= 100;
            const completion = habit.completions[today];
            const currentCount = completion ? completion.count : 0;

            return '<div class="habit-item ' + (isCompleted ? 'completed' : '') + '" data-habit-id="' + habit.id + '">' +
                '<div class="habit-icon">' + habit.icon + '</div>' +
                '<div class="habit-info">' +
                '<div class="habit-name">' + SecurityUtils.escapeHtml(habit.name) + '</div>' +
                '<div class="habit-progress">' +
                '<div class="progress-bar-small">' +
                '<div class="progress-fill ' + (isCompleted ? 'success' : '') + '" style="width: ' + progress + '%;"></div>' +
                '</div>' +
                '<span class="progress-text">' + currentCount + '/' + habit.target + ' ' + habit.unit + '</span>' +
                '</div>' +
                '</div>' +
                '<div class="habit-actions">' +
                '<button class="habit-btn increment" onclick="HabitTracker.incrementHabit(\'' + habit.id + '\')" title="Add">' +
                '<i class="fas fa-plus"></i>' +
                '</button>' +
                '<button class="habit-btn delete" onclick="HabitTracker.deleteHabit(\'' + habit.id + '\')" title="Delete">' +
                '<i class="fas fa-trash"></i>' +
                '</button>' +
                '</div>' +
                '<div class="habit-streak" title="Current streak">🔥 ' + habit.streak + '</div>' +
                '</div>';
        }).join('');

        // Update stats
        const stats = this.getTodayStats();
        const completedEl = document.getElementById('habitsCompleted');
        const totalEl = document.getElementById('habitsTotal');
        const percentEl = document.getElementById('habitsPercent');
        
        if (completedEl) completedEl.textContent = stats.completed;
        if (totalEl) totalEl.textContent = stats.total;
        if (percentEl) percentEl.textContent = stats.percentage + '%';
    },

    showAddHabitModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    },

    hideAddHabitModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    handleAddHabit() {
        const nameInput = document.getElementById('habitNameInput');
        const iconInput = document.getElementById('habitIconInput');
        const targetInput = document.getElementById('habitTargetInput');
        const unitInput = document.getElementById('habitUnitInput');
        
        const name = nameInput ? nameInput.value : '';
        const icon = iconInput ? iconInput.value : '⭐';
        const target = targetInput ? targetInput.value : 1;
        const unit = unitInput ? unitInput.value : 'time';

        if (!name) {
            NotificationSystem.warning('Please enter a habit name');
            return;
        }

        this.addHabit(name, icon, target, unit);
        this.hideAddHabitModal();
        
        // Clear inputs
        if (nameInput) nameInput.value = '';
        if (iconInput) iconInput.value = '⭐';
        if (targetInput) targetInput.value = 1;
        if (unitInput) unitInput.value = 'time';
    },

    setupEventListeners: function() {
        document.addEventListener('DOMContentLoaded', function() {
            const addBtn = document.getElementById('addHabitBtn');
            if (addBtn) {
                addBtn.addEventListener('click', function() { HabitTracker.showAddHabitModal(); });
            }
            
            const saveBtn = document.getElementById('saveHabitBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() { HabitTracker.handleAddHabit(); });
            }
            
            const closeBtn = document.getElementById('closeHabitModal');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() { HabitTracker.hideAddHabitModal(); });
            }
        });
    }
};

// Make available globally
window.HabitTracker = HabitTracker;
