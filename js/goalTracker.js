// ===== Goal Tracker Module =====
const GoalTracker = {
    STORAGE_KEY: 'lifeos_goals_data',

    // Goal categories
    CATEGORIES: ['Personal', 'Career', 'Health', 'Finance', 'Education', 'Relationships', 'Fitness', 'Creative'],

    // Goal priorities
    PRIORITIES: ['Low', 'Medium', 'High', 'Critical'],

    // Initialize goal tracker
    init() {
        this.loadGoals();
        this.renderGoalDashboard();
        this.setupEventListeners();
    },

    // Load goals from storage
    loadGoals() {
        this.goals = DataManager.get(this.STORAGE_KEY, []);
    },

    // Save goals to storage
    saveGoals() {
        DataManager.set(this.STORAGE_KEY, this.goals);
    },

    // Add new goal
    addGoal(goal) {
        const newGoal = {
            id: Date.now(),
            title: goal.title,
            description: goal.description || '',
            category: goal.category || 'Personal',
            priority: goal.priority || 'Medium',
            targetDate: goal.targetDate,
            milestones: goal.milestones || [],
            progress: 0,
            status: 'active', // active, completed, paused
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.goals.unshift(newGoal);
        this.saveGoals();
        this.renderGoalDashboard();
        this.showNotification('Goal created! Start working on it.', 'success');
    },

    // Update goal progress
    updateProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = Math.min(100, Math.max(0, progress));
            if (goal.progress === 100) {
                goal.status = 'completed';
                goal.completedAt = new Date().toISOString();
                this.showNotification(`🎉 Congratulations! You completed: ${goal.title}`, 'success');
            }
            this.saveGoals();
            this.renderGoalDashboard();
        }
    },

    // Add milestone to goal
    addMilestone(goalId, milestone) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            const newMilestone = {
                id: Date.now(),
                title: milestone.title,
                completed: false,
                completedAt: null
            };
            goal.milestones.push(newMilestone);
            this.saveGoals();
            this.renderGoalDashboard();
        }
    },

    // Toggle milestone completion
    toggleMilestone(goalId, milestoneId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            const milestone = goal.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.completed = !milestone.completed;
                milestone.completedAt = milestone.completed ? new Date().toISOString() : null;

                // Update overall progress based on milestones
                if (goal.milestones.length > 0) {
                    const completedCount = goal.milestones.filter(m => m.completed).length;
                    goal.progress = Math.round((completedCount / goal.milestones.length) * 100);
                }

                if (goal.progress === 100) {
                    goal.status = 'completed';
                    goal.completedAt = new Date().toISOString();
                    this.showNotification(`🎉 Goal completed: ${goal.title}`, 'success');
                }

                this.saveGoals();
                this.renderGoalDashboard();
            }
        }
    },

    // Delete goal
    deleteGoal(id) {
        this.goals = this.goals.filter(goal => goal.id !== id);
        this.saveGoals();
        this.renderGoalDashboard();
        this.showNotification('Goal deleted', 'info');
    },

    // Get goals by status
    getGoalsByStatus(status) {
        return this.goals.filter(goal => goal.status === status);
    },

    // Get goals by category
    getGoalsByCategory(category) {
        return this.goals.filter(goal => goal.category === category);
    },

    // Render goal dashboard
    renderGoalDashboard() {
        const container = document.getElementById('goalTrackerContent');
        if (!container) return;

        const activeGoals = this.getGoalsByStatus('active');
        const completedGoals = this.getGoalsByStatus('completed');

        container.innerHTML = `
            <div class="goal-dashboard">
                <!-- Goal Stats -->
                <div class="goal-stats-row">
                    <div class="goal-stat-card">
                        <div class="stat-icon"><i class="fas fa-bullseye"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${activeGoals.length}</span>
                            <span class="stat-label">Active Goals</span>
                        </div>
                    </div>
                    <div class="goal-stat-card">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${completedGoals.length}</span>
                            <span class="stat-label">Completed</span>
                        </div>
                    </div>
                    <div class="goal-stat-card">
                        <div class="stat-icon"><i class="fas fa-percentage"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">${this.getOverallProgress()}%</span>
                            <span class="stat-label">Overall Progress</span>
                        </div>
                    </div>
                </div>
                
                <!-- Add Goal Form -->
                <div class="goal-form-card">
                    <h3><i class="fas fa-plus-circle"></i> Create New Goal</h3>
                    <form id="goalForm" class="goal-form">
                        <div class="form-group">
                            <label>Goal Title *</label>
                            <input type="text" id="goalTitle" placeholder="What do you want to achieve?" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="goalDescription" placeholder="Describe your goal in detail..." rows="2"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Category</label>
                                <select id="goalCategory">
                                    ${this.CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Priority</label>
                                <select id="goalPriority">
                                    ${this.PRIORITIES.map(pri => `<option value="${pri}">${pri}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Target Date</label>
                            <input type="date" id="goalTargetDate">
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Create Goal
                        </button>
                    </form>
                </div>
                
                <!-- Active Goals -->
                <div class="goals-section">
                    <h3><i class="fas fa-rocket"></i> Active Goals</h3>
                    <div class="goals-grid">
                        ${activeGoals.length > 0 ? activeGoals.map(goal => this.renderGoalCard(goal)).join('') : '<p class="no-data">No active goals. Create one above!</p>'}
                    </div>
                </div>
                
                <!-- Completed Goals -->
                ${completedGoals.length > 0 ? `
                <div class="goals-section">
                    <h3><i class="fas fa-trophy"></i> Completed Goals</h3>
                    <div class="goals-grid completed">
                        ${completedGoals.map(goal => this.renderGoalCard(goal)).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Goal Ideas -->
                <div class="goal-ideas-card">
                    <h3><i class="fas fa-lightbulb"></i> Goal Ideas</h3>
                    <div class="ideas-grid">
                        <div class="idea-item" onclick="GoalTracker.quickAddGoal('Read 12 books this year', 'Education')">
                            <i class="fas fa-book"></i>
                            <span>Read 12 books</span>
                        </div>
                        <div class="idea-item" onclick="GoalTracker.quickAddGoal('Exercise 3 times per week', 'Fitness')">
                            <i class="fas fa-dumbbell"></i>
                            <span>Exercise regularly</span>
                        </div>
                        <div class="idea-item" onclick="GoalTracker.quickAddGoal('Save $10,000', 'Finance')">
                            <i class="fas fa-piggy-bank"></i>
                            <span>Save $10,000</span>
                        </div>
                        <div class="idea-item" onclick="GoalTracker.quickAddGoal('Learn a new skill', 'Career')">
                            <i class="fas fa-graduation-cap"></i>
                            <span>Learn new skill</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup form submission
        const form = document.getElementById('goalForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addGoal({
                    title: document.getElementById('goalTitle').value,
                    description: document.getElementById('goalDescription').value,
                    category: document.getElementById('goalCategory').value,
                    priority: document.getElementById('goalPriority').value,
                    targetDate: document.getElementById('goalTargetDate').value
                });
                form.reset();
            });
        }
    },

    // Render individual goal card
    renderGoalCard(goal) {
        const priorityClass = goal.priority.toLowerCase();
        const categoryIcon = this.getCategoryIcon(goal.category);
        const daysLeft = goal.targetDate ? this.getDaysLeft(goal.targetDate) : null;

        return `
            <div class="goal-card ${goal.status}" data-id="${goal.id}">
                <div class="goal-header">
                    <div class="goal-category">
                        <i class="fas fa-${categoryIcon}"></i>
                        ${goal.category}
                    </div>
                    <div class="goal-priority ${priorityClass}">${goal.priority}</div>
                </div>
                
                <h4 class="goal-title">${goal.title}</h4>
                ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
                
                <div class="goal-progress-container">
                    <div class="progress-header">
                        <span>Progress</span>
                        <span class="progress-percent">${goal.progress}%</span>
                    </div>
                    <div class="progress-bar-mini">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
                
                ${goal.milestones.length > 0 ? `
                <div class="milestones-section">
                    <h5>Milestones</h5>
                    <div class="milestones-list">
                        ${goal.milestones.map(milestone => `
                            <div class="milestone-item ${milestone.completed ? 'completed' : ''}" 
                                 onclick="GoalTracker.toggleMilestone(${goal.id}, ${milestone.id})">
                                <i class="fas fa-${milestone.completed ? 'check-circle' : '-circle'}"></i>
                                <span>${milestone.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="goal-actions">
                    ${goal.status === 'active' ? `
                    <button class="btn btn-sm" onclick="GoalTracker.showAddMilestoneModal(${goal.id})">
                        <i class="fas fa-flag"></i> Add Milestone
                    </button>
                    <input type="range" min="0" max="100" value="${goal.progress}" 
                           onchange="GoalTracker.updateProgress(${goal.id}, this.value)" 
                           class="progress-slider">
                    ` : ''}
                    <button class="btn-icon delete-goal" onclick="GoalTracker.deleteGoal(${goal.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                ${daysLeft !== null ? `
                <div class="goal-deadline">
                    <i class="fas fa-calendar"></i>
                    ${daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                </div>
                ` : ''}
            </div>
        `;
    },

    // Quick add goal from idea
    quickAddGoal(title, category) {
        document.getElementById('goalTitle').value = title;
        document.getElementById('goalCategory').value = category;
        document.getElementById('goalForm').scrollIntoView({ behavior: 'smooth' });
    },

    // Show add milestone modal
    showAddMilestoneModal(goalId) {
        const milestoneTitle = prompt('Enter milestone title:');
        if (milestoneTitle) {
            this.addMilestone(goalId, { title: milestoneTitle });
        }
    },

    // Get category icon
    getCategoryIcon(category) {
        const icons = {
            'Personal': 'user',
            'Career': 'briefcase',
            'Health': 'heart',
            'Finance': 'coins',
            'Education': 'graduation-cap',
            'Relationships': 'users',
            'Fitness': 'dumbbell',
            'Creative': 'palette'
        };
        return icons[category] || 'star';
    },

    // Get days left until target date
    getDaysLeft(targetDate) {
        const today = new Date();
        const target = new Date(targetDate);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Get overall progress
    getOverallProgress() {
        if (this.goals.length === 0) return 0;
        const total = this.goals.reduce((acc, goal) => acc + goal.progress, 0);
        return Math.round(total / this.goals.length);
    },

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('goalTracker:refresh', () => {
            this.loadGoals();
            this.renderGoalDashboard();
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
window.GoalTracker = GoalTracker;
