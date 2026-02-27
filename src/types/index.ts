// ===== CORE DATA TYPES =====

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'ur' | 'ar' | 'es';
  notifications: NotificationSettings;
  timezone: string;
}

export interface NotificationSettings {
  taskReminders: boolean;
  moodReminders: boolean;
  expenseAlerts: boolean;
  achievementNotifications: boolean;
}

// ===== TASK TYPES =====

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  deadline?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
  attachments?: Attachment[];
}

export type TaskCategory = 'study' | 'health' | 'work' | 'personal' | 'fitness' | 'social';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface TaskFilter {
  search?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: 'all' | 'completed' | 'pending';
  dateRange?: DateRange;
}

export interface DateRange {
  start: string;
  end: string;
}

// ===== MOOD & MENTAL HEALTH TYPES =====

export interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: MoodType;
  journal?: string;
  gratitude?: string[];
  tags?: string[];
  createdAt: string;
}

export type MoodType = '😊' | '😐' | '😔' | '😤' | '😴' | '🤔' | '😄' | '🥰';

export interface MoodAnalytics {
  weeklyAverage: number;
  monthlyAverage: number;
  trend: 'improving' | 'stable' | 'declining';
  mostProductiveDay: string;
  commonGratitudes: string[];
}

// ===== EXPENSE TYPES =====

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionCategory = 
  | 'income' 
  | 'food' 
  | 'transport' 
  | 'entertainment' 
  | 'bills' 
  | 'shopping' 
  | 'healthcare' 
  | 'education'
  | 'other';

export interface ExpenseAnalytics {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

// ===== PRODUCTIVITY TYPES =====

export interface ProductivityStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  mostProductiveDay: string;
  tasksCompletedToday: number;
  averageCompletionTime: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpValue: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

// ===== TIMEZONE TYPES =====

export interface UserTimezone {
  id: string;
  country: string;
  city: string;
  timezone: string;
  abbreviation: string;
  offset: number;
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// ===== AUTH TYPES =====

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  preferences?: Partial<UserPreferences>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ===== FIREBASE TYPES =====

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// ===== THEME TYPES =====

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
}

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

// ===== I18N TYPES =====

export interface Translations {
  [key: string]: string | Translations;
}

export type SupportedLanguage = 'en' | 'ur' | 'ar' | 'es';

export interface I18nConfig {
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  translations: Record<SupportedLanguage, Translations>;
}
