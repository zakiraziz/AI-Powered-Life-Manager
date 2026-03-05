// ===== Focus Mode Module =====
const FocusMode = {
    STORAGE_KEY: 'lifeos_focus_data',
    isActive: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    currentSession: null,
    timerInterval: null,

    // Focus presets
    PRESETS: [
        { name: 'Quick Focus', minutes: 25 },
        { name: 'Deep Work', minutes: 90 },
        { name: 'Pomodoro', minutes: 25 },
        { name: 'Long Session', minutes: 120 },
        { name: 'Custom', minutes: 0 }
    ],

    // Initialize focus mode
    init() {
        this.loadFocusData();
        this.renderFocusDashboard();
        this.setupEventListeners();
    },

    // Load focus data from storage
    loadFocusData() {
        const data = DataManager.get(this.STORAGE_KEY, {});
        this.focusHistory = data.history || [];
        this.stats = data.stats || {
            totalMinutes: 0,
            totalSessions: 0,
            streak: 0,
            longestSession: 0
        };
    },

    // Save focus data to storage
    saveFocusData() {
        DataManager.set(this.STORAGE_KEY, {
            history: this.focusHistory,
            stats: this.stats
        });
    },

    // Start focus session
    startSession(duration) {
        if (this.isActive) return;

        this.isActive = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedTime = 0;

        this.currentSession = {
            id: Date.now(),
            duration: duration,
            startTime: new Date().toISOString(),
            endTime: null,
            completed: false,
            distractions: 0,
            task: ''
        };

        // Enable focus mode UI
        this.enableFocusUI();

        // Start timer
        this.startTimer(duration);

        this.showNotification('🎯 Focus mode activated! Stay focused.', 'success');
    },

    // Start timer countdown
    startTimer(duration) {
        let remaining = duration * 60; // Convert to seconds

        this.updateTimerDisplay(remaining);

        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                remaining--;
                this.updateTimerDisplay(remaining);

                if (remaining <= 0) {
                    this.completeSession();
                }
            }
        }, 1000);
    },

    // Update timer display
    updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Update main timer
        const timerElement = document.getElementById('focusTimer');
        if (timerElement) {
            timerElement.textContent = display;
        }

        // Update progress ring
        const progressRing = document.querySelector('.focus-progress-ring circle:last-child');
        if (progressRing && this.currentSession) {
            const totalSeconds = this.currentSession.duration * 60;
            const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }

        // Update document title
        document.title = `(${display}) ${this.isPaused ? '⏸' : '🎯'} LifeOS Focus`;
    },

    // Complete focus session
    completeSession() {
        if (!this.currentSession) return;

        clearInterval(this.timerInterval);

        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.completed = true;

        // Update stats
        this.stats.totalMinutes += this.currentSession.duration;
        this.stats.totalSessions++;
        if (this.currentSession.duration > this.stats.longestSession) {
            this.stats.longestSession = this.currentSession.duration;
        }

        // Check for streak
        this.updateStreak();

        // Save to history
        this.focusHistory.unshift(this.currentSession);
        if (this.focusHistory.length > 100) {
            this.focusHistory = this.focusHistory.slice(0, 100);
        }

        this.saveFocusData();

        // Disable focus UI
        this.disableFocusUI();

        // Show completion
        this.showCompletionCelebration();

        this.isActive = false;
        this.currentSession = null;

        this.showNotification(`🎉 Focus session complete! You focused for ${this.currentSession?.duration || 0} minutes!`, 'success');

        // Refresh dashboard
        this.renderFocusDashboard();
    },

    // Cancel focus session
    cancelSession() {
        if (!this.isActive) return;

        clearInterval(this.timerInterval);

        if (this.currentSession) {
            const elapsed = Math.floor((Date.now() - this.startTime - this.pausedTime) / 60000);
            this.focusHistory.unshift({
                ...this.currentSession,
                endTime: new Date().toISOString(),
                completed: false,
                cancelled: true,
                actualDuration: elapsed
            });
        }

        this.disableFocusUI();

        this.isActive = false;
        this.isPaused = false;
        this.currentSession = null;

        document.title = 'LifeOS Pro - Ultimate Life Operating System';

        this.showNotification('Focus session cancelled', 'info');
    },

    // Pause focus session
    pauseSession() {
        if (!this.isActive || this.isPaused) return;

        this.isPaused = true;
        this.pauseStartTime = Date.now();

        document.getElementById('focusPauseBtn').innerHTML = '<i class="fas fa-play"></i> Resume';
        document.title = '⏸ Paused - LifeOS Focus';

        this.showNotification('Focus session paused', 'info');
    },

    // Resume focus session
    resumeSession() {
        if (!this.isActive || !this.isPaused) return;

        this.pausedTime += Date.now() - this.pauseStartTime;
        this.isPaused = false;

        document.getElementById('focusPauseBtn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        document.title = '🎯 LifeOS Focus';

        this.showNotification('Focus session resumed', 'info');
    },

    // Toggle pause
    togglePause() {
        if (this.isPaused) {
            this.resumeSession();
        } else {
            this.pauseSession();
        }
    },

    // Record distraction
    recordDistraction() {
        if (this.currentSession) {
            this.currentSession.distractions++;
            const countElement = document.getElementById('distractionCount');
            if (countElement) {
                countElement.textContent = this.currentSession.distractions;
            }
            this.showNotification('Distraction logged. Stay focused!', 'warning');
        }
    },

    // Update streak
    updateStreak() {
        const today = new Date().toDateString();
        const lastFocus = this.focusHistory[0];

        if (lastFocus) {
            const lastDate = new Date(lastFocus.startTime).toDateString();
            if (lastDate !== today) {
                // Check if yesterday was focused
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastDate === yesterday.toDateString()) {
                    this.stats.streak++;
                } else {
                    this.stats.streak = 1;
                }
            }
        } else {
            this.stats.streak = 1;
        }
    },

    // Enable focus UI overlay
    enableFocusUI() {
        // Create focus overlay
        const overlay = document.createElement('div');
        overlay.id = 'focusModeOverlay';
        overlay.className = 'focus-mode-overlay active';
        overlay.innerHTML = `
            <div class="focus-mode-content">
                <div class="focus-header">
                    <div class="focus-logo">
                        <i class="fas fa-brain"></i>
                        <span>LifeOS</span>
                        <span class="focus-badge">FOCUS</span>
                    </div>
                    <button class="btn-icon" onclick="FocusMode.cancelSession()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="focus-timer-container">
                    <svg class="focus-progress-ring" width="200" height="200">
                        <circle cx="100" cy="100" r="45" class="progress-bg"></circle>
                        <circle cx="100" cy="100" r="45" class="progress-bar"></circle>
                    </svg>
                    <div class="focus-timer" id="focusTimer">25:00</div>
                </div>
                
                <div class="focus-info">
                    <input type="text" id="focusTask" placeholder="What are you working on?" 
                           class="focus-task-input" onchange="FocusMode.setTask(this.value)">
                </div>
                
                <div class="focus-controls">
                    <button class="btn btn-secondary" id="focusPauseBtn" onclick="FocusMode.togglePause()">
                        <i class="fas fa-pause"></i> Pause
                    </button>
                    <button class="btn btn-danger" onclick="FocusMode.cancelSession()">
                        <i class="fas fa-stop"></i> End Session
                    </button>
                </div>
                
                <div class="focus-stats">
                    <div class="focus-stat">
                        <i class="fas fa-fire"></i>
                        <span>${this.stats.streak} day streak</span>
                    </div>
                    <div class="focus-stat">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span id="distractionCount">0</span> distractions
                    </div>
                </div>
                
                <div class="focus-motivations">
                    <p>🎯 Stay focused! You're doing great!</p>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.classList.add('focus-mode-active');

        // Hide main app
        const app = document.getElementById('app');
        if (app) app.style.display = 'none';
    },

    // Disable focus UI overlay
    disableFocusUI() {
        const overlay = document.getElementById('focusModeOverlay');
        if (overlay) {
            overlay.remove();
        }

        document.body.classList.remove('focus-mode-active');

        const app = document.getElementById('app');
        if (app) app.style.display = '';

        document.title = 'LifeOS Pro - Ultimate Life Operating System';
    },

    // Set current task
    setTask(task) {
        if (this.currentSession) {
            this.currentSession.task = task;
        }
    },

    // Show completion celebration
    showCompletionCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'focus-celebration';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-icon">🎉</div>
                <h2>Focus Session Complete!</h2>
                <p>Great work! You've completed a ${this.currentSession?.duration || 0} minute focus session.</p>
                <div class="celebration-stats">
                    <div class="stat">
                        <span class="value">${this.stats.totalSessions}</span>
                        <span class="label">Total Sessions</span>
                    </div>
                    <div class="stat">
                        <span class="value">${this.stats.totalMinutes}</span>
                        <span class="label">Total Minutes</span>
                    </div>
                    <div class="stat">
                        <span class="value">${this.stats.streak}</span>
                        <span class="label">Day Streak</span>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="this.closest('.focus-celebration').remove()">
                    Continue
                </button>
            </div>
        `;
        document.body.appendChild(celebration);

        setTimeout(() => {
            celebration.classList.add('show');
        }, 100);
    },

    // Render focus dashboard
    renderFocusDashboard() {
        const container = document.getElementById('focusModeContent');
        if (!container) return;

        container.innerHTML = `
            <div class="focus-dashboard">
                <!-- Focus Stats -->
                <div class="focus-stats-row">
                    <div class="focus-stat-card">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${this.stats.totalMinutes}</span>
                            <span class="stat-label">Total Minutes</span>
                        </div>
                    </div>
                    <div class="focus-stat-card">
                        <div class="stat-icon"><i class="fas fa-play-circle"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${this.stats.totalSessions}</span>
                            <span class="stat-label">Sessions</span>
                        </div>
                    </div>
                    <div class="focus-stat-card">
                        <div class="stat-icon"><i class="fas fa-fire"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${this.stats.streak}</span>
                            <span class="stat-label">Day Streak</span>
                        </div>
                    </div>
                    <div class="focus-stat-card">
                        <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${this.stats.longestSession}</span>
                            <span class="stat-label">Longest (min)</span>
                        </div>
                    </div>
                </div>
                
                <!-- Start Focus Session -->
                <div class="focus-start-card">
                    <h3><i class="fas fa-play-circle"></i> Start Focus Session</h3>
                    <div class="focus-presets">
                        ${this.PRESETS.map(preset => `
                            <button class="preset-btn" onclick="FocusMode.startSession(${preset.minutes})">
                                <span class="preset-name">${preset.name}</span>
                                <span class="preset-time">${preset.minutes > 0 ? preset.minutes + ' min' : 'Custom'}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="custom-duration">
                        <input type="number" id="customFocusMinutes" placeholder="Minutes" min="1" max="180">
                        <button class="btn btn-primary" onclick="FocusMode.startCustomSession()">
                            <i class="fas fa-play"></i> Start
                        </button>
                    </div>
                </div>
                
                <!-- Focus Tips -->
                <div class="focus-tips-card">
                    <h3><i class="fas fa-lightbulb"></i> Focus Tips</h3>
                    <div class="tips-list">
                        <div class="tip">
                            <i class="fas fa-check"></i>
                            <span>Start with small sessions and gradually increase duration</span>
                        </div>
                        <div class="tip">
                            <i class="fas fa-check"></i>
                            <span>Remove all distractions before starting</span>
                        </div>
                        <div class="tip">
                            <i class="fas fa-check"></i>
                            <span>Set a clear task intention before each session</span>
                        </div>
                        <div class="tip">
                            <i class="fas fa-check"></i>
                            <span>Take breaks between focus sessions</span>
                        </div>
                        <div class="tip">
                            <i class="fas fa-check"></i>
                            <span>Stay hydrated during focus sessions</span>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Sessions -->
                <div class="focus-history-card">
                    <h3><i class="fas fa-history"></i> Recent Sessions</h3>
                    <div class="history-list">
                        ${this.focusHistory.length > 0 ? this.focusHistory.slice(0, 5).map(session => `
                            <div class="history-item ${session.completed ? 'completed' : 'cancelled'}">
                                <div class="history-icon">
                                    <i class="fas fa-${session.completed ? 'check-circle' : 'times-circle'}"></i>
                                </div>
                                <div class="history-info">
                                    <span class="history-task">${session.task || 'Focus Session'}</span>
                                    <span class="history-date">${new Date(session.startTime).toLocaleDateString()}</span>
                                </div>
                                <div class="history-duration">
                                    ${session.completed ? session.duration : session.actualDuration || 0} min
                                </div>
                            </div>
                        `).join('') : '<p class="no-data">No focus sessions yet. Start your first one!</p>'}
                    </div>
                </div>
            </div>
        `;
    },

    // Start custom session
    startCustomSession() {
        const minutes = parseInt(document.getElementById('customFocusMinutes').value);
        if (minutes > 0 && minutes <= 180) {
            this.startSession(minutes);
        } else {
            this.showNotification('Please enter a valid duration (1-180 minutes)', 'error');
        }
    },

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('focusMode:refresh', () => {
            this.loadFocusData();
            this.renderFocusDashboard();
        });

        // Keyboard shortcut for focus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.cancelSession();
            }
            if (e.key === ' ' && this.isActive && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.togglePause();
            }
        });
    },

    // Show notification
    showNotification(message, type) {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
};

// Make globally available
window.FocusMode = FocusMode;
