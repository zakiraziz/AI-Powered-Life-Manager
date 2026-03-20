// ===== keyboardShortcuts.js - Power User Keyboard Shortcuts =====

const KeyboardShortcuts = {
    // Shortcuts configuration
    shortcuts: {
        // Navigation
        'g d': { action: 'navigate', target: 'dashboard', description: 'Go to Dashboard', category: 'Navigation' },
        'g t': { action: 'navigate', target: 'tasks', description: 'Go to Tasks', category: 'Navigation' },
        'g a': { action: 'navigate', target: 'analytics', description: 'Go to Analytics', category: 'Navigation' },
        'g c': { action: 'navigate', target: 'calendar', description: 'Go to Calendar', category: 'Navigation' },
        'g e': { action: 'navigate', target: 'expenses', description: 'Go to Expenses', category: 'Navigation' },
        'g h': { action: 'navigate', target: 'habits', description: 'Go to Habits', category: 'Navigation' },
        'g p': { action: 'navigate', target: 'pomodoro', description: 'Go to Pomodoro', category: 'Navigation' },
        'g n': { action: 'navigate', target: 'notes', description: 'Go to Notes', category: 'Navigation' },
        'g i': { action: 'navigate', target: 'ai', description: 'Go to AI Assistant', category: 'Navigation' },
        'g w': { action: 'navigate', target: 'water', description: 'Go to Water Tracker', category: 'Navigation' },
        'g m': { action: 'navigate', target: 'mood', description: 'Go to Mood', category: 'Navigation' },
        
        // Quick Actions
        'n': { action: 'quickAction', target: 'addTask', description: 'New Task', category: 'Quick Actions' },
        'm': { action: 'quickAction', target: 'logMood', description: 'Log Mood', category: 'Quick Actions' },
        'e': { action: 'quickAction', target: 'addExpense', description: 'Add Expense', category: 'Quick Actions' },
        'h': { action: 'quickAction', target: 'addHabit', description: 'Add Habit', category: 'Quick Actions' },
        'p': { action: 'quickAction', target: 'startPomodoro', description: 'Start Pomodoro', category: 'Quick Actions' },
        'w': { action: 'quickAction', target: 'logWater', description: 'Log Water', category: 'Quick Actions' },
        
        // General
        '/': { action: 'focusSearch', description: 'Focus Search', category: 'General' },
        '?': { action: 'showHelp', description: 'Show Shortcuts', category: 'General' },
        'esc': { action: 'closeModal', description: 'Close Modal/Dialog', category: 'General' },
        's': { action: 'save', description: 'Save Current', category: 'General' },
        
        // AI Assistant
        'cmd k': { action: 'openAI', description: 'Open AI Assistant', category: 'AI' },
        'ctrl k': { action: 'openAI', description: 'Open AI Assistant', category: 'AI' },
        
        // Theme
        'cmd t': { action: 'toggleTheme', description: 'Toggle Theme', category: 'Settings' },
        'ctrl t': { action: 'toggleTheme', description: 'Toggle Theme', category: 'Settings' },
        
        // Notifications
        'cmd n': { action: 'toggleNotifications', description: 'Toggle Notifications', category: 'Notifications' },
        'ctrl n': { action: 'toggleNotifications', description: 'Toggle Notifications', category: 'Notifications' },
        
        // Focus Mode
        'f': { action: 'toggleFocusMode', description: 'Toggle Focus Mode', category: 'Display' },
        'f11': { action: 'toggleFullscreen', description: 'Toggle Fullscreen', category: 'Display' }
    },
    
    // Initialize keyboard shortcuts
    init() {
        this.bindEvents();
        this.showWelcomeTip();
    },
    
    // Bind keyboard events
    bindEvents() {
        let keyBuffer = '';
        let lastKeyTime = 0;
        
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                // Still allow some shortcuts with modifier
                if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
            }
            
            const now = Date.now();
            const key = e.key.toLowerCase();
            
            // Clear buffer if too much time passed
            if (now - lastKeyTime > 1000) {
                keyBuffer = '';
            }
            lastKeyTime = now;
            
            // Handle special keys
            if (key === 'escape') {
                this.handleEscape();
                return;
            }
            
            if (key === 'f11') {
                e.preventDefault();
                this.toggleFullscreen();
                return;
            }
            
            // Build key combination
            let combo = key;
            if (e.ctrlKey) combo = 'ctrl ' + combo;
            if (e.metaKey) combo = 'cmd ' + combo;
            if (e.altKey) combo = 'alt ' + combo;
            
            // Check for direct shortcuts first
            if (this.shortcuts[combo]) {
                e.preventDefault();
                this.execute(this.shortcuts[combo]);
                keyBuffer = '';
                return;
            }
            
            // Build buffer for multi-key shortcuts (like Vim mode)
            keyBuffer += key + ' ';
            
            // Check buffer for matches
            const buffer = keyBuffer.trim();
            if (this.shortcuts[buffer]) {
                e.preventDefault();
                this.execute(this.shortcuts[buffer]);
                keyBuffer = '';
            }
            
            // Keep buffer manageable
            if (keyBuffer.length > 20) {
                keyBuffer = '';
            }
        });
    },
    
    // Execute a shortcut action
    execute(shortcut) {
        switch (shortcut.action) {
            case 'navigate':
                App.navigateTo(shortcut.target);
                this.showNotification(`Navigated to ${shortcut.description}`);
                break;
                
            case 'quickAction':
                this.handleQuickAction(shortcut.target);
                break;
                
            case 'focusSearch':
                const searchInput = document.getElementById('searchInput') || document.querySelector('[data-search]');
                if (searchInput) {
                    searchInput.focus();
                }
                break;
                
            case 'showHelp':
                this.showShortcutsHelp();
                break;
                
            case 'closeModal':
                this.closeCurrentModal();
                break;
                
            case 'save':
                this.saveCurrent();
                break;
                
            case 'openAI':
                if (typeof AIAssistant !== 'undefined') {
                    AIAssistant.showAIAssistant();
                }
                break;
                
            case 'toggleTheme':
                if (typeof Theme !== 'undefined') {
                    Theme.toggle();
                }
                break;
                
            case 'toggleNotifications':
                UI.toggleDropdown('notificationsDropdown');
                break;
                
            case 'toggleFocusMode':
                this.toggleFocusMode();
                break;
                
            case 'toggleFullscreen':
                this.toggleFullscreen();
                break;
        }
    },
    
    // Handle quick actions
    handleQuickAction(action) {
        switch (action) {
            case 'addTask':
                if (typeof QuickActions !== 'undefined') {
                    QuickActions.addTask();
                }
                break;
            case 'logMood':
                if (typeof MoodManager !== 'undefined') {
                    MoodManager.showMoodModal();
                }
                break;
            case 'addExpense':
                if (typeof QuickActions !== 'undefined') {
                    QuickActions.addExpense();
                }
                break;
            case 'addHabit':
                if (typeof QuickActions !== 'undefined') {
                    QuickActions.addHabit();
                }
                break;
            case 'startPomodoro':
                if (typeof PomodoroTimer !== 'undefined') {
                    PomodoroTimer.start();
                }
                break;
            case 'logWater':
                if (typeof WaterTracker !== 'undefined') {
                    WaterTracker.addGlass();
                }
                break;
        }
    },
    
    // Handle escape key
    handleEscape() {
        // Close modals using ModalManager
        if (typeof ModalManager !== 'undefined' && ModalManager.closeAll) {
            ModalManager.closeAll();
        } else {
            // Fallback: manually close all modals
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(modal => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            });
        }
        
        // Close dropdowns
        const dropdowns = document.querySelectorAll('.dropdown-menu, .user-dropdown, .notifications-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
        
        // Exit focus mode if active
        if (document.body.classList.contains('focus-mode')) {
            this.toggleFocusMode();
        }
    },
    
    // Close current modal
    closeCurrentModal() {
        this.handleEscape();
    },
    
    // Save current data
    saveCurrent() {
        if (typeof DataManager !== 'undefined') {
            DataManager.saveAll();
            this.showNotification('Data saved!');
        }
    },
    
    // Toggle focus mode
    toggleFocusMode() {
        document.body.classList.toggle('focus-mode');
        const isFocusMode = document.body.classList.contains('focus-mode');
        
        // Hide non-essential elements
        const navbar = document.querySelector('.navbar');
        const sidebar = document.querySelector('.sidebar');
        
        if (navbar) navbar.style.display = isFocusMode ? 'none' : '';
        if (sidebar) sidebar.style.display = isFocusMode ? 'none' : '';
        
        this.showNotification(isFocusMode ? 'Focus Mode: ON' : 'Focus Mode: OFF');
    },
    
    // Toggle fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    },
    
    // Show shortcuts help
    showShortcutsHelp() {
        // Group shortcuts by category
        const categories = {};
        Object.entries(this.shortcuts).forEach(([key, shortcut]) => {
            if (!categories[shortcut.category]) {
                categories[shortcut.category] = [];
            }
            categories[shortcut.category].push({ key, ...shortcut });
        });
        
        // Build HTML
        let html = `
            <div class="shortcuts-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div class="shortcuts-content" style="background: var(--bg-primary); border-radius: 12px; padding: 1.5rem; max-width: 600px; max-height: 80vh; overflow-y: auto; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="margin: 0;"><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h2>
                        <button onclick="this.closest('.shortcuts-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
        `;
        
        Object.entries(categories).forEach(([category, items]) => {
            html += `
                <div style="margin-bottom: 1rem;">
                    <h3 style="color: var(--accent-primary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">${category}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.5rem;">
            `;
            
            items.forEach(item => {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 0.4rem 0.6rem; border-radius: 6px;">
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">${item.description}</span>
                        <kbd style="background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace; font-size: 0.75rem; border: 1px solid var(--border-color);">${item.key.replace(' ', ' + ')}</kbd>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += `
                    <p style="text-align: center; color: var(--text-tertiary); font-size: 0.8rem; margin-top: 1rem;">
                        Press <kbd style="background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: monospace;">?</kbd> anytime to show this help
                    </p>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existing = document.querySelector('.shortcuts-modal');
        if (existing) existing.remove();
        
        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Add close handler
        document.querySelector('.shortcuts-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });
    },
    
    // Show notification
    showNotification(message) {
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.show(message, 'shortcut');
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = 'shortcut-notification';
            notification.innerHTML = `<i class="fas fa-keyboard"></i> ${message}`;
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--accent-primary);
                color: white;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                z-index: 10001;
                animation: slideInRight 0.3s ease;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        }
    },
    
    // Show welcome tip
    showWelcomeTip() {
        const shown = localStorage.getItem('lifeos_shortcuts_tip_shown');
        if (!shown) {
            setTimeout(() => {
                this.showNotification('Press ? for keyboard shortcuts');
                localStorage.setItem('lifeos_shortcuts_tip_shown', 'true');
            }, 3000);
        }
    }
};

// Make KeyboardShortcuts globally accessible
window.KeyboardShortcuts = KeyboardShortcuts;
