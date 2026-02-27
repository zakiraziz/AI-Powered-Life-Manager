import type { User, LoginCredentials, RegisterData, TokenPair } from '../types';
import { firebaseAuth } from './firebaseService';

// Security: Environment check for production
const isProduction = import.meta.env.PROD;

class AuthService {
  private readonly API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: TokenPair }> {
    // Try Firebase authentication first
    try {
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(
        credentials.email,
        credentials.password
      );
      
      const idToken = await userCredential.user.getIdToken();
      // Token result obtained but not yet used - kept for future token refresh functionality
      void await userCredential.user.getIdTokenResult();
      
      // Get or create user profile from backend
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ email: credentials.email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to authenticate with server');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // If Firebase fails, try local authentication for demo
      console.warn('Firebase auth failed, falling back to local storage');
      return this.localLogin(credentials);
    }
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: TokenPair }> {
    try {
      // Create user with Firebase
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
        data.email,
        data.password
      );
      
      const idToken = await userCredential.user.getIdToken();
      
      // Save user profile to backend
      const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          preferences: data.preferences,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to register user');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.warn('Firebase registration failed, falling back to local storage');
      return this.localRegister(data);
    }
  }

  async logout(): Promise<void> {
    try {
      await firebaseAuth.signOut();
    } catch (error) {
      console.warn('Firebase logout failed:', error);
    }
    // Clear local storage regardless
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    return response.json();
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
    
    const response = await fetch(`${this.API_BASE_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    
    return response.json();
  }

  async getCurrentUser(): Promise<User | null> {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  // Local fallback methods for demo/offline mode - ONLY for development
  private async localLogin(credentials: LoginCredentials): Promise<{ user: User; tokens: TokenPair }> {
    // Security: Only allow local auth in development mode
    if (isProduction) {
      throw new Error('Authentication service unavailable. Please try again later.');
    }
    
    const userRecords = JSON.parse(localStorage.getItem('userRecords') || '[]');
    const userRecord = userRecords.find((u: { email: string; passwordHash: string }) => {
      // Security: Verify password using simple hash
      return u.email === credentials.email && u.passwordHash === this.simpleHash(credentials.password);
    });
    
    if (!userRecord) {
      throw new Error('Invalid email or password');
    }
    
    // Create user without password hash
    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      preferences: userRecord.preferences,
      createdAt: userRecord.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    const tokens: TokenPair = {
      accessToken: `local_token_${Date.now()}`,
      refreshToken: `local_refresh_${Date.now()}`,
      expiresIn: 3600,
    };
    
    return { user, tokens };
  }

  private simpleHash(password: string): string {
    // Simple hash for demo - in production use bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private async localRegister(data: RegisterData): Promise<{ user: User; tokens: TokenPair }> {
    // Security: Only allow local registration in development mode
    if (isProduction) {
      throw new Error('Registration service unavailable. Please try again later.');
    }
    
    const userRecords = JSON.parse(localStorage.getItem('userRecords') || '[]');
    
    if (userRecords.some((u: { email: string }) => u.email === data.email)) {
      throw new Error('Email already registered');
    }
    
    const userId = `user_${Date.now()}`;
    
    // Store user record with password hash separately from public user data
    const newUserRecord = {
      id: userId,
      email: data.email,
      passwordHash: this.simpleHash(data.password),
      name: data.name,
      preferences: {
        theme: 'dark' as const,
        language: 'en' as const,
        notifications: {
          taskReminders: true,
          moodReminders: true,
          expenseAlerts: true,
          achievementNotifications: true,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      createdAt: new Date().toISOString(),
    };
    
    userRecords.push(newUserRecord);
    localStorage.setItem('userRecords', JSON.stringify(userRecords));
    
    // Return user without sensitive data
    const user: User = {
      id: userId,
      email: data.email,
      name: data.name,
      preferences: newUserRecord.preferences,
      createdAt: newUserRecord.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    const tokens: TokenPair = {
      accessToken: `local_token_${Date.now()}`,
      refreshToken: `local_refresh_${Date.now()}`,
      expiresIn: 3600,
    };
    
    return { user, tokens };
  }
}

export const authService = new AuthService();
