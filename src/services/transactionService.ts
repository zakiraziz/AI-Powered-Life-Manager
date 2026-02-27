import type { Transaction, ExpenseAnalytics, CategoryBreakdown, MonthlyTrend, TransactionCategory } from '../types';
import { dbHelpers } from './firebaseService';

class TransactionService {
  private readonly COLLECTION_NAME = 'transactions';

  async getTransactions(): Promise<Transaction[]> {
    try {
      const userId = this.getCurrentUserId();
      if (userId) {
        return await dbHelpers.getCollection<Transaction>(this.COLLECTION_NAME, {
          where: [['userId', '==', userId]],
          orderBy: [['date', 'desc'] as [string, 'asc' | 'desc']],
        });
      }
    } catch (error) {
      console.warn('Firebase getTransactions failed, falling back to local storage');
    }
    
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  }

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const transaction: Transaction = {
      ...transactionData,
      id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbHelpers.setDocument(this.COLLECTION_NAME, transaction.id, transaction as unknown as Record<string, unknown>);
    } catch (error) {
      console.warn('Firebase createTransaction failed, saving to local storage');
      const saved = localStorage.getItem('transactions');
      const transactions: Transaction[] = saved ? JSON.parse(saved) : [];
      transactions.push(transaction);
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    return transaction;
  }

  async getAnalytics(): Promise<ExpenseAnalytics> {
    const transactions = await this.getTransactions();
    
    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.category === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.category !== 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    // Category breakdown
    const expenseCategories: TransactionCategory[] = ['food', 'transport', 'entertainment', 'bills', 'shopping', 'healthcare', 'education', 'other'];
    const categoryBreakdown: CategoryBreakdown[] = expenseCategories.map(category => {
      const amount = transactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
    
    // Monthly trend
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (t.category === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
    });
    
    const monthlyTrend: MonthlyTrend[] = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
      }));
    
    return {
      totalIncome,
      totalExpenses,
      balance,
      categoryBreakdown,
      monthlyTrend,
    };
  }

  private getCurrentUserId(): string | null {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id || null;
    }
    return null;
  }
}

export const transactionService = new TransactionService();
