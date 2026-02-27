// ===== TASK MANAGEMENT MODULE (SECURED) =====

const TaskManager = {
    tasks: [],
    filters: {
        search: '',
        status: 'all',
        category: 'all',
        priority: 'all'
    },

    init() {
        // Load tasks from DataManager
        this.tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
    },

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const searchInput = document.getElementById('taskSearch');
            const filterSelect = document.getElementById('taskFilter');
            
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filters.search = e.target.value.toLowerCase();
                    this.render();
                });
            }
            
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    this.filters.status = e.target.value;
                    this.render();
                });
            }
            
            // Category filter
            const categoryFilter = document.getElementById('taskCategoryFilter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', (e) => {
                    this.filters.category = e.target.value;
                    this.render();
                });
            }
        });
    },

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const category = document.getElementById('taskCategory');
        const priority = document.getElementById('taskPriority');
        const deadline = document.getElementById('taskDeadline');
        
        if (!taskInput || !category || !priority) {
            NotificationSystem.error('Form elements not found');
            return;
        }

        const title = taskInput.value.trim();
        
        if (!title) {
            NotificationSystem.warning('Please enter a task title');
            return;
        }

        // XSS check
        if (SecurityUtils.detectXSSAttempt(title)) {
            NotificationSystem.error('Invalid characters in task title');
            return;
        }

        const task = {
            id: `task_${Date.now()}_${SecurityUtils.generateToken(6)}`,
            title: SecurityUtils.sanitizeInput(title),
            category: category.value,
            priority: priority.value,
            deadline: deadline?.value || new Date().toISOString().split('T')[0],
            completed: false,
            createdAt: new Date().toISOString(),
            notes: '',
            tags: []
        };

        this.tasks.push(task);
        this.save();
        this.render();
        
        // Clear input
        taskInput.value = '';
        taskInput.focus();
        
        // Update productivity stats
        if (typeof updateProductivityStats === 'function') {
            updateProductivityStats();
        }

        NotificationSystem.success('Task added successfully!', 2000);
    },

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            
            if (task.completed) {
                task.completedAt = new Date().toISOString();
            }
            
            this.save();
            this.render();
            
            if (typeof updateProductivityStats === 'function') {
                updateProductivityStats();
            }

            if (task.completed) {
                NotificationSystem.success('Task completed! 🎉', 2000);
            }
        }
    },

    deleteTask(taskId) {
        ModalManager.confirm('Are you sure you want to delete this task?').then(confirmed => {
            if (confirmed) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.save();
                this.render();
                
                if (typeof updateProductivityStats === 'function') {
                    updateProductivityStats();
                }
                
                NotificationSystem.info('Task deleted', 2000);
            }
        });
    },

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task) return;

        ModalManager.prompt('Edit Task', task.title).then(newTitle => {
            if (newTitle !== null && newTitle.trim()) {
                // XSS check
                if (SecurityUtils.detectXSSAttempt(newTitle)) {
                    NotificationSystem.error('Invalid characters in task title');
                    return;
                }
                
                task.title = SecurityUtils.sanitizeInput(newTitle.trim());
                task.updatedAt = new Date().toISOString();
                
                this.save();
                this.render();
                
                NotificationSystem.success('Task updated', 2000);
            }
        });
    },

    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        // Search filter
        if (this.filters.search) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(this.filters.search) ||
                task.category.toLowerCase().includes(this.filters.search)
            );
        }
        
        // Status filter
        if (this.filters.status === 'completed') {
            filtered = filtered.filter(task => task.completed);
        } else if (this.filters.status === 'pending') {
            filtered = filtered.filter(task => !task.completed);
        }
        
        // Category filter
        if (this.filters.category && this.filters.category !== 'all') {
            filtered = filtered.filter(task => task.category === this.filters.category);
        }
        
        // Priority filter
        if (this.filters.priority && this.filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === this.filters.priority);
        }
        
        return filtered;
    },

    render() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        const filteredTasks = this.getFilteredTasks();

        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">No tasks yet. Add one above! ✨</div>';
            return;
        }

        // Sort: incomplete first, then by priority
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.draggable = true;
            li.setAttribute('data-id', task.id);
            
            const priorityClass = `priority-${task.priority}`;
            const deadline = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline';
            
            li.innerHTML = `
                <div class="task-priority ${priorityClass}"></div>
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="TaskManager.toggleTask('${task.id}')">
                <span style="flex: 1;" ondblclick="TaskManager.editTask('${task.id}')">${SecurityUtils.escapeHtml(task.title)}</span>
                <span class="task-category">${SecurityUtils.escapeHtml(task.category)}</span>
                <span class="task-deadline">${SecurityUtils.escapeHtml(deadline)}</span>
                <div class="task-actions">
                    <i class="fas fa-edit" onclick="TaskManager.editTask('${task.id}')" style="color: var(--accent-primary); cursor: pointer;" title="Edit"></i>
                    <i class="fas fa-trash" onclick="TaskManager.deleteTask('${task.id}')" style="color: var(--danger); cursor: pointer;" title="Delete"></i>
                </div>
            `;
            
            // Drag and drop handlers
            li.addEventListener('dragstart', (e) => this.handleDragStart(e, task.id));
            li.addEventListener('dragend', this.handleDragEnd);
            li.addEventListener('dragover', this.handleDragOver);
            li.addEventListener('drop', (e) => this.handleDrop(e, task.id));
            
            taskList.appendChild(li);
        });
    },

    // Drag and drop
    dragSource: null,

    handleDragStart(e, taskId) {
        this.dragSource = taskId;
        e.target.style.opacity = '0.5';
        e.dataTransfer.setData('text/plain', taskId);
    },

    handleDragEnd(e) {
        e.target.style.opacity = '1';
        this.dragSource = null;
    },

    handleDragOver(e) {
        e.preventDefault();
    },

    handleDrop(e, targetTaskId) {
        e.preventDefault();
        
        if (!this.dragSource || this.dragSource === targetTaskId) return;

        const sourceIndex = this.tasks.findIndex(t => t.id === this.dragSource);
        const targetIndex = this.tasks.findIndex(t => t.id === targetTaskId);

        if (sourceIndex !== -1 && targetIndex !== -1) {
            // Reorder array
            const [removed] = this.tasks.splice(sourceIndex, 1);
            this.tasks.splice(targetIndex, 0, removed);
            
            this.save();
            this.render();
        }
    },

    save() {
        DataManager.set(DataManager.STORAGE_KEYS.TASKS, this.tasks);
    },

    // Statistics
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        const byCategory = {};
        const byPriority = { high: 0, medium: 0, low: 0 };
        
        this.tasks.forEach(task => {
            byCategory[task.category] = (byCategory[task.category] || 0) + 1;
            byPriority[task.priority]++;
        });

        return {
            total,
            completed,
            pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            byCategory,
            byPriority
        };
    }
};

// Global assignment for onclick handlers
window.TaskManager = TaskManager;

// Legacy support
window.addTask = () => TaskManager.addTask();
window.toggleTask = (id) => TaskManager.toggleTask(id);
window.deleteTask = (id) => TaskManager.deleteTask(id);
window.editTask = (id) => TaskManager.editTask(id);
window.filterTasks = () => TaskManager.render();
window.renderTasks = () => TaskManager.render();

// Initialize
document.addEventListener('DOMContentLoaded', () => TaskManager.init());
