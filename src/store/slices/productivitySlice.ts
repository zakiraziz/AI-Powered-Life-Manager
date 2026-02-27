import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ProductivityStats, Achievement } from '../../types';

interface ProductivityState {
  stats: ProductivityStats;
  achievements: Achievement[];
  isLoading: boolean;
}

const calculateInitialStats = (): ProductivityStats => {
  const saved = localStorage.getItem('tasks');
  const tasks = saved ? JSON.parse(saved) : [];
  
  const completedTasks = tasks.filter((t: { completed: boolean }) => t.completed).length;
  const totalTasks = tasks.length;
  
  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    currentStreak: 0,
    longestStreak: 0,
    mostProductiveDay: 'Monday',
    tasksCompletedToday: 0,
    averageCompletionTime: 0,
  };
};

const initialAchievements: Achievement[] = [
  {
    id: 'streak-7',
    title: 'Streak Master',
    description: 'Complete tasks 7 days in a row',
    icon: '🔥',
    xpValue: 100,
    unlocked: false,
    progress: 0,
    target: 7,
  },
  {
    id: 'tasks-10',
    title: 'Task Hero',
    description: 'Complete 10 tasks',
    icon: '✅',
    xpValue: 50,
    unlocked: false,
    progress: 0,
    target: 10,
  },
  {
    id: 'tasks-50',
    title: 'Productivity Pro',
    description: 'Complete 50 tasks',
    icon: '🚀',
    xpValue: 200,
    unlocked: false,
    progress: 0,
    target: 50,
  },
  {
    id: 'mood-7',
    title: 'Mindful',
    description: 'Log your mood for 7 days',
    icon: '🧠',
    xpValue: 75,
    unlocked: false,
    progress: 0,
    target: 7,
  },
  {
    id: 'save-100',
    title: 'Saver',
    description: 'Save $100',
    icon: '💰',
    xpValue: 100,
    unlocked: false,
    progress: 0,
    target: 100,
  },
];

const initialState: ProductivityState = {
  stats: calculateInitialStats(),
  achievements: initialAchievements,
  isLoading: false,
};

const productivitySlice = createSlice({
  name: 'productivity',
  initialState,
  reducers: {
    updateStats: (state, action: PayloadAction<Partial<ProductivityStats>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    incrementCompletedTasks: (state) => {
      state.stats.completedTasks += 1;
      state.stats.totalTasks += 1;
      state.stats.completionRate = Math.round(
        (state.stats.completedTasks / state.stats.totalTasks) * 100
      );
      state.stats.tasksCompletedToday += 1;
    },
    updateStreak: (state, action: PayloadAction<number>) => {
      state.stats.currentStreak = action.payload;
      if (action.payload > state.stats.longestStreak) {
        state.stats.longestStreak = action.payload;
      }
    },
    unlockAchievement: (state, action: PayloadAction<string>) => {
      const achievement = state.achievements.find(a => a.id === action.payload);
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
      }
    },
    updateAchievementProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const achievement = state.achievements.find(a => a.id === action.payload.id);
      if (achievement) {
        achievement.progress = action.payload.progress;
        if (achievement.target && action.payload.progress >= achievement.target) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date().toISOString();
        }
      }
    },
    setMostProductiveDay: (state, action: PayloadAction<string>) => {
      state.stats.mostProductiveDay = action.payload;
    },
    resetDailyStats: (state) => {
      state.stats.tasksCompletedToday = 0;
    },
  },
});

export const {
  updateStats,
  incrementCompletedTasks,
  updateStreak,
  unlockAchievement,
  updateAchievementProgress,
  setMostProductiveDay,
  resetDailyStats,
} = productivitySlice.actions;

export default productivitySlice.reducer;
