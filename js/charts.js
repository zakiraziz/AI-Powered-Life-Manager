// ===== CHARTS MODULE (ENHANCED) =====

const ChartManager = {
    charts: {
        productivity: null,
        mood: null,
        expense: null
    },

    init() {
        this.initializeCharts();
        this.loadData();
        
        // Listen for data changes
        window.addEventListener('dataChanged', (e) => {
            if (e.detail.key === DataManager.STORAGE_KEYS.TASKS) {
                this.updateProductivityChart();
            } else if (e.detail.key === DataManager.STORAGE_KEYS.MOODS) {
                this.updateMoodChart();
            } else if (e.detail.key === DataManager.STORAGE_KEYS.TRANSACTIONS) {
                this.updateExpenseChart();
            }
        });
    },

    loadData() {
        this.updateProductivityChart();
        this.updateMoodChart();
        this.updateExpenseChart();
    },

    initializeCharts() {
        this.initializeProductivityChart();
        this.initializeMoodChart();
        this.initializeExpenseChart();
    },

    initializeProductivityChart() {
        const canvas = document.getElementById('productivityChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        this.charts.productivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Tasks Completed',
                    data: this.getProductivityData(),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: this.getChartOptions('Tasks Completed')
        });
    },

    initializeMoodChart() {
        const canvas = document.getElementById('moodChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        this.charts.mood = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Mood',
                    data: this.getMoodData(),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: this.getChartOptions('Mood', {
                min: 1,
                max: 5,
                stepSize: 1,
                callback: (value) => {
                    const moods = ['', '😔', '😤', '😐', '😊', '😄'];
                    return moods[value] || '';
                }
            })
        });
    },

    initializeExpenseChart() {
        const canvas = document.getElementById('expenseChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        this.charts.expense = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Food', 'Transport', 'Entertainment', 'Bills', 'Other'],
                datasets: [{
                    data: this.getExpenseData(),
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#6366f1',
                        '#8b5cf6'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: $${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    getChartOptions(title, yOptions = {}) {
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'var(--card-bg)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'var(--border-color)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        ...yOptions
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'var(--text-secondary)' }
                }
            }
        };

        if (yOptions.min !== undefined) {
            defaultOptions.scales.y.min = yOptions.min;
            defaultOptions.scales.y.max = yOptions.max;
            defaultOptions.scales.y.ticks.stepSize = yOptions.stepSize;
            defaultOptions.scales.y.ticks.callback = yOptions.callback;
        }

        return defaultOptions;
    },

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        return days;
    },

    // Get productivity data from tasks
    getProductivityData() {
        const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const count = tasks.filter(t => 
                t.completed && t.completedAt && 
                t.completedAt.startsWith(dateStr)
            ).length;
            
            data.push(count);
        }
        
        return data;
    },

    // Get mood data
    getMoodData() {
        const moods = DataManager.get(DataManager.STORAGE_KEYS.MOODS, []);
        const moodMap = { '😊': 5, '😄': 5, '😐': 3, '😔': 1, '😤': 2, '😴': 2, '🤔': 3, '🥰': 5 };
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const dayMoods = moods.filter(m => m.date === dateStr);
            
            if (dayMoods.length > 0) {
                const avg = dayMoods.reduce((sum, m) => sum + (moodMap[m.mood] || 3), 0) / dayMoods.length;
                data.push(Math.round(avg));
            } else {
                data.push(0);
            }
        }
        
        return data;
    },

    // Get expense data
    getExpenseData() {
        const transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
        
        // Only consider expenses (not income)
        const expenses = transactions.filter(t => t.category !== 'income');
        
        const categories = ['food', 'transport', 'entertainment', 'bills', 'other'];
        
        return categories.map(cat => {
            return expenses
                .filter(t => t.category === cat)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        });
    },

    updateProductivityChart() {
        if (this.charts.productivity) {
            this.charts.productivity.data.labels = this.getLast7Days();
            this.charts.productivity.data.datasets[0].data = this.getProductivityData();
            this.charts.productivity.update();
        }
    },

    updateMoodChart() {
        if (this.charts.mood) {
            this.charts.mood.data.labels = this.getLast7Days();
            this.charts.mood.data.datasets[0].data = this.getMoodData();
            this.charts.mood.update();
        }
    },

    updateExpenseChart() {
        if (this.charts.expense) {
            this.charts.expense.data.datasets[0].data = this.getExpenseData();
            this.charts.expense.update();
        }
    },

    // Get analytics summary
    getAnalyticsSummary() {
        const tasks = DataManager.get(DataManager.STORAGE_KEYS.TASKS, []);
        const transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
        const moods = DataManager.get(DataManager.STORAGE_KEYS.MOODS, []);

        const completedTasks = tasks.filter(t => t.completed).length;
        const totalIncome = transactions
            .filter(t => t.category === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
            .filter(t => t.category !== 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            totalTasks: tasks.length,
            completedTasks,
            completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            moodEntries: moods.length
        };
    }
};

// Legacy function names for compatibility
function initializeCharts() {
    ChartManager.init();
}

function updateMoodChart(data) {
    ChartManager.updateMoodChart();
}

function updateExpenseChart(data) {
    ChartManager.updateExpenseChart();
}

// Export to window
window.ChartManager = ChartManager;
window.initializeCharts = initializeCharts;
window.updateMoodChart = updateMoodChart;
window.updateExpenseChart = updateExpenseChart;

// Auto initialize
document.addEventListener('DOMContentLoaded', () => ChartManager.init());
