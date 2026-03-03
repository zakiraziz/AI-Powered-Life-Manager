// ===== quickActions.js - Unified Quick Actions Module =====

const QuickActions = {
    // Toggle dropdown
    toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
            dropdown.style.display = isHidden ? 'block' : 'none';
            
            // Close other dropdowns
            const allDropdowns = document.querySelectorAll('.dropdown-menu, .user-dropdown, .notifications-dropdown');
            allDropdowns.forEach(d => {
                if (d.id !== dropdownId) {
                    d.style.display = 'none';
                }
            });
        }
    },
    
    // Add new task
    addTask() {
        this.toggleDropdown('quickActionsDropdown');
        
        // Find and open task modal or focus task input
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            taskModal.classList.remove('hidden');
            taskModal.style.display = 'flex';
            const taskInput = document.getElementById('taskInput') || document.querySelector('[id*="task"] input');
            if (taskInput) taskInput.focus();
        } else {
            // Navigate to tasks page
            if (typeof App !== 'undefined') {
                App.navigateTo('tasks');
            }
            // Focus on first task input after navigation
            setTimeout(() => {
                const taskInput = document.getElementById('taskInput') || document.querySelector('.task-input') || document.querySelector('[placeholder*="task"]');
                if (taskInput) taskInput.focus();
            }, 300);
        }
    },
    
    // Log mood
    logMood() {
        this.toggleDropdown('quickActionsDropdown');
        
        // Find and open mood modal
        const moodModal = document.getElementById('moodModal');
        if (moodModal) {
            moodModal.classList.remove('hidden');
            moodModal.style.display = 'flex';
        } else if (typeof MoodManager !== 'undefined' && MoodManager.showMoodModal) {
            MoodManager.showMoodModal();
        } else {
            // Navigate to mood page
            if (typeof App !== 'undefined') {
                App.navigateTo('mood');
            }
        }
    },
    
    // Add expense
    addExpense() {
        this.toggleDropdown('quickActionsDropdown');
        
        // Find and open expense modal
        const expenseModal = document.getElementById('expenseModal');
        if (expenseModal) {
            expenseModal.classList.remove('hidden');
            expenseModal.style.display = 'flex';
            const amountInput = document.getElementById('expenseAmount') || document.querySelector('[id*="expense"] input');
            if (amountInput) amountInput.focus();
        } else {
            // Navigate to expenses page
            if (typeof App !== 'undefined') {
                App.navigateTo('expenses');
            }
            setTimeout(() => {
                const expenseInput = document.getElementById('expenseAmount') || document.querySelector('[id*="expense"] input');
                if (expenseInput) expenseInput.focus();
            }, 300);
        }
    },
    
    // Start Pomodoro
    startPomodoro() {
        this.toggleDropdown('quickActionsDropdown');
        
        if (typeof PomodoroTimer !== 'undefined') {
            PomodoroTimer.start();
        } else {
            // Navigate to pomodoro page
            if (typeof App !== 'undefined') {
                App.navigateTo('pomodoro');
            }
        }
    },
    
    // Add habit
    addHabit() {
        this.toggleDropdown('quickActionsDropdown');
        
        // Find and open habit modal
        const habitModal = document.getElementById('habitModal');
        if (habitModal) {
            habitModal.classList.remove('hidden');
            habitModal.style.display = 'flex';
            const habitInput = document.getElementById('habitNameInput');
            if (habitInput) habitInput.focus();
        } else {
            // Navigate to habits page
            if (typeof App !== 'undefined') {
                App.navigateTo('habits');
            }
            setTimeout(() => {
                const habitInput = document.getElementById('habitNameInput');
                if (habitInput) habitInput.focus();
            }, 300);
        }
    },
    
    // Add note
    addNote() {
        this.toggleDropdown('quickActionsDropdown');
        
        // Navigate to notes page
        if (typeof App !== 'undefined') {
            App.navigateTo('notes');
        }
        setTimeout(() => {
            const noteInput = document.getElementById('noteInput') || document.querySelector('.note-input') || document.querySelector('[id*="note"] textarea');
            if (noteInput) noteInput.focus();
        }, 300);
    },
    
    // Log water
    logWater() {
        this.toggleDropdown('quickActionsDropdown');
        
        if (typeof WaterTracker !== 'undefined') {
            WaterTracker.addGlass();
        } else {
            // Navigate to water tracker
            if (typeof App !== 'undefined') {
                App.navigateTo('water');
            }
        }
    },
    
    // Show AI Assistant
    openAI() {
        this.toggleDropdown('quickActionsDropdown');
        
        if (typeof AIAssistant !== 'undefined') {
            AIAssistant.showAIAssistant();
        }
    },
    
    // Search
    openSearch() {
        this.toggleDropdown('quickActionsDropdown');
        
        const searchInput = document.getElementById('searchInput') || document.querySelector('[data-search]') || document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
};

// UI Utility Object
const UI = {
    toggleDropdown: function(dropdownId) {
        QuickActions.toggleDropdown(dropdownId);
    },
    
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    },
    
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },
    
    showNotification: function(message, type = 'info') {
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.show(message, type);
        } else {
            alert(message);
        }
    }
};

// Make QuickActions and UI globally accessible
window.QuickActions = QuickActions;
window.UI = UI;
