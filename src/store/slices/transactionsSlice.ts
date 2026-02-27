import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Transaction, ExpenseAnalytics } from '../../types';
import { transactionService } from '../../services/transactionService';

interface TransactionsState {
  transactions: Transaction[];
  analytics: ExpenseAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

const loadTransactionsFromStorage = (): Transaction[] => {
  const saved = localStorage.getItem('transactions');
  return saved ? JSON.parse(saved) : [];
};

const initialState: TransactionsState = {
  transactions: loadTransactionsFromStorage(),
  analytics: null,
  isLoading: false,
  error: null,
};

export const fetchTransactions = createAsyncThunk<Transaction[], void>(
  'transactions/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      return await transactionService.getTransactions();
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const createTransaction = createAsyncThunk<Transaction, Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>(
  'transactions/createTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      return await transactionService.createTransaction(transactionData);
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const fetchExpenseAnalytics = createAsyncThunk<ExpenseAnalytics, void>(
  'transactions/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await transactionService.getAnalytics();
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.push(action.payload);
      localStorage.setItem('transactions', JSON.stringify(state.transactions));
    },
    removeTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(t => t.id !== action.payload);
      localStorage.setItem('transactions', JSON.stringify(state.transactions));
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
      localStorage.setItem('transactions', JSON.stringify(action.payload));
    },
    clearTransactionsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
        localStorage.setItem('transactions', JSON.stringify(action.payload));
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactions.push(action.payload);
        localStorage.setItem('transactions', JSON.stringify(state.transactions));
      })
      .addCase(fetchExpenseAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const { addTransaction, removeTransaction, setTransactions, clearTransactionsError } = transactionsSlice.actions;
export default transactionsSlice.reducer;
