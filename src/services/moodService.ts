import type { MoodEntry, MoodAnalytics } from '../types';
import { dbHelpers } from './firebaseService';

class MoodService {
  private readonly COLLECTION_NAME = 'moods';

  async getMoods(): Promise<MoodEntry[]> {
    try {
      const userId = this.getCurrentUserId();
      if (userId) {
        return await dbHelpers.getCollection<MoodEntry>(this.COLLECTION_NAME, {
          where: [['userId', '==', userId]],
          orderBy: [['date', 'desc'] as [string, 'asc' | 'desc']],
          limit: 30,
        });
      }
    } catch (error) {
      console.warn('Firebase getMoods failed, falling back to local storage');
    }
    
    const saved = localStorage.getItem('moods');
    return saved ? JSON.parse(saved) : [];
  }

  async createMood(moodData: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<MoodEntry> {
    const mood: MoodEntry = {
      ...moodData,
      id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    try {
      await dbHelpers.setDocument(this.COLLECTION_NAME, mood.id, mood as unknown as Record<string, unknown>);
    } catch (error) {
      console.warn('Firebase createMood failed, saving to local storage');
      const saved = localStorage.getItem('moods');
      const moods: MoodEntry[] = saved ? JSON.parse(saved) : [];
      moods.push(mood);
      localStorage.setItem('moods', JSON.stringify(moods));
    }

    return mood;
  }

  async getAnalytics(): Promise<MoodAnalytics> {
    const moods = await this.getMoods();
    
    // Calculate weekly average (last 7 days)
    const last7Days = moods.slice(0, 7);
    const moodValues: Record<string, number> = {
      '😄': 5, '😊': 4, '😐': 3, '😔': 2, '😤': 1, '😴': 2, '🤔': 3, '🥰': 5
    };
    
    const weeklyAverage = last7Days.length > 0
      ? last7Days.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / last7Days.length
      : 3;
    
    // Calculate monthly average
    const last30Days = moods.slice(0, 30);
    const monthlyAverage = last30Days.length > 0
      ? last30Days.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / last30Days.length
      : 3;
    
    // Determine trend
    const week1 = moods.slice(0, 7);
    const week2 = moods.slice(7, 14);
    const avg1 = week1.length > 0 ? week1.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / week1.length : 3;
    const avg2 = week2.length > 0 ? week2.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / week2.length : 3;
    
    let trend: 'improving' | 'stable' | 'declining';
    if (avg1 > avg2 + 0.5) trend = 'improving';
    else if (avg1 < avg2 - 0.5) trend = 'declining';
    else trend = 'stable';
    
    // Find most productive day
    const dayCounts: Record<string, number> = {};
    moods.filter(m => m.mood === '😄' || m.mood === '😊').forEach(m => {
      const day = new Date(m.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const mostProductiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Monday';
    
    // Common gratitudes
    const allGratitudes: string[] = [];
    moods.forEach(m => {
      if (m.gratitude) {
        allGratitudes.push(...m.gratitude);
      }
    });
    
    return {
      weeklyAverage,
      monthlyAverage,
      trend,
      mostProductiveDay,
      commonGratitudes: allGratitudes.slice(0, 5),
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

export const moodService = new MoodService();
