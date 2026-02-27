// ===== TRANSACTION MANAGER =====

const TransactionManager = {
    transactions: [],
    categories: {
        income: { label: 'Income', color: '#10b981', icon: '💰' },
        food: { label: 'Food', color: '#f59e0b', icon: '🍔' },
        transport: { label: 'Transport', color: '#3b82f6', icon: '🚗' },
        entertainment: { label: 'Entertainment', color: '#ef4444', icon: '🎬' },
        bills: { label: 'Bills', color: '#8b5cf6', icon: '📄' },
        shopping: { label: 'Shopping', color: '#ec4899', icon: '🛍️' },
        healthcare: { label: 'Healthcare', color: '#14b8a6', icon: '🏥' },
        education: { label: 'Education', color: '#f97316', icon: '📚' },
        other: { label: 'Other', color: '#6b7280', icon: '📦' }
    },

    init() {
        this.transactions = DataManager.get(DataManager.STORAGE_KEYS.TRANSACTIONS, []);
        this.updateBalance();
    },

    addTransaction(description, amount, category) {
        // Validate inputs
        if (!description || !amount || !category) {
            NotificationSystem.error('Please fill in all fields');
            return false;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            NotificationSystem.error('Please enter a valid amount');
            return false;
        }

        // XSS check
        if (SecurityUtils.detectXSSAttempt(description)) {
            NotificationSystem.error('Invalid description');
            return false;
        }

        const transaction = {
            id: `txn_${Date.now()}_${SecurityUtils.generateToken(6)}`,
            description: SecurityUtils.sanitizeInput(description),
            amount: numAmount,
            category: category,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.save();
        this.updateBalance();
        
        // Update expense chart
        if (window.ChartManager) {
            ChartManager.updateExpenseChart();
        }

        NotificationSystem.success('Transaction added!', 2000);
        return true;
    },

    deleteTransaction(id) {
        ModalManager.confirm('Delete this transaction?').then(confirmed => {
            if (confirmed) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.save();
                this.updateBalance();
                
                if (window.ChartManager) {
                    ChartManager.updateExpenseChart();
                }
                
                NotificationSystem.info('Transaction deleted', 2000);
            }
        });
    },

    getTransactions(filter = {}) {
        let filtered = [...this.transactions];

        if (filter.category && filter.category !== 'all') {
            filtered = filtered.filter(t => t.category === filter.category);
        }

        if (filter.type === 'income') {
            filtered = filtered.filter(t => t.category === 'income');
        } else if (filter.type === 'expense') {
            filtered = filtered.filter(t => t.category !== 'income');
        }

        if (filter.startDate) {
            filtered = filtered.filter(t => t.date >= filter.startDate);
        }

        if (filter.endDate) {
            filtered = filtered.filter(t => t.date <= filter.endDate);
        }

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        return filtered;
    },

    getBalance() {
        const income = this.transactions
            .filter(t => t.category === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.category !== 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            income,
            expenses,
            balance: income - expenses
        };
    },

    getCategoryBreakdown() {
        const expenses = this.transactions.filter(t => t.category !== 'income');
        const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const breakdown = {};
        
        expenses.forEach(t => {
            breakdown[t.category] = (breakdown[t.category] || 0) + Math.abs(t.amount);
        });

        return Object.entries(breakdown).map(([category, amount]) => ({
            category,
            amount,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
            ...this.categories[category]
        })).sort((a, b) => b.amount - a.amount);
    },

    getMonthlyTrend() {
        const monthlyData = {};

        this.transactions.forEach(t => {
            const month = t.date.substring(0, 7); // YYYY-MM
            
            if (!monthlyData[month]) {
                monthlyData[month] = { income: 0, expenses: 0 };
            }

            if (t.category === 'income') {
                monthlyData[month].income += t.amount;
            } else {
                monthlyData[month].expenses += Math.abs(t.amount);
            }
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months
    },

    updateBalance() {
        const { balance } = this.getBalance();
        const balanceEl = document.getElementById('balance');
        
        if (balanceEl) {
            balanceEl.textContent = `$${balance.toFixed(2)}`;
            
            // Color coding
            if (balance < 0) {
                balanceEl.style.color = 'var(--danger)';
            } else {
                balanceEl.style.color = 'var(--success)';
            }
        }
    },

    save() {
        DataManager.set(DataManager.STORAGE_KEYS.TRANSACTIONS, this.transactions);
    },

    showTransactionHistory() {
        const transactions = this.getTransactions();
        
        const content = transactions.length > 0 
            ? transactions.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <div style="font-weight: 500;">${SecurityUtils.escapeHtml(t.description)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${this.categories[t.category]?.icon || ''} ${this.categories[t.category]?.label || t.category} • ${t.date}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: ${t.category === 'income' ? 'var(--success)' : 'var(--text-primary)'};">
                            ${t.category === 'income' ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}
                        </div>
                        <button onclick="TransactionManager.deleteTransaction('${t.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.8rem;">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('')
            : '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No transactions yet</div>';

        ModalManager.create({
            id: 'transactions-modal',
            title: 'Transaction History',
            content: `<div style="max-height: 400px; overflow-y: auto;">${content}</div>`,
            size: 'large',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    },

    showAnalytics() {
        const breakdown = this.getCategoryBreakdown();
        const monthly = this.getMonthlyTrend();
        const { income, expenses, balance } = this.getBalance();

        const breakdownHtml = breakdown.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${item.icon}</span>
                    <span>${item.label}</span>
                </div>
                <div style="text-align: right;">
                    <div>$${item.amount.toFixed(2)}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${item.percentage}%</div>
                </div>
            </div>
        `).join('');

        const content = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Income</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">$${income.toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Expenses</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">$${expenses.toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: 12px;">
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Balance</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${balance >= 0 ? 'var(--success)' : 'var(--danger)'};">$${balance.toFixed(2)}</div>
                </div>
            </div>
            <h4 style="margin-bottom: 12px;">Expense Breakdown</h4>
            ${breakdownHtml}
        `;

        ModalManager.create({
            id: 'expense-analytics-modal',
            title: 'Expense Analytics',
            content,
            size: 'medium',
            buttons: [{ id: 'close', text: 'Close', primary: true }]
        });
    }
};

// Global function for HTML onclick
function addTransaction() {
    const desc = document.getElementById('expenseDesc');
    const amount = document.getElementById('expenseAmount');
    const category = document.getElementById('expenseCategory');

    if (desc && amount && category) {
        const success = TransactionManager.addTransaction(
            desc.value,
            amount.value,
            category.value
        );

        if (success) {
            desc.value = '';
            amount.value = '';
        }
    }
}

// Update balance on load
document.addEventListener('DOMContentLoaded', () => {
    TransactionManager.init();
});

window.TransactionManager = TransactionManager;
window.addTransaction = addTransaction;
