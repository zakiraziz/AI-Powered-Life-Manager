import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SupportedLanguage } from '../../types';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  theme: 'light' | 'dark';
  language: SupportedLanguage;
  sidebarOpen: boolean;
  notifications: Notification[];
  isOnline: boolean;
  isPWAInstalled: boolean;
  activeSection: string;
  modals: {
    taskModal: boolean;
    moodModal: boolean;
    transactionModal: boolean;
    settingsModal: boolean;
    profileModal: boolean;
  };
}

const loadThemeFromStorage = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('theme');
  return (saved as 'light' | 'dark') || 'dark';
};

const loadLanguageFromStorage = (): SupportedLanguage => {
  const saved = localStorage.getItem('language');
  return (saved as SupportedLanguage) || 'en';
};

const initialState: UIState = {
  theme: loadThemeFromStorage(),
  language: loadLanguageFromStorage(),
  sidebarOpen: true,
  notifications: [],
  isOnline: navigator.onLine,
  isPWAInstalled: window.matchMedia('(display-mode: standalone)').matches,
  activeSection: 'dashboard',
  modals: {
    taskModal: false,
    moodModal: false,
    transactionModal: false,
    settingsModal: false,
    profileModal: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
      document.documentElement.setAttribute('data-theme', state.theme);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    setLanguage: (state, action: PayloadAction<SupportedLanguage>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setPWAInstalled: (state, action: PayloadAction<boolean>) => {
      state.isPWAInstalled = action.payload;
    },
    setActiveSection: (state, action: PayloadAction<string>) => {
      state.activeSection = action.payload;
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setLanguage,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setOnlineStatus,
  setPWAInstalled,
  setActiveSection,
  openModal,
  closeModal,
  closeAllModals,
} = uiSlice.actions;

export default uiSlice.reducer;
