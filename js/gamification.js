// ===== gamification.js - Gamification & Achievements System =====

const Gamification = {
    // User stats
    stats: {
        totalPoints: 0,
        level: 1,
        experience: 0,
        streakDays: 0,
        tasksCompleted: 0,
        habitsCompleted: 0,
        pomodorosCompleted: 0,
        perfectDays: 0
    },
    
    // Achievements
    achievements: [
        // Task Achievements
        { id: 'first_task', name: 'Getting Started', description: 'Complete your first task', icon: 'fa-star', category: 'tasks', requirement: 1, type: 'tasks_completed' },
        { id: 'ten_tasks', name: 'Task Tackler', description: 'Complete 10 tasks', icon: 'fa-tasks', category: 'tasks', requirement: 10, type: 'tasks_completed' },
        { id: 'fifty_tasks', name: 'Productive Pro', description: 'Complete 50 tasks', icon: 'fa-bolt', category: 'tasks', requirement: 50, type: 'tasks_completed' },
        { id: 'hundred_tasks', name: 'Task Master', description: 'Complete 100 tasks', icon: 'fa-crown', category: 'tasks', requirement: 100, type: 'tasks_completed' },
        
        // Habit Achievements
        { id: 'first_habit', name: 'Habit Former', description: 'Complete your first habit', icon: 'fa-seedling', category: 'habits', requirement: 1, type: 'habits_completed' },
        { id: 'week_streak', name: 'Week Warrior', description: '7 day streak', icon: 'fa-fire', category: 'habits', requirement: 7, type: 'streak_days' },
        { id: 'month_streak', name: 'Monthly Master', description: '30 day streak', icon: 'fa-calendar-check', category: 'habits', requirement: 30, type: 'streak_days' },
        
        // Pomodoro Achievements
        { id: 'first_pomodoro', name: 'Focus Beginner', description: 'Complete your first pomodoro', icon: 'fa-clock', category: 'pomodoro', requirement: 1, type: 'pomodoros_completed' },
        { id: 'ten_pomodoros', name: 'Focus Apprentice', description: 'Complete 10 pomodoros', icon: 'fa-hourglass-half', category: 'pomodoro', requirement: 10, type: 'pomodoros_completed' },
        { id: 'fifty_pomodoros', name: 'Focus Master', description: 'Complete 50 pomodoros', icon: 'fa-medal', category: 'pomodoro', requirement: 50, type: 'pomodoros_completed' },
        
        // Streak Achievements
        { id: 'three_day_streak', name: 'Consistent', description: '3 day login streak', icon: 'fa-calendar-plus', category: 'streak', requirement: 3, type: 'streak_days' },
        { id: 'seven_day_streak', name: 'On Fire', description: '7 day login streak', icon: 'fa-fire-alt', category: 'streak', requirement: 7, type: 'streak_days' },
        
        // Level Achievements
        { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: 'fa-arrow-up', category: 'level', requirement: 5, type: 'level' },
        { id: 'level_10', name: 'Superstar', description: 'Reach level 10', icon: 'fa-star-half-alt', category: 'level', requirement: 10, type: 'level' },
        
        // Special Achievements
        { id: 'perfect_day', name: 'Perfect Day', description: 'Complete all tasks in a day', icon: 'fa-sun', category: 'special', requirement: 1, type: 'perfect_days' },
        { id: 'early_bird', name: 'Early Bird', description: 'Complete a task before 8 AM', icon: 'fa-sunrise', category: 'special', requirement: 1, type: 'early_bird' },
        { id: 'night_owl', name: 'Night Owl', description: 'Complete a task after 10 PM', icon: 'fa-moon', category: 'special', requirement: 1, type: 'night_owl' }
    ],
    
    // Unlocked achievements
    unlockedAchievements: [],
    
    // Daily goals
    dailyGoals: {
        tasks: 5,
        habits: 3,
        pomodoros: 4,
        water: 8
    },
    
    // Initialize gamification
    init() {
        this.loadStats();
        this.loadAchievements();
        this.checkDailyStreak();
        this.updateUI();
        this.startDailyReset();
    },
    
    // Load stats from storage
    loadStats() {
        const stored = localStorage.getItem('lifeos_gamification_stats');
        if (stored) {
            this.stats = { ...this.stats, ...JSON.parse(stored) };
        }
        
        // Check login streak
        const lastLogin = localStorage.getItem('lifeos_last_login');
        const today = new Date().toDateString();
        
        if (lastLogin) {
            const lastDate = new Date(lastLogin);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Consecutive day
                this.stats.streakDays++;
            } else if (diffDays > 1) {
                // Streak broken
                this.stats.streakDays = 1;
            }
        } else {
            this.stats.streakDays = 1;
        }
        
        // Update last login
        localStorage.setItem('lifeos_last_login', today);
    },
    
    // Save stats to storage
    saveStats() {
        localStorage.setItem('lifeos_gamification_stats', JSON.stringify(this.stats));
    },
    
    // Load achievements from storage
    loadAchievements() {
        const stored = localStorage.getItem('lifeos_unlocked_achievements');
        if (stored) {
            this.unlockedAchievements = JSON.parse(stored);
        }
    },
    
    // Save achievements to storage
    saveAchievements() {
        localStorage.setItem('lifeos_unlocked_achievements', JSON.stringify(this.unlockedAchievements));
    },
    
    // Check and update streak
    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = localStorage.getItem('lifeos_last_active');
        
        if (lastActive !== today) {
            // Check if it was yesterday
            if (lastActive) {
                const lastDate = new Date(lastActive);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays > 1) {
                    this.stats.streakDays = 0;
                }
            }
            
            localStorage.setItem('lifeos_last_active', today);
            this.addPoints(10, 'Daily login bonus');
        }
    },
    
    // Add points
    addPoints(amount, reason = '') {
        this.stats.totalPoints += amount;
        this.stats.experience += amount;
        
        // Check for level up
        const expForLevel = this.stats.level * 100;
        if (this.stats.experience >= expForLevel) {
            this.levelUp();
        }
        
        this.saveStats();
        this.updateUI();
        
        // Show notification
        this.showPointsNotification(amount, reason);
    },
    
    // Level up
    levelUp() {
        this.stats.level++;
        this.stats.experience = this.stats.experience - (this.stats.level - 1) * 100;
        
        // Level up achievements
        this.checkAchievements();
        
        // Show celebration
        this.showLevelUpCelebration();
    },
    
    // Complete task - called when a task is completed
    onTaskComplete(task) {
        this.stats.tasksCompleted++;
        
        // Check for early bird
        const hour = new Date().getHours();
        if (hour < 8) {
            this.unlockAchievement('early_bird');
        }
        
        // Check for night owl
        if (hour >= 22) {
            this.unlockAchievement('night_owl');
        }
        
        // Check for perfect day
        this.checkPerfectDay();
        
        this.addPoints(10, 'Task completed');
        this.checkAchievements();
    },
    
    // Complete habit - called when a habit is completed
    onHabitComplete() {
        this.stats.habitsCompleted++;
        
        // Update streak
        this.updateHabitStreak();
        
        this.addPoints(15, 'Habit completed');
        this.checkAchievements();
    },
    
    // Complete pomodoro
    onPomodoroComplete() {
        this.stats.pomodorosCompleted++;
        this.addPoints(20, 'Pomodoro completed');
        this.checkAchievements();
    },
    
    // Check perfect day
    checkPerfectDay() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const today = new Date().toDateString();
        
        const todayTasks = tasks.filter(t => {
            const taskDate = new Date(t.dueDate).toDateString();
            return taskDate === today;
        });
        
        const allCompleted = todayTasks.length > 0 && todayTasks.every(t => t.completed);
        
        if (allCompleted) {
            this.stats.perfectDays++;
            this.unlockAchievement('perfect_day');
            this.addPoints(50, 'Perfect day bonus!');
        }
    },
    
    // Update habit streak
    updateHabitStreak() {
        const habits = JSON.parse(localStorage.getItem('lifeos_habits') || '[]');
        let maxStreak = 0;
        
        habits.forEach(habit => {
            if (habit.completedDates) {
                const streak = this.calculateStreak(habit.completedDates);
                if (streak > maxStreak) maxStreak = streak;
            }
        });
        
        if (maxStreak > this.stats.streakDays) {
            this.stats.streakDays = maxStreak;
        }
    },
    
    // Calculate streak from dates
    calculateStreak(dates) {
        if (!dates || dates.length === 0) return 0;
        
        const sortedDates = dates.map(d => new Date(d).toDateString()).sort().reverse();
        let streak = 0;
        let currentDate = new Date();
        
        for (const dateStr of sortedDates) {
            if (dateStr === currentDate.toDateString()) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (new Date(dateStr) < currentDate) {
                break;
            }
        }
        
        return streak;
    },
    
    // Check achievements
    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (this.unlockedAchievements.includes(achievement.id)) return;
            
            let currentValue = 0;
            
            switch (achievement.type) {
                case 'tasks_completed':
                    currentValue = this.stats.tasksCompleted;
                    break;
                case 'habits_completed':
                    currentValue = this.stats.habitsCompleted;
                    break;
                case 'pomodoros_completed':
                    currentValue = this.stats.pomodorosCompleted;
                    break;
                case 'streak_days':
                    currentValue = this.stats.streakDays;
                    break;
                case 'level':
                    currentValue = this.stats.level;
                    break;
                case 'perfect_days':
                    currentValue = this.stats.perfectDays;
                    break;
            }
            
            if (currentValue >= achievement.requirement) {
                this.unlockAchievement(achievement.id);
            }
        });
    },
    
    // Unlock achievement
    unlockAchievement(achievementId) {
        if (this.unlockedAchievements.includes(achievementId)) return;
        
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;
        
        this.unlockedAchievements.push(achievementId);
        this.saveAchievements();
        
        // Bonus points for achievement
        const bonusPoints = 50;
        this.addPoints(bonusPoints, `Achievement: ${achievement.name}`);
        
        // Show celebration
        this.showAchievementCelebration(achievement);
    },
    
    // Show points notification
    showPointsNotification(amount, reason) {
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `
            <div class="points-popup" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, var(--accent-primary), #8b5cf6);
                color: white;
                padding: 1.5rem 2rem;
                border-radius: 16px;
                text-align: center;
                z-index: 10000;
                animation: pointsPop 1.5s ease forwards;
                box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
            ">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-plus-circle"></i>
                </div>
                <div style="font-size: 1.5rem; font-weight: bold;">+${amount} XP</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">${reason}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1500);
    },
    
    // Show achievement celebration
    showAchievementCelebration(achievement) {
        const celebration = document.createElement('div');
        celebration.className = 'achievement-celebration';
        celebration.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--bg-primary);
                border: 2px solid #fbbf24;
                color: var(--text-primary);
                padding: 2rem;
                border-radius: 20px;
                text-align: center;
                z-index: 10000;
                animation: achievementPop 0.5s ease;
                min-width: 300px;
                box-shadow: 0 0 60px rgba(251, 191, 36, 0.3);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem; animation: bounce 0.6s ease infinite;">
                    <i class="fas ${achievement.icon}" style="color: #fbbf24;"></i>
                </div>
                <h2 style="color: #fbbf24; margin: 0 0 0.5rem 0;">Achievement Unlocked!</h2>
                <h3 style="margin: 0 0 0.5rem 0;">${achievement.name}</h3>
                <p style="color: var(--text-secondary); margin: 0 0 1rem 0;">${achievement.description}</p>
                <div style="
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    color: #000;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    display: inline-block;
                    font-weight: bold;
                ">
                    +50 XP
                </div>
            </div>
            <div style="
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            "></div>
        `;
        
        document.body.appendChild(celebration);
        
        // Play sound if available
        this.playAchievementSound();
        
        setTimeout(() => celebration.remove(), 3000);
    },
    
    // Show level up celebration
    showLevelUpCelebration() {
        const celebration = document.createElement('div');
        celebration.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #8b5cf6, #ec4899);
                color: white;
                padding: 2rem 3rem;
                border-radius: 20px;
                text-align: center;
                z-index: 10000;
                animation: levelUpPop 0.5s ease;
                box-shadow: 0 0 60px rgba(139, 92, 246, 0.5);
            ">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <h2 style="margin: 0 0 0.5rem 0;">LEVEL UP!</h2>
                <div style="font-size: 3rem; font-weight: bold;">${this.stats.level}</div>
                <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Keep up the great work!</p>
            </div>
            <div style="
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            "></div>
        `;
        
        document.body.appendChild(celebration);
        this.playLevelUpSound();
        setTimeout(() => celebration.remove(), 3000);
    },
    
    // Play achievement sound (using Web Audio API)
    playAchievementSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        } catch (e) {
            // Ignore audio errors
        }
    },
    
    // Play level up sound
    playLevelUpSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.2);
                
                oscillator.start(audioContext.currentTime + i * 0.1);
                oscillator.stop(audioContext.currentTime + i * 0.1 + 0.2);
            });
        } catch (e) {
            // Ignore audio errors
        }
    },
    
    // Start daily reset
    startDailyReset() {
        // Reset at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            this.resetDailyProgress();
            this.startDailyReset(); // Schedule next reset
        }, msUntilMidnight);
    },
    
    // Reset daily progress
    resetDailyProgress() {
        // Could track daily stats here
        console.log('Daily progress reset');
    },
    
    // Update UI
    updateUI() {
        // Update level display
        const levelEl = document.getElementById('userLevel');
        if (levelEl) {
            levelEl.textContent = this.stats.level;
        }
        
        // Update nav level
        const navLevelEl = document.getElementById('navLevel');
        if (navLevelEl) {
            navLevelEl.textContent = this.stats.level;
        }
        
        // Update level badge
        const levelBadge = document.getElementById('userLevelBadge');
        if (levelBadge) {
            levelBadge.innerHTML = `<i class="fas fa-star"></i> <span>${this.stats.level}</span>`;
        }
        
        // Update points display
        const pointsEl = document.getElementById('userPoints');
        if (pointsEl) {
            pointsEl.textContent = this.stats.totalPoints.toLocaleString();
        }
        
        // Update streak display
        const streakEl = document.getElementById('userStreak');
        if (streakEl) {
            streakEl.innerHTML = `<i class="fas fa-fire"></i> ${this.stats.streakDays}`;
        }
        
        // Update progress bar
        const progressEl = document.getElementById('levelProgress');
        if (progressEl) {
            const expForLevel = this.stats.level * 100;
            const percentage = (this.stats.experience / expForLevel) * 100;
            progressEl.style.width = `${Math.min(percentage, 100)}%`;
        }
        
        // Update achievements badge
        const achievementCount = this.unlockedAchievements.length;
        const achievementBadge = document.getElementById('achievementBadge');
        if (achievementBadge) {
            achievementBadge.textContent = achievementCount;
            achievementBadge.style.display = achievementCount > 0 ? 'flex' : 'none';
        }
    },
    
    // Show stats panel
    showStatsPanel() {
        // Update modal values
        const statLevel = document.getElementById('statLevel');
        const statPoints = document.getElementById('statPoints');
        const statStreak = document.getElementById('statStreak');
        const statAchievements = document.getElementById('statAchievements');
        const xpValue = document.getElementById('xpValue');
        const xpFill = document.getElementById('xpFill');
        
        if (statLevel) statLevel.textContent = this.stats.level;
        if (statPoints) statPoints.textContent = this.stats.totalPoints.toLocaleString();
        if (statStreak) statStreak.textContent = this.stats.streakDays;
        if (statAchievements) statAchievements.textContent = this.unlockedAchievements.length;
        
        const expForLevel = this.stats.level * 100;
        if (xpValue) xpValue.textContent = `${this.stats.experience} / ${expForLevel} XP`;
        if (xpFill) xpFill.style.width = `${Math.min((this.stats.experience / expForLevel) * 100, 100)}%`;
        
        // Show modal
        const modal = document.getElementById('gamificationStatsModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    },
    
    // Get achievements by category
    getAchievementsByCategory(category) {
        return this.achievements.filter(a => a.category === category);
    },
    
    // Render achievements panel
    renderAchievementsPanel() {
        const container = document.getElementById('achievementsContainer');
        if (!container) return;
        
        // Group by category
        const categories = ['tasks', 'habits', 'pomodoro', 'streak', 'level', 'special'];
        
        let html = '';
        
        categories.forEach(category => {
            const achievements = this.getAchievementsByCategory(category);
            if (achievements.length === 0) return;
            
            html += `
                <div class="achievement-category" style="margin-bottom: 1.5rem;">
                    <h3 style="text-transform: capitalize; color: var(--text-secondary); margin-bottom: 0.75rem;">
                        ${category}
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem;">
            `;
            
            achievements.forEach(achievement => {
                const unlocked = this.unlockedAchievements.includes(achievement.id);
                html += `
                    <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}" 
                        style="
                            background: var(--bg-secondary);
                            border: 1px solid ${unlocked ? '#fbbf24' : 'var(--border-color)'};
                            border-radius: 12px;
                            padding: 1rem;
                            text-align: center;
                            opacity: ${unlocked ? 1 : 0.5};
                            transition: all 0.3s;
                            ${unlocked ? 'box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);' : ''}
                        ">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                            <i class="fas ${achievement.icon}" style="color: ${unlocked ? '#fbbf24' : 'var(--text-tertiary)'};"></i>
                        </div>
                        <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem;">${achievement.name}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${achievement.description}</div>
                        ${!unlocked ? `<div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 0.5rem;">${achievement.requirement} required</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        container.innerHTML = html;
    }
};

// Make Gamification globally accessible
window.Gamification = Gamification;
