// ===== pomodoroTimer.js - Pomodoro Focus Timer Module (Enhanced) =====

const PomodoroTimer = {
    timer: null,
    timeLeft: 25 * 60, // 25 minutes in seconds
    isRunning: false,
    isPaused: false,
    currentMode: 'work', // work, shortBreak, longBreak
    sessionsCompleted: 0,
    totalSessionsToday: 0,
    totalFocusTime: 0, // Total focused minutes today
    dailyGoal: 4, // Default daily goal of 4 sessions
    startTime: null, // Track when current session started
    sessionHistory: [], // Store completed sessions
    quotes: [
        "Focus on being productive instead of busy. 🎯",
        "The secret of getting ahead is getting started. 🚀",
        "You don't have to be great to start, but you have to start to be great. 💪",
        "Small progress is still progress. 📈",
        "Your future self is watching you right now. 👀"
    ],
    currentQuote: "Focus on being productive instead of busy. 🎯",

    // Timer settings
    settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        autoStartBreaks: false,
        autoStartWork: false,
        soundEnabled: true,
        desktopNotifications: true,
        dailyGoal: 4,
        theme: 'default', // default, ocean, sunset, forest
        tickSound: false,
        volume: 70,
        minimizeToTray: false,
        strictMode: false // Prevent skipping breaks
    },

    init() {
        this.loadSettings();
        this.loadTodaySessions();
        this.loadSessionHistory();
        this.updateDisplay();
        this.setupEventListeners();
        this.startClock();
        this.updateQuote();
        console.log('[PomodoroTimer] Initialized');
    },

    // Render full Pomodoro page
    render() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const progress = this.getProgressPercentage();

        let modeLabel = 'Focus Time';
        let modeIcon = '🎯';
        let modeColor = 'var(--accent-primary)';
        
        if (this.currentMode === 'shortBreak') {
            modeLabel = 'Short Break';
            modeIcon = '☕';
            modeColor = 'var(--accent-success)';
        } else if (this.currentMode === 'longBreak') {
            modeLabel = 'Long Break';
            modeIcon = '🌴';
            modeColor = 'var(--accent-warning)';
        }

        // Calculate daily goal progress
        const goalProgress = (this.totalSessionsToday / this.dailyGoal) * 100;
        const goalProgressWidth = Math.min(goalProgress, 100);

        let html = `
            <div class="pomodoro-page">
                <div class="page-header">
                    <h2><i class="fas fa-clock"></i> Pomodoro Timer</h2>
                    <div class="header-actions">
                        <button class="btn btn-secondary" onclick="PomodoroTimer.showStats()">
                            <i class="fas fa-chart-bar"></i> Stats
                        </button>
                        <button class="btn btn-secondary" onclick="PomodoroTimer.openSettings()">
                            <i class="fas fa-cog"></i> Settings
                        </button>
                    </div>
                </div>
                
                <div class="pomodoro-container">
                    <div class="quote-container">
                        <p class="quote-text">"${this.currentQuote}"</p>
                        <button class="quote-refresh" onclick="PomodoroTimer.updateQuote()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    
                    <div class="mode-selector">
                        <button class="mode-btn ${this.currentMode === 'work' ? 'active' : ''}" 
                                onclick="PomodoroTimer.setMode('work')"
                                style="${this.currentMode === 'work' ? `border-color: ${modeColor}` : ''}">
                            <i class="fas fa-bullseye"></i> Focus
                        </button>
                        <button class="mode-btn ${this.currentMode === 'shortBreak' ? 'active' : ''}" 
                                onclick="PomodoroTimer.setMode('shortBreak')"
                                style="${this.currentMode === 'shortBreak' ? `border-color: ${modeColor}` : ''}">
                            <i class="fas fa-coffee"></i> Short Break
                        </button>
                        <button class="mode-btn ${this.currentMode === 'longBreak' ? 'active' : ''}" 
                                onclick="PomodoroTimer.setMode('longBreak')"
                                style="${this.currentMode === 'longBreak' ? `border-color: ${modeColor}` : ''}">
                            <i class="fas fa-umbrella-beach"></i> Long Break
                        </button>
                    </div>
                    
                    <div class="timer-display">
                        <div class="timer-circle">
                            <svg class="progress-ring" width="320" height="320">
                                <circle class="progress-ring-bg" stroke="var(--bg-secondary)" 
                                        stroke-width="12" fill="transparent" r="140" cx="160" cy="160"/>
                                <circle class="progress-ring-fill" stroke="${modeColor}" 
                                        stroke-width="12" fill="transparent" r="140" cx="160" cy="160"
                                        stroke-dasharray="${2 * Math.PI * 140}"
                                        stroke-dashoffset="${2 * Math.PI * 140 * (1 - progress / 100)}"
                                        transform="rotate(-90 160 160)"
                                        style="transition: stroke-dashoffset 0.3s ease"/>
                            </svg>
                            <div class="timer-time">${timeDisplay}</div>
                            <div class="timer-mode">${modeIcon} ${modeLabel}</div>
                        </div>
                    </div>
                    
                    <div class="timer-controls">
                        ${!this.isRunning ?
                `<button class="timer-btn primary" onclick="PomodoroTimer.start()">
                                <i class="fas fa-play"></i> Start
                            </button>` :
                `<button class="timer-btn warning" onclick="PomodoroTimer.pause()">
                                <i class="fas fa-pause"></i> Pause
                            </button>`
            }
                        <button class="timer-btn" onclick="PomodoroTimer.stop()">
                            <i class="fas fa-stop"></i> Stop
                        </button>
                        ${!this.settings.strictMode || this.currentMode === 'work' ? 
                        `<button class="timer-btn" onclick="PomodoroTimer.skip()">
                            <i class="fas fa-forward"></i> Skip
                        </button>` : ''}
                        <button class="timer-btn" onclick="PomodoroTimer.reset()">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                    
                    <div class="progress-stats">
                        <div class="daily-goal">
                            <div class="goal-header">
                                <span>Daily Goal: ${this.totalSessionsToday}/${this.dailyGoal} sessions</span>
                                <span>${Math.round(goalProgress)}%</span>
                            </div>
                            <div class="goal-progress-bar">
                                <div class="goal-progress-fill" style="width: ${goalProgressWidth}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="session-stats">
                        <div class="stat-item">
                            <span class="stat-value">${this.totalSessionsToday}</span>
                            <span class="stat-label">Sessions Today</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${this.totalFocusTime}</span>
                            <span class="stat-label">Minutes Focused</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${this.sessionsCompleted}</span>
                            <span class="stat-label">Total Sessions</span>
                        </div>
                    </div>

                    <div class="recent-sessions">
                        <h3>Recent Activity</h3>
                        <div class="session-list">
                            ${this.renderRecentSessions()}
                        </div>
                    </div>
                </div>

                ${this.renderSettingsModal()}
                ${this.renderStatsModal()}
            </div>
        `;

        // Render to pageContent
        const pageContent = document.getElementById('pageContent');
        if (pageContent) {
            pageContent.innerHTML = html;
        }
    },

    renderRecentSessions() {
        const recent = this.sessionHistory.slice(-5).reverse();
        if (recent.length === 0) {
            return '<p class="no-sessions">No sessions yet. Start your first pomodoro! 🍅</p>';
        }

        return recent.map(session => {
            const date = new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="session-item">
                    <span class="session-time">${date}</span>
                    <span class="session-type ${session.type}">${session.type === 'work' ? '🎯 Focus' : '☕ Break'}</span>
                    <span class="session-duration">${session.duration} min</span>
                </div>
            `;
        }).join('');
    },

    renderSettingsModal() {
        return `
            <div id="pomodoroSettingsModal" class="modal hidden">
                <div class="modal-content settings-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-cog"></i> Timer Settings</h3>
                        <button class="close-btn" onclick="PomodoroTimer.closeSettings()">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="settings-tabs">
                            <button class="tab-btn active" data-tab="basic">Basic</button>
                            <button class="tab-btn" data-tab="advanced">Advanced</button>
                            <button class="tab-btn" data-tab="sounds">Sounds</button>
                        </div>

                        <div class="tab-panel active" id="basic-tab">
                            <div class="settings-group">
                                <label>Focus Duration (minutes)</label>
                                <input type="number" id="pomodoroWorkDuration" min="1" max="60" 
                                       value="${this.settings.workDuration}" step="1">
                            </div>
                            
                            <div class="settings-group">
                                <label>Short Break Duration (minutes)</label>
                                <input type="number" id="pomodoroShortBreak" min="1" max="30" 
                                       value="${this.settings.shortBreakDuration}" step="1">
                            </div>
                            
                            <div class="settings-group">
                                <label>Long Break Duration (minutes)</label>
                                <input type="number" id="pomodoroLongBreak" min="1" max="45" 
                                       value="${this.settings.longBreakDuration}" step="1">
                            </div>
                            
                            <div class="settings-group">
                                <label>Sessions until long break</label>
                                <input type="number" id="pomodoroSessionsUntilLongBreak" min="1" max="10" 
                                       value="${this.settings.sessionsUntilLongBreak}" step="1">
                            </div>

                            <div class="settings-group">
                                <label>Daily Goal (sessions)</label>
                                <input type="number" id="pomodoroDailyGoal" min="1" max="20" 
                                       value="${this.dailyGoal}" step="1">
                            </div>
                        </div>

                        <div class="tab-panel" id="advanced-tab">
                            <div class="settings-group checkbox">
                                <label>
                                    <input type="checkbox" id="pomodoroAutoStartBreaks" 
                                           ${this.settings.autoStartBreaks ? 'checked' : ''}>
                                    Auto-start breaks
                                </label>
                            </div>
                            
                            <div class="settings-group checkbox">
                                <label>
                                    <input type="checkbox" id="pomodoroAutoStartWork" 
                                           ${this.settings.autoStartWork ? 'checked' : ''}>
                                    Auto-start work sessions
                                </label>
                            </div>
                            
                            <div class="settings-group checkbox">
                                <label>
                                    <input type="checkbox" id="pomodoroDesktopNotifications" 
                                           ${this.settings.desktopNotifications ? 'checked' : ''}>
                                    Desktop notifications
                                </label>
                            </div>
                            
                            <div class="settings-group checkbox">
                                <label>
                                    <input type="checkbox" id="pomodoroStrictMode" 
                                           ${this.settings.strictMode ? 'checked' : ''}>
                                    Strict mode (can't skip breaks)
                                </label>
                            </div>
                            
                            <div class="settings-group">
                                <label>Theme</label>
                                <select id="pomodoroTheme">
                                    <option value="default" ${this.settings.theme === 'default' ? 'selected' : ''}>Default</option>
                                    <option value="ocean" ${this.settings.theme === 'ocean' ? 'selected' : ''}>Ocean</option>
                                    <option value="sunset" ${this.settings.theme === 'sunset' ? 'selected' : ''}>Sunset</option>
                                    <option value="forest" ${this.settings.theme === 'forest' ? 'selected' : ''}>Forest</option>
                                </select>
                            </div>
                        </div>

                        <div class="tab-panel" id="sounds-tab">
                            <div class="settings-group checkbox">
                                <label>
                                    <input type="checkbox" id="pomodoroSound" 
                                           ${this.settings.soundEnabled ? 'checked' : ''}>
                                    Enable sounds
                                </label>
                            </div>
                            
                            <div class="settings-group checkbox">
                                <label>
                                    <input type="checkbox" id="pomodoroTickSound" 
                                           ${this.settings.tickSound ? 'checked' : ''}>
                                    Tick sound (every second)
                                </label>
                            </div>
                            
                            <div class="settings-group">
                                <label>Volume: <span id="volumeValue">${this.settings.volume}%</span></label>
                                <input type="range" id="pomodoroVolume" min="0" max="100" 
                                       value="${this.settings.volume}" step="1">
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="PomodoroTimer.closeSettings()">Cancel</button>
                        <button class="btn btn-primary" onclick="PomodoroTimer.saveSettingsFromModal()">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderStatsModal() {
        return `
            <div id="pomodoroStatsModal" class="modal hidden">
                <div class="modal-content stats-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-chart-bar"></i> Statistics</h3>
                        <button class="close-btn" onclick="PomodoroTimer.closeStats()">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="stats-summary">
                            <div class="stat-card">
                                <div class="stat-icon">📊</div>
                                <div class="stat-detail">
                                    <span class="stat-value">${this.calculateTotalFocusTime()}</span>
                                    <span class="stat-label">Total Focus Time</span>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">🔥</div>
                                <div class="stat-detail">
                                    <span class="stat-value">${this.calculateCurrentStreak()}</span>
                                    <span class="stat-label">Current Streak</span>
                                </div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-icon">🏆</div>
                                <div class="stat-detail">
                                    <span class="stat-value">${this.calculateBestStreak()}</span>
                                    <span class="stat-label">Best Streak</span>
                                </div>
                            </div>
                        </div>

                        <div class="stats-chart">
                            <h4>Last 7 Days</h4>
                            <div class="week-chart">
                                ${this.renderWeekChart()}
                            </div>
                        </div>

                        <div class="achievements">
                            <h4>Achievements</h4>
                            <div class="achievements-grid">
                                ${this.renderAchievements()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderWeekChart() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekData = this.getWeekData();
        const max = Math.max(...weekData, 1);

        return days.map((day, index) => {
            const value = weekData[index] || 0;
            const height = (value / max) * 100;
            return `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${height}%">
                        <span class="chart-value">${value}</span>
                    </div>
                    <span class="chart-label">${day}</span>
                </div>
            `;
        }).join('');
    },

    renderAchievements() {
        const achievements = this.checkAchievements();
        return achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <span class="achievement-name">${achievement.name}</span>
                    <span class="achievement-desc">${achievement.description}</span>
                </div>
                ${achievement.unlocked ? '<span class="achievement-check">✓</span>' : ''}
            </div>
        `).join('');
    },

    checkAchievements() {
        return [
            {
                name: 'First Pomodoro',
                description: 'Complete your first focus session',
                icon: '🍅',
                unlocked: this.totalSessionsToday > 0
            },
            {
                name: 'Focus Master',
                description: 'Complete 10 focus sessions',
                icon: '🎯',
                unlocked: this.sessionsCompleted >= 10
            },
            {
                name: 'Productivity Star',
                description: 'Complete 5 sessions in one day',
                icon: '⭐',
                unlocked: this.totalSessionsToday >= 5
            },
            {
                name: 'Consistency King',
                description: 'Maintain a 7-day streak',
                icon: '👑',
                unlocked: this.calculateCurrentStreak() >= 7
            },
            {
                name: 'Break Time',
                description: 'Complete 20 breaks',
                icon: '☕',
                unlocked: this.getBreakCount() >= 20
            },
            {
                name: 'Century Club',
                description: 'Accumulate 100 total focus sessions',
                icon: '💯',
                unlocked: this.sessionsCompleted >= 100
            }
        ];
    },

    getProgressPercentage() {
        let totalTime;
        switch (this.currentMode) {
            case 'shortBreak':
                totalTime = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                totalTime = this.settings.longBreakDuration * 60;
                break;
            default:
                totalTime = this.settings.workDuration * 60;
        }
        return ((totalTime - this.timeLeft) / totalTime) * 100;
    },

    setMode(mode) {
        if (this.isRunning && this.settings.strictMode && this.currentMode !== 'work' && mode === 'work') {
            NotificationSystem.warning('Complete your break first!', 2000);
            return;
        }

        this.currentMode = mode;
        
        switch (mode) {
            case 'shortBreak':
                this.timeLeft = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                this.timeLeft = this.settings.longBreakDuration * 60;
                break;
            default:
                this.timeLeft = this.settings.workDuration * 60;
        }
        
        this.isRunning = false;
        this.isPaused = false;
        this.updateDisplay();
        this.render();
    },

    loadSettings() {
        const stored = DataManager.get(DataManager.STORAGE_KEYS.POMODORO_SETTINGS, null);
        if (stored) {
            this.settings = { ...this.settings, ...stored };
        }
        this.dailyGoal = this.settings.dailyGoal;

        // Set initial time based on mode
        this.setMode(this.currentMode);
    },

    saveSettings() {
        DataManager.set(DataManager.STORAGE_KEYS.POMODORO_SETTINGS, this.settings);
    },

    loadTodaySessions() {
        const today = new Date().toISOString().split('T')[0];
        const stored = DataManager.get(DataManager.STORAGE_KEYS.POMODORO_SESSIONS, {});

        if (stored.date === today) {
            this.totalSessionsToday = stored.count || 0;
            this.totalFocusTime = stored.focusTime || 0;
        } else {
            this.totalSessionsToday = 0;
            this.totalFocusTime = 0;
        }
    },

    saveTodaySessions() {
        const today = new Date().toISOString().split('T')[0];
        DataManager.set(DataManager.STORAGE_KEYS.POMODORO_SESSIONS, {
            date: today,
            count: this.totalSessionsToday,
            focusTime: this.totalFocusTime
        });
    },

    loadSessionHistory() {
        const stored = DataManager.get('pomodoro_history', []);
        this.sessionHistory = stored;
    },

    saveSessionHistory() {
        DataManager.set('pomodoro_history', this.sessionHistory.slice(-50)); // Keep last 50 sessions
    },

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();

        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                
                // Play tick sound if enabled
                if (this.settings.tickSound && this.settings.soundEnabled && this.timeLeft % 60 === 0) {
                    this.playTickSound();
                }
                
                this.updateDisplay();
                
                // Update document title with timer
                document.title = this.formatTime(this.timeLeft) + ' - LifeOS';
            } else {
                this.complete();
            }
        }, 1000);

        this.updateButtonStates();
    },

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.timer);
        this.updateButtonStates();
    },

    resume() {
        if (!this.isPaused) return;
        this.start();
    },

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        clearInterval(this.timer);
        this.setMode(this.currentMode);
        this.updateButtonStates();
    },

    complete() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;

        // Calculate actual session duration
        const sessionDuration = this.startTime ? 
            Math.round((Date.now() - this.startTime) / 60000) : 
            this.settings.workDuration;

        // Record session
        this.recordSession(this.currentMode, sessionDuration);

        // Play sound
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }

        // Show desktop notification
        if (this.settings.desktopNotifications && Notification.permission === 'granted') {
            this.showDesktopNotification();
        }

        if (this.currentMode === 'work') {
            this.sessionsCompleted++;
            this.totalSessionsToday++;
            this.totalFocusTime += sessionDuration;
            this.saveTodaySessions();

            NotificationSystem.success(`Work session complete! 🎉 (${sessionDuration} min)`, 3000);

            // Check daily goal
            if (this.totalSessionsToday === this.dailyGoal) {
                NotificationSystem.success('🎉 Daily goal achieved! Great job! 🎉', 4000);
                this.playAchievementSound();
            }

            // Determine next break type
            if (this.sessionsCompleted % this.settings.sessionsUntilLongBreak === 0) {
                this.setMode('longBreak');
                NotificationSystem.info('Time for a long break! ☕', 3000);
            } else {
                this.setMode('shortBreak');
                NotificationSystem.info('Time for a short break! 🧘', 3000);
            }

            // Update stats
            this.updateSessionStats();
        } else {
            NotificationSystem.info('Break over! Ready to work? 💪', 3000);
            this.setMode('work');
        }

        // Auto-start if enabled
        if ((this.currentMode !== 'work' && this.settings.autoStartBreaks) ||
            (this.currentMode === 'work' && this.settings.autoStartWork)) {
            setTimeout(() => this.start(), 1000);
        }

        this.updateButtonStates();
        this.render(); // Re-render to show updated stats
    },

    recordSession(type, duration) {
        const session = {
            type: type,
            duration: duration,
            date: new Date().toISOString(),
            completed: true
        };
        
        this.sessionHistory.push(session);
        this.saveSessionHistory();
    },

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(this.settings.volume / 100, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    playTickSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 400;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime((this.settings.volume / 100) * 0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    playAchievementSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;

            // Play a little fanfare
            const frequencies = [523.25, 659.25, 783.99]; // C, E, G
            frequencies.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime((this.settings.volume / 100) * 0.3, now + i * 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                
                oscillator.start(now + i * 0.1);
                oscillator.stop(now + i * 0.1 + 0.3);
            });
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    showDesktopNotification() {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
            return;
        }

        let title, body;
        if (this.currentMode === 'work') {
            title = '🍅 Pomodoro Complete!';
            body = `Great job! Time for a ${this.settings.shortBreakDuration} minute break.`;
        } else {
            title = '☕ Break Complete!';
            body = 'Break is over. Time to focus!';
        }

        new Notification(title, {
            body: body,
            icon: '/icons/pomodoro-192.png',
            silent: true
        });
    },

    skip() {
        if (this.settings.strictMode && this.currentMode !== 'work') {
            NotificationSystem.warning('Strict mode enabled - cannot skip breaks', 2000);
            return;
        }

        this.stop();

        if (this.currentMode === 'work') {
            if (this.sessionsCompleted % this.settings.sessionsUntilLongBreak === 0) {
                this.setMode('longBreak');
            } else {
                this.setMode('shortBreak');
            }
        } else {
            this.setMode('work');
        }
    },

    reset() {
        if (confirm('Reset all progress? This will clear today\'s sessions.')) {
            this.stop();
            this.sessionsCompleted = 0;
            this.totalSessionsToday = 0;
            this.totalFocusTime = 0;
            this.sessionHistory = [];
            this.saveTodaySessions();
            this.saveSessionHistory();
            this.updateSessionStats();
            this.render();
            NotificationSystem.info('Timer reset!', 2000);
        }
    },

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update timer display if elements exist
        const timerDisplay = document.querySelector('.timer-time');
        if (timerDisplay) {
            timerDisplay.textContent = timeDisplay;
        }

        // Update document title
        document.title = timeDisplay + ' - LifeOS';

        // Update progress circle
        this.updateProgressCircle();
    },

    updateProgressCircle() {
        const progress = this.getProgressPercentage();
        const circle = document.querySelector('.progress-ring-fill');
        if (circle) {
            const radius = 140;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference * (1 - progress / 100);
            circle.style.strokeDashoffset = offset;
        }
    },

    updateButtonStates() {
        const startBtn = document.querySelector('.timer-btn.primary');
        const pauseBtn = document.querySelector('.timer-btn.warning');
        
        if (startBtn) {
            startBtn.innerHTML = this.isRunning ? 
                '<i class="fas fa-pause"></i> Pause' : 
                '<i class="fas fa-play"></i> Start';
            startBtn.className = `timer-btn ${this.isRunning ? 'warning' : 'primary'}`;
        }
    },

    updateSessionStats() {
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = this.totalSessionsToday;
            statValues[1].textContent = this.totalFocusTime;
            statValues[2].textContent = this.sessionsCompleted;
        }

        // Update daily goal progress
        const goalProgress = (this.totalSessionsToday / this.dailyGoal) * 100;
        const progressFill = document.querySelector('.goal-progress-fill');
        const goalHeader = document.querySelector('.goal-header');
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(goalProgress, 100)}%`;
        }
        if (goalHeader) {
            goalHeader.innerHTML = `
                <span>Daily Goal: ${this.totalSessionsToday}/${this.dailyGoal} sessions</span>
                <span>${Math.round(goalProgress)}%</span>
            `;
        }
    },

    startClock() {
        setInterval(() => {
            const now = new Date();
            const timeDisplay = document.getElementById('currentTime');
            if (timeDisplay) {
                timeDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }, 1000);
    },

    updateQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        this.currentQuote = this.quotes[randomIndex];
        
        const quoteElement = document.querySelector('.quote-text');
        if (quoteElement) {
            quoteElement.textContent = `"${this.currentQuote}"`;
        }
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Statistics methods
    calculateTotalFocusTime() {
        const total = this.sessionHistory
            .filter(s => s.type === 'work')
            .reduce((sum, s) => sum + s.duration, 0);
        
        const hours = Math.floor(total / 60);
        const minutes = total % 60;
        
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    },

    calculateCurrentStreak() {
        // Simple streak calculation based on consecutive days with sessions
        const dates = [...new Set(this.sessionHistory.map(s => s.date.split('T')[0]))].sort();
        if (dates.length === 0) return 0;

        let streak = 1;
        let currentDate = new Date(dates[dates.length - 1]);
        
        for (let i = dates.length - 2; i >= 0; i--) {
            const prevDate = new Date(dates[i]);
            const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                streak++;
                currentDate = prevDate;
            } else if (diffDays > 1) {
                break;
            }
        }
        
        return streak;
    },

    calculateBestStreak() {
        // Calculate best streak from history
        const dates = [...new Set(this.sessionHistory.map(s => s.date.split('T')[0]))].sort();
        if (dates.length === 0) return 0;

        let bestStreak = 1;
        let currentStreak = 1;
        
        for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(dates[i - 1]);
            const currDate = new Date(dates[i]);
            const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else if (diffDays > 1) {
                currentStreak = 1;
            }
        }
        
        return bestStreak;
    },

    getWeekData() {
        const weekData = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

        this.sessionHistory.forEach(session => {
            if (session.type === 'work') {
                const sessionDate = new Date(session.date);
                if (sessionDate >= startOfWeek && sessionDate <= today) {
                    const dayIndex = sessionDate.getDay() - 1; // 0 = Monday
                    if (dayIndex >= 0 && dayIndex < 7) {
                        weekData[dayIndex] += session.duration;
                    }
                }
            }
        });

        return weekData;
    },

    getBreakCount() {
        return this.sessionHistory.filter(s => s.type.includes('Break')).length;
    },

    // Modal methods
    openSettings() {
        const modal = document.getElementById('pomodoroSettingsModal');
        if (modal) {
            // Populate current settings
            const workInput = document.getElementById('pomodoroWorkDuration');
            const shortInput = document.getElementById('pomodoroShortBreak');
            const longInput = document.getElementById('pomodoroLongBreak');
            const sessionsUntilLongBreak = document.getElementById('pomodoroSessionsUntilLongBreak');
            const dailyGoal = document.getElementById('pomodoroDailyGoal');
            const autoStartBreaks = document.getElementById('pomodoroAutoStartBreaks');
            const autoStartWork = document.getElementById('pomodoroAutoStartWork');
            const desktopNotifications = document.getElementById('pomodoroDesktopNotifications');
            const strictMode = document.getElementById('pomodoroStrictMode');
            const theme = document.getElementById('pomodoroTheme');
            const soundCheck = document.getElementById('pomodoroSound');
            const tickSound = document.getElementById('pomodoroTickSound');
            const volume = document.getElementById('pomodoroVolume');

            if (workInput) workInput.value = this.settings.workDuration;
            if (shortInput) shortInput.value = this.settings.shortBreakDuration;
            if (longInput) longInput.value = this.settings.longBreakDuration;
            if (sessionsUntilLongBreak) sessionsUntilLongBreak.value = this.settings.sessionsUntilLongBreak;
            if (dailyGoal) dailyGoal.value = this.dailyGoal;
            if (autoStartBreaks) autoStartBreaks.checked = this.settings.autoStartBreaks;
            if (autoStartWork) autoStartWork.checked = this.settings.autoStartWork;
            if (desktopNotifications) desktopNotifications.checked = this.settings.desktopNotifications;
            if (strictMode) strictMode.checked = this.settings.strictMode;
            if (theme) theme.value = this.settings.theme;
            if (soundCheck) soundCheck.checked = this.settings.soundEnabled;
            if (tickSound) tickSound.checked = this.settings.tickSound;
            if (volume) {
                volume.value = this.settings.volume;
                document.getElementById('volumeValue').textContent = this.settings.volume + '%';
            }

            // Setup tabs
            this.setupSettingsTabs();

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    },

    setupSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tabs .tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs and panels
                document.querySelectorAll('.settings-tabs .tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                
                // Add active to clicked tab
                tab.classList.add('active');
                
                // Show corresponding panel
                const tabId = tab.dataset.tab;
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    },

    closeSettings() {
        const modal = document.getElementById('pomodoroSettingsModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    saveSettingsFromModal() {
        const workInput = document.getElementById('pomodoroWorkDuration');
        const shortInput = document.getElementById('pomodoroShortBreak');
        const longInput = document.getElementById('pomodoroLongBreak');
        const sessionsUntilLongBreak = document.getElementById('pomodoroSessionsUntilLongBreak');
        const dailyGoal = document.getElementById('pomodoroDailyGoal');
        const autoStartBreaks = document.getElementById('pomodoroAutoStartBreaks');
        const autoStartWork = document.getElementById('pomodoroAutoStartWork');
        const desktopNotifications = document.getElementById('pomodoroDesktopNotifications');
        const strictMode = document.getElementById('pomodoroStrictMode');
        const theme = document.getElementById('pomodoroTheme');
        const soundCheck = document.getElementById('pomodoroSound');
        const tickSound = document.getElementById('pomodoroTickSound');
        const volume = document.getElementById('pomodoroVolume');

        if (workInput) this.settings.workDuration = parseInt(workInput.value) || 25;
        if (shortInput) this.settings.shortBreakDuration = parseInt(shortInput.value) || 5;
        if (longInput) this.settings.longBreakDuration = parseInt(longInput.value) || 15;
        if (sessionsUntilLongBreak) this.settings.sessionsUntilLongBreak = parseInt(sessionsUntilLongBreak.value) || 4;
        if (dailyGoal) this.dailyGoal = parseInt(dailyGoal.value) || 4;
        if (autoStartBreaks) this.settings.autoStartBreaks = autoStartBreaks.checked;
        if (autoStartWork) this.settings.autoStartWork = autoStartWork.checked;
        if (desktopNotifications) this.settings.desktopNotifications = desktopNotifications.checked;
        if (strictMode) this.settings.strictMode = strictMode.checked;
        if (theme) this.settings.theme = theme.value;
        if (soundCheck) this.settings.soundEnabled = soundCheck.checked;
        if (tickSound) this.settings.tickSound = tickSound.checked;
        if (volume) this.settings.volume = parseInt(volume.value);

        this.settings.dailyGoal = this.dailyGoal;
        this.saveSettings();

        // Apply theme
        this.applyTheme();

        // Restart with new settings if not running
        if (!this.isRunning && !this.isPaused) {
            this.setMode(this.currentMode);
        }

        this.closeSettings();
        this.render(); // Re-render to update UI
        NotificationSystem.success('Settings saved!', 2000);
    },

    applyTheme() {
        const root = document.documentElement;
        switch (this.settings.theme) {
            case 'ocean':
                root.style.setProperty('--accent-primary', '#3b82f6');
                root.style.setProperty('--accent-success', '#10b981');
                root.style.setProperty('--accent-warning', '#f59e0b');
                break;
            case 'sunset':
                root.style.setProperty('--accent-primary', '#f97316');
                root.style.setProperty('--accent-success', '#10b981');
                root.style.setProperty('--accent-warning', '#f43f5e');
                break;
            case 'forest':
                root.style.setProperty('--accent-primary', '#22c55e');
                root.style.setProperty('--accent-success', '#3b82f6');
                root.style.setProperty('--accent-warning', '#eab308');
                break;
            default:
                root.style.setProperty('--accent-primary', '#8b5cf6');
                root.style.setProperty('--accent-success', '#10b981');
                root.style.setProperty('--accent-warning', '#f59e0b');
        }
    },

    showStats() {
        const modal = document.getElementById('pomodoroStatsModal');
        if (modal) {
            // Refresh stats content
            const statsBody = modal.querySelector('.modal-body');
            if (statsBody) {
                // Update stats dynamically
                statsBody.innerHTML = this.renderStatsModal().match(/<div class="modal-body">(.*?)<\/div>/s)[1];
            }
            
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    },

    closeStats() {
        const modal = document.getElementById('pomodoroStatsModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    },

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Request notification permission
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }

            // Start button
            const startBtn = document.getElementById('pomodoroStart');
            if (startBtn) {
                startBtn.addEventListener('click', () => this.start());
            }

            // Pause button
            const pauseBtn = document.getElementById('pomodoroPause');
            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => this.pause());
            }

            // Stop button
            const stopBtn = document.getElementById('pomodoroStop');
            if (stopBtn) {
                stopBtn.addEventListener('click', () => this.stop());
            }

            // Skip button
            const skipBtn = document.getElementById('pomodoroSkip');
            if (skipBtn) {
                skipBtn.addEventListener('click', () => this.skip());
            }

            // Reset button
            const resetBtn = document.getElementById('pomodoroReset');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.reset());
            }

            // Mode buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.currentTarget.textContent.toLowerCase().includes('focus') ? 'work' :
                                 e.currentTarget.textContent.toLowerCase().includes('short') ? 'shortBreak' : 'longBreak';
                    this.setMode(mode);
                });
            });

            // Volume slider
            const volumeSlider = document.getElementById('pomodoroVolume');
            if (volumeSlider) {
                volumeSlider.addEventListener('input', (e) => {
                    document.getElementById('volumeValue').textContent = e.target.value + '%';
                });
            }

            // Quote refresh
            document.addEventListener('click', (e) => {
                if (e.target.closest('.quote-refresh')) {
                    this.updateQuote();
                }
            });

            // Close modals on outside click
            window.addEventListener('click', (e) => {
                const settingsModal = document.getElementById('pomodoroSettingsModal');
                const statsModal = document.getElementById('pomodoroStatsModal');
                
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
                if (e.target === statsModal) {
                    this.closeStats();
                }
            });
        });
    }
};

// Make available globally
window.PomodoroTimer = PomodoroTimer;