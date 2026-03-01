import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tasksReducer from './slices/tasksSlice';
import moodsReducer from './slices/moodsSlice';
import transactionsReducer from './slices/transactionsSlice';
import uiReducer from './slices/uiSlice';
import productivityReducer from './slices/productivitySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    moods: moodsReducer,
    transactions: transactionsReducer,
    ui: uiReducer,
    productivity: productivityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export actions for convenience
export * from './slices/authSlice';
export * from './slices/moodsSlice';
export * from './slices/transactionsSlice';
export * from './slices/uiSlice';
export * from './slices/productivitySlice';
