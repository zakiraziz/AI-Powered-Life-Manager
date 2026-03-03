// ===== pomodoroTimer.js - Pomodoro Focus Timer Module =====

const PomodoroTimer = {
    timer: null,
    timeLeft: 25 * 60, // 25 minutes in seconds
    isRunning: false,
    isPaused: false,
    currentMode: 'work', // work, shortBreak, longBreak
    sessionsCompleted: 0,
    totalSessionsToday: 0,
    
    // Timer settings
    settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
        autoStartBreaks: false,
        autoStartWork: false,
        soundEnabled: true
    },

    init() {
        this.loadSettings();
        this.loadTodaySessions();
        this.updateDisplay();
        this.setupEventListeners();
        this.startClock();
        console.log('[PomodoroTimer] Initialized');
    },

    loadSettings() {
        const stored = DataManager.get(DataManager.STORAGE_KEYS.POMODORO_SETTINGS, null);
        if (stored) {
            this.settings = { ...this.settings, ...stored };
        }
        
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
        } else {
            this.totalSessionsToday = 0;
        }
    },

    saveTodaySessions() {
        const today = new Date().toISOString().split('T')[0];
        DataManager.set(DataManager.STORAGE_KEYS.POMODORO_SESSIONS, {
            date: today,
            count: this.totalSessionsToday
        });
    },

    setMode(mode) {
        this.currentMode = mode;
        
        switch(mode) {
            case 'work':
                this.timeLeft = this.settings.workDuration * 60;
                break;
            case 'shortBreak':
                this.timeLeft = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                this.timeLeft = this.settings.longBreakDuration * 60;
                break;
        }
        
        this.isRunning = false;
        this.isPaused = false;
        this.updateDisplay();
        this.updateModeIndicator();
    },

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateDisplay();
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
        clearInterval(this.timer);
        this.setMode(this.currentMode);
        this.updateButtonStates();
    },

    complete() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        
        // Play sound
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
        
        if (this.currentMode === 'work') {
            this.sessionsCompleted++;
            this.totalSessionsToday++;
            this.saveTodaySessions();
            
            NotificationSystem.success('Work session complete! 🎉', 3000);
            
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
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch(e) {
            console.log('Audio not supported');
        }
    },

    skip() {
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
        this.stop();
        this.sessionsCompleted = 0;
        this.totalSessionsToday = 0;
        this.saveTodaySessions();
        this.updateSessionStats();
        NotificationSystem.info('Timer reset!', 2000);
    },

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        
        const display = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        
        const timerDisplay = document.getElementById('pomodoroDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = display;
        }
        
        // Update document title
        document.title = display + ' - LifeOS';
        
        // Update progress circle
        this.updateProgressCircle();
    },

    updateProgressCircle() {
        let totalTime;
        switch(this.currentMode) {
            case 'work':
                totalTime = this.settings.workDuration * 60;
                break;
            case 'shortBreak':
                totalTime = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                totalTime = this.settings.longBreakDuration * 60;
                break;
        }
        
        const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
        
        const progressCircle = document.getElementById('pomodoroProgress');
        if (progressCircle) {
            progressCircle.style.background = 'conic-gradient(var(--accent-primary) ' + progress + '%, var(--bg-tertiary) ' + progress + '%)';
        }
    },

    updateModeIndicator() {
        const modeIndicator = document.getElementById('pomodoroMode');
        if (modeIndicator) {
            let modeText = '';
            switch(this.currentMode) {
                case 'work':
                    modeText = 'Focus Time';
                    break;
                case 'shortBreak':
                    modeText = 'Short Break';
                    break;
                case 'longBreak':
                    modeText = 'Long Break';
                    break;
            }
            modeIndicator.textContent = modeText;
        }
        
        // Update mode buttons
        document.querySelectorAll('.pomodoro-mode-btn').forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.dataset.mode === PomodoroTimer.currentMode) {
                btn.classList.add('active');
            }
        });
    },

    updateButtonStates() {
        const startBtn = document.getElementById('pomodoroStart');
        const pauseBtn = document.getElementById('pomodoroPause');
        const stopBtn = document.getElementById('pomodoroStop');
        
        if (startBtn) startBtn.style.display = (!this.isRunning && !this.isPaused) ? 'inline-flex' : 'none';
        if (pauseBtn) pauseBtn.style.display = this.isRunning ? 'inline-flex' : 'none';
        if (stopBtn) stopBtn.style.display = (this.isRunning || this.isPaused) ? 'inline-flex' : 'none';
    },

    updateSessionStats() {
        const completedEl = document.getElementById('pomodoroCompleted');
        const todayEl = document.getElementById('pomodoroToday');
        
        if (completedEl) completedEl.textContent = this.sessionsCompleted;
        if (todayEl) todayEl.textContent = this.totalSessionsToday;
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

    openSettings() {
        const modal = document.getElementById('pomodoroSettingsModal');
        if (modal) {
            // Populate current settings
            const workInput = document.getElementById('pomodoroWorkDuration');
            const shortInput = document.getElementById('pomodoroShortBreak');
            const longInput = document.getElementById('pomodoroLongBreak');
            const soundCheck = document.getElementById('pomodoroSound');
            
            if (workInput) workInput.value = this.settings.workDuration;
            if (shortInput) shortInput.value = this.settings.shortBreakDuration;
            if (longInput) longInput.value = this.settings.longBreakDuration;
            if (soundCheck) soundCheck.checked = this.settings.soundEnabled;
            
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
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
        const soundCheck = document.getElementById('pomodoroSound');
        
        if (workInput) this.settings.workDuration = parseInt(workInput.value) || 25;
        if (shortInput) this.settings.shortBreakDuration = parseInt(shortInput.value) || 5;
        if (longInput) this.settings.longBreakDuration = parseInt(longInput.value) || 15;
        if (soundCheck) this.settings.soundEnabled = soundCheck.checked;
        
        this.saveSettings();
        
        // Restart with new settings if not running
        if (!this.isRunning && !this.isPaused) {
            this.setMode(this.currentMode);
        }
        
        this.closeSettings();
        NotificationSystem.success('Settings saved!', 2000);
    },

    setupEventListeners: function() {
        document.addEventListener('DOMContentLoaded', function() {
            // Start button
            const startBtn = document.getElementById('pomodoroStart');
            if (startBtn) {
                startBtn.addEventListener('click', function() { PomodoroTimer.start(); });
            }
            
            // Pause button
            const pauseBtn = document.getElementById('pomodoroPause');
            if (pauseBtn) {
                pauseBtn.addEventListener('click', function() { PomodoroTimer.pause(); });
            }
            
            // Stop button
            const stopBtn = document.getElementById('pomodoroStop');
            if (stopBtn) {
                stopBtn.addEventListener('click', function() { PomodoroTimer.stop(); });
            }
            
            // Skip button
            const skipBtn = document.getElementById('pomodoroSkip');
            if (skipBtn) {
                skipBtn.addEventListener('click', function() { PomodoroTimer.skip(); });
            }
            
            // Reset button
            const resetBtn = document.getElementById('pomodoroReset');
            if (resetBtn) {
                resetBtn.addEventListener('click', function() { PomodoroTimer.reset(); });
            }
            
            // Mode buttons
            document.querySelectorAll('.pomodoro-mode-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    PomodoroTimer.setMode(this.dataset.mode);
                });
            });
            
            // Settings button
            const settingsBtn = document.getElementById('pomodoroSettingsBtn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', function() { PomodoroTimer.openSettings(); });
            }
            
            // Save settings
            const saveSettingsBtn = document.getElementById('savePomodoroSettings');
            if (saveSettingsBtn) {
                saveSettingsBtn.addEventListener('click', function() { PomodoroTimer.saveSettingsFromModal(); });
            }
            
            // Close settings
            const closeSettingsBtn = document.getElementById('closePomodoroSettings');
            if (closeSettingsBtn) {
                closeSettingsBtn.addEventListener('click', function() { PomodoroTimer.closeSettings(); });
            }
        });
    }
};

// Make available globally
window.PomodoroTimer = PomodoroTimer;
