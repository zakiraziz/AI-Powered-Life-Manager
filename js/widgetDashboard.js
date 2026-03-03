// ===== widgetDashboard.js - Advanced Dashboard with Widgets =====

const WidgetDashboard = {
    // Available widgets
    widgets: {
        welcome: { name: 'Welcome', icon: 'fa-hand-sparkles', size: 'full' },
        quickStats: { name: 'Quick Stats', icon: 'fa-chart-bar', size: 'half' },
        tasksToday: { name: 'Today\'s Tasks', icon: 'fa-tasks', size: 'half' },
        habits: { name: 'Habits', icon: 'fa-check-double', size: 'half' },
        pomodoro: { name: 'Pomodoro', icon: 'fa-clock', size: 'half' },
        mood: { name: 'Mood', icon: 'fa-smile', size: 'half' },
        water: { name: 'Water', icon: 'fa-tint', size: 'quarter' },
        expenses: { name: 'Expenses', icon: 'fa-wallet', size: 'quarter' },
        streak: { name: 'Streak', icon: 'fa-fire', size: 'quarter' },
        aiInsight: { name: 'AI Insight', icon: 'fa-robot', size: 'half' },
        upcoming: { name: 'Upcoming', icon: 'fa-calendar-alt', size: 'half' },
        achievements: { name: 'Achievements', icon: 'fa-trophy', size: 'half' },
        quotes: { name: 'Daily Quote', icon: 'fa-quote-left', size: 'quarter' },
        focusMode: { name: 'Focus Mode', icon: 'fa-bullseye', size: 'quarter' }
    },
    
    // Current layout
    layout: [],
    
    // Initialize dashboard
    init() {
        this.loadLayout();
        this.renderDashboard();
        this.startAutoRefresh();
    },
    
    // Load layout from storage
    loadLayout() {
        const stored = localStorage.getItem('lifeos_dashboard_layout');
        if (stored) {
            this.layout = JSON.parse(stored);
        } else {
            // Default layout
            this.layout = [
                { id: 'welcome', order: 0 },
                { id: 'quickStats', order: 1 },
                { id: 'tasksToday', order: 2 },
                { id: 'habits', order: 3 },
                { id: 'pomodoro', order: 4 },
                { id: 'mood', order: 5 },
                { id: 'water', order: 6 },
                { id: 'expenses', order: 7 },
                { id: 'streak', order: 8 },
                { id: 'aiInsight', order: 9 },
                { id: 'upcoming', order: 10 },
                { id: 'achievements', order: 11 },
                { id: 'quotes', order: 12 },
                { id: 'focusMode', order: 13 }
            ];
        }
    },
    
    // Save layout to storage
    saveLayout() {
        localStorage.setItem('lifeos_dashboard_layout', JSON.stringify(this.layout));
    },
    
    // Render dashboard
    renderDashboard() {
        const container = document.getElementById('dashboardContent');
        if (!container) return;
        
        // Sort by order
        const sorted = [...this.layout].sort((a, b) => a.order - b.order);
        
        let html = '<div class="dashboard-grid">';
        
        sorted.forEach(widget => {
            const widgetConfig = this.widgets[widget.id];
            if (!widgetConfig) return;
            
            const sizeClass = widgetConfig.size === 'full' ? 'widget-full' : 
                             widgetConfig.size === 'half' ? 'widget-half' : 'widget-quarter';
            
            html += `<div class="dashboard-widget ${sizeClass}" data-widget="${widget.id}">`;
            html += this.renderWidgetContent(widget.id);
            html += '</div>';
        });
        
        html += '</div>';
        
        // Add customize button
        html += `
            <button class="customize-dashboard-btn" onclick="WidgetDashboard.showCustomizePanel()"
                style="position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; 
                border-radius: 50%; background: var(--accent-primary); color: white; border: none;
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4); cursor: pointer; z-index: 100;
                transition: all 0.3s; display: flex; align-items: center; justify-content: center;
                font-size: 1.2rem;">
                <i class="fas fa-cog"></i>
            </button>
        `;
        
        container.innerHTML = html;
    },
    
    // Render widget content
    renderWidgetContent(widgetId) {
        switch (widgetId) {
            case 'welcome':
                return this.renderWelcomeWidget();
            case 'quickStats':
                return this.renderQuickStatsWidget();
            case 'tasksToday':
                return this.renderTasksWidget();
            case 'habits':
                return this.renderHabitsWidget();
            case 'pomodoro':
                return this.renderPomodoroWidget();
            case 'mood':
                return this.renderMoodWidget();
            case 'water':
                return this.renderWaterWidget();
            case 'expenses':
                return this.renderExpensesWidget();
            case 'streak':
                return this.renderStreakWidget();
            case 'aiInsight':
                return this.renderAIInsightWidget();
            case 'upcoming':
                return this.renderUpcomingWidget();
            case 'achievements':
                return this.renderAchievementsWidget();
            case 'quotes':
                return this.renderQuoteWidget();
            case 'focusMode':
                return this.renderFocusModeWidget();
            default:
                return '<div>Unknown widget</div>';
        }
    },
    
    // Welcome Widget
    renderWelcomeWidget() {
        const hour = new Date().getHours();
        let greeting = 'Welcome';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 17) greeting = 'Good Afternoon';
        else greeting = 'Good Evening';
        
        const name = localStorage.getItem('lifeos_user_name') || 'User';
        
        return `
            <div class="widget-header">
                <i class="fas fa-hand-sparkles"></i>
                <span>${greeting}, ${name}!</span>
            </div>
            <div class="widget-content" style="text-align: center; padding: 1rem;">
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    ${this.getMotivationalMessage()}
                </p>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
                    <button class="quick-action-btn" onclick="QuickActions.addTask()">
                        <i class="fas fa-plus"></i> New Task
                    </button>
                    <button class="quick-action-btn" onclick="AIAssistant.showAIAssistant()">
                        <i class="fas fa-robot"></i> Ask AI
                    </button>
                </div>
            </div>
        `;
    },
    
    // Quick Stats Widget
    renderQuickStatsWidget() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const completed = tasks.filter(t => t.completed).length;
        const pending = tasks.filter(t => !t.completed).length;
        
        const habits = JSON.parse(localStorage.getItem('lifeos_habits') || '[]');
        const today = new Date().toDateString();
        const habitsDone = habits.filter(h => h.completedDates && h.completedDates.includes(today)).length;
        
        const stats = Gamification ? Gamification.stats : { level: 1, totalPoints: 0 };
        
        return `
            <div class="widget-header">
                <i class="fas fa-chart-bar"></i>
                <span>Quick Stats</span>
            </div>
            <div class="widget-content">
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="stat-item">
                        <div class="stat-value">${pending}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${completed}</div>
                        <div class="stat-label">Done</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${habitsDone}/${habits.length}</div>
                        <div class="stat-label">Habits</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">Lvl ${stats.level}</div>
                        <div class="stat-label">${stats.totalPoints} XP</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Tasks Widget
    renderTasksWidget() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const today = new Date().toDateString();
        const todayTasks = tasks.filter(t => !t.completed && new Date(t.dueDate).toDateString() === today);
        
        return `
            <div class="widget-header">
                <i class="fas fa-tasks"></i>
                <span>Today's Tasks</span>
                <span class="widget-badge">${todayTasks.length}</span>
            </div>
            <div class="widget-content" style="max-height: 200px; overflow-y: auto;">
                ${todayTasks.length === 0 ? '<p style="text-align: center; color: var(--text-tertiary);">No tasks for today!</p>' : ''}
                ${todayTasks.slice(0, 5).map(task => `
                    <div class="task-item" onclick="Tasks.toggleComplete(${task.id})" 
                        style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; 
                        background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                            onchange="event.stopPropagation(); Tasks.toggleComplete(${task.id})"
                            style="accent-color: var(--accent-primary);">
                        <span style="${task.completed ? 'text-decoration: line-through; opacity: 0.5;' : ''} flex: 1;">
                            ${task.title}
                        </span>
                        <span class="priority-${task.priority || 'low'}" style="font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px;">
                            ${task.priority || 'low'}
                        </span>
                    </div>
                `).join('')}
                ${todayTasks.length > 5 ? `<p style="text-align: center; color: var(--text-tertiary); font-size: 0.8rem;">+${todayTasks.length - 5} more</p>` : ''}
            </div>
        `;
    },
    
    // Habits Widget
    renderHabitsWidget() {
        const habits = JSON.parse(localStorage.getItem('lifeos_habits') || '[]');
        const today = new Date().toDateString();
        
        return `
            <div class="widget-header">
                <i class="fas fa-check-double"></i>
                <span>Habits</span>
            </div>
            <div class="widget-content">
                ${habits.length === 0 ? '<p style="text-align: center; color: var(--text-tertiary);">No habits yet!</p>' : ''}
                ${habits.slice(0, 4).map(habit => {
                    const isDone = habit.completedDates && habit.completedDates.includes(today);
                    return `
                        <div class="habit-item" onclick="HabitTracker.toggleComplete(${habit.id})"
                            style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem;
                            background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer;">
                            <div class="habit-check ${isDone ? 'done' : ''}" 
                                style="width: 24px; height: 24px; border-radius: 50%; 
                                border: 2px solid ${isDone ? 'var(--success)' : 'var(--border-color)'};
                                background: ${isDone ? 'var(--success)' : 'transparent'};
                                display: flex; align-items: center; justify-content: center;">
                                ${isDone ? '<i class="fas fa-check" style="font-size: 0.7rem; color: white;"></i>' : ''}
                            </div>
                            <span style="flex: 1;">${habit.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    // Pomodoro Widget
    renderPomodoroWidget() {
        return `
            <div class="widget-header">
                <i class="fas fa-clock"></i>
                <span>Pomodoro</span>
            </div>
            <div class="widget-content" style="text-align: center;">
                <div class="pomodoro-display" id="widgetPomodoroDisplay"
                    style="font-size: 2.5rem; font-weight: bold; color: var(--accent-primary); margin: 1rem 0;">
                    25:00
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button class="widget-btn" onclick="PomodoroTimer.start()">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="widget-btn secondary" onclick="PomodoroTimer.pause()">
                        <i class="fas fa-pause"></i> Pause
                    </button>
                </div>
                <p style="color: var(--text-tertiary); font-size: 0.8rem; margin-top: 0.5rem;">
                    Focus sessions today: <span id="pomodoroSessions">0</span>
                </p>
            </div>
        `;
    },
    
    // Mood Widget
    renderMoodWidget() {
        const moods = JSON.parse(localStorage.getItem('lifeos_moods') || '[]');
        const recentMood = moods.length > 0 ? moods[moods.length - 1] : null;
        
        const moodEmoji = ['', '😢', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳', '🔥'];
        const moodValue = recentMood ? recentMood.mood : 0;
        
        return `
            <div class="widget-header">
                <i class="fas fa-smile"></i>
                <span>Mood</span>
            </div>
            <div class="widget-content" style="text-align: center;">
                <div style="font-size: 3rem; margin: 0.5rem 0;">
                    ${moodEmoji[moodValue] || '😐'}
                </div>
                <p style="color: var(--text-secondary);">
                    ${recentMood ? `Feeling: ${recentMood.mood}/10` : 'Not logged today'}
                </p>
                <button class="widget-btn" onclick="MoodManager.showMoodModal()">
                    <i class="fas fa-plus"></i> Log Mood
                </button>
            </div>
        `;
    },
    
    // Water Widget
    renderWaterWidget() {
        const water = JSON.parse(localStorage.getItem('lifeos_water') || '[]');
        const today = new Date().toDateString();
        const todayWater = water.filter(w => new Date(w.timestamp).toDateString() === today);
        const glasses = todayWater.length;
        const goal = 8;
        
        return `
            <div class="widget-header">
                <i class="fas fa-tint"></i>
                <span>Water</span>
            </div>
            <div class="widget-content" style="text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">
                    ${glasses}/${goal}
                </div>
                <div class="water-progress" style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; margin: 0.5rem 0; overflow: hidden;">
                    <div style="width: ${Math.min((glasses/goal)*100, 100)}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); transition: width 0.3s;"></div>
                </div>
                <button class="widget-btn small" onclick="WaterTracker.addGlass()">
                    <i class="fas fa-plus"></i> Add Glass
                </button>
            </div>
        `;
    },
    
    // Expenses Widget
    renderExpensesWidget() {
        const expenses = JSON.parse(localStorage.getItem('lifeos_expenses') || '[]');
        const thisMonth = expenses.filter(e => {
            const date = new Date(e.date);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        
        const total = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        return `
            <div class="widget-header">
                <i class="fas fa-wallet"></i>
                <span>This Month</span>
            </div>
            <div class="widget-content" style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">
                    $${total.toFixed(2)}
                </div>
                <p style="color: var(--text-tertiary); font-size: 0.8rem;">
                    ${thisMonth.length} transactions
                </p>
            </div>
        `;
    },
    
    // Streak Widget
    renderStreakWidget() {
        const stats = Gamification ? Gamification.stats : { streakDays: 0 };
        
        return `
            <div class="widget-header">
                <i class="fas fa-fire"></i>
                <span>Streak</span>
            </div>
            <div class="widget-content" style="text-align: center;">
                <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">
                    ${stats.streakDays} days
                </div>
                <p style="color: var(--text-tertiary); font-size: 0.8rem;">
                    Keep it going!
                </p>
            </div>
        `;
    },
    
    // AI Insight Widget
    renderAIInsightWidget() {
        const tips = [
            'Your peak productivity is in the morning. Schedule important tasks then!',
            'You\'ve been consistent with your habits. Great job!',
            'Remember to take breaks every 25 minutes during focused work.',
            'Hydration affects your mood. Keep drinking water!',
            'Review your tasks daily for better productivity.'
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        return `
            <div class="widget-header">
                <i class="fas fa-robot"></i>
                <span>AI Insight</span>
            </div>
            <div class="widget-content">
                <p style="color: var(--text-secondary); line-height: 1.5;">
                    <i class="fas fa-lightbulb" style="color: #fbbf24; margin-right: 0.5rem;"></i>
                    ${randomTip}
                </p>
                <button class="widget-btn small" onclick="AIAssistant.showAIAssistant()">
                    <i class="fas fa-comment"></i> Ask More
                </button>
            </div>
        `;
    },
    
    // Upcoming Widget
    renderUpcomingWidget() {
        const tasks = JSON.parse(localStorage.getItem('lifeos_tasks') || '[]');
        const now = new Date();
        const upcoming = tasks.filter(t => !t.completed && new Date(t.dueDate) > now)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 4);
        
        return `
            <div class="widget-header">
                <i class="fas fa-calendar-alt"></i>
                <span>Upcoming</span>
            </div>
            <div class="widget-content">
                ${upcoming.length === 0 ? '<p style="text-align: center; color: var(--text-tertiary);">No upcoming tasks</p>' : ''}
                ${upcoming.map(task => {
                    const due = new Date(task.dueDate);
                    const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                    return `
                        <div style="display: flex; justify-content: space-between; padding: 0.4rem; 
                            background: var(--bg-secondary); border-radius: 6px; margin-bottom: 0.4rem; font-size: 0.85rem;">
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${task.title}
                            </span>
                            <span style="color: ${days <= 1 ? '#ef4444' : days <= 3 ? '#f59e0b' : 'var(--text-tertiary)'};">
                                ${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    // Achievements Widget
    renderAchievementsWidget() {
        const unlocked = Gamification ? Gamification.unlockedAchievements : [];
        
        return `
            <div class="widget-header">
                <i class="fas fa-trophy"></i>
                <span>Achievements</span>
                <span class="widget-badge" style="background: #fbbf24;">${unlocked.length}</span>
            </div>
            <div class="widget-content">
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${unlocked.length} achievements unlocked
                </p>
                <button class="widget-btn small" onclick="Gamification.renderAchievementsPanel(); Modal.show('achievementsModal');">
                    View All
                </button>
            </div>
        `;
    },
    
    // Quote Widget
    renderQuoteWidget() {
        const quotes = [
            { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
            { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
            { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
            { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
            { text: 'Success is not final, failure is not fatal.', author: 'Winston Churchill' }
        ];
        
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        
        return `
            <div class="widget-header">
                <i class="fas fa-quote-left"></i>
                <span>Daily Quote</span>
            </div>
            <div class="widget-content" style="text-align: center;">
                <p style="font-style: italic; color: var(--text-secondary);">
                    "${quote.text}"
                </p>
                <p style="color: var(--text-tertiary); font-size: 0.8rem;">
                    — ${quote.author}
                </p>
            </div>
        `;
    },
    
    // Focus Mode Widget
    renderFocusModeWidget() {
        return `
            <div class="widget-header">
                <i class="fas fa-bullseye"></i>
                <span>Focus</span>
            </div>
            <div class="widget-content" style="text-align: center;">
                <button class="widget-btn" onclick="KeyboardShortcuts.toggleFocusMode()">
                    <i class="fas fa-expand"></i> Enter Focus Mode
                </button>
                <p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.5rem;">
                    Hide distractions and focus
                </p>
            </div>
        `;
    },
    
    // Get motivational message
    getMotivationalMessage() {
        const messages = [
            'Ready to make today count?',
            'Let\'s crush your goals today!',
            'One step at a time leads to big achievements.',
            'Your potential is unlimited. Start now!',
            'Today is another opportunity to shine!'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    },
    
    // Show customize panel
    showCustomizePanel() {
        const modal = document.getElementById('widgetCustomizeModal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            // Create modal
            const modalHtml = `
                <div id="widgetCustomizeModal" class="modal hidden" style="display: flex;">
                    <div class="modal-content" style="max-width: 500px;">
                        <div class="modal-header">
                            <h2>Customize Dashboard</h2>
                            <button class="modal-close" onclick="document.getElementById('widgetCustomizeModal').classList.add('hidden')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                                Drag widgets to reorder them. Click to toggle visibility.
                            </p>
                            <div id="widgetList"></div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="document.getElementById('widgetCustomizeModal').classList.add('hidden')">
                                Cancel
                            </button>
                            <button class="btn btn-primary" onclick="WidgetDashboard.saveCustomization()">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // Render widget list
        this.renderWidgetList();
        document.getElementById('widgetCustomizeModal').classList.remove('hidden');
    },
    
    // Render widget list for customization
    renderWidgetList() {
        const container = document.getElementById('widgetList');
        if (!container) return;
        
        const sorted = [...this.layout].sort((a, b) => a.order - b.order);
        
        container.innerHTML = sorted.map(widget => {
            const config = this.widgets[widget.id];
            return `
                <div class="widget-config-item" draggable="true" data-widget="${widget.id}"
                    style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; 
                    background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem; cursor: grab;">
                    <i class="fas fa-grip-vertical" style="color: var(--text-tertiary);"></i>
                    <i class="fas ${config.icon}" style="width: 20px;"></i>
                    <span style="flex: 1;">${config.name}</span>
                    <i class="fas fa-eye" style="color: var(--success);"></i>
                </div>
            `;
        }).join('');
    },
    
    // Save customization
    saveCustomization() {
        this.saveLayout();
        this.renderDashboard();
        document.getElementById('widgetCustomizeModal').classList.add('hidden');
        NotificationSystem.show('Dashboard updated!', 'success');
    },
    
    // Start auto refresh
    startAutoRefresh() {
        // Refresh every minute
        setInterval(() => {
            this.renderDashboard();
        }, 60000);
    }
};

// Make WidgetDashboard globally accessible
window.WidgetDashboard = WidgetDashboard;
