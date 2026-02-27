import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { MoodEntry, MoodAnalytics } from '../../types';
import { moodService } from '../../services/moodService';

interface MoodsState {
  moods: MoodEntry[];
  analytics: MoodAnalytics | null;
  isLoading: boolean;
  error: string | null;
}

const loadMoodsFromStorage = (): MoodEntry[] => {
  const saved = localStorage.getItem('moods');
  return saved ? JSON.parse(saved) : [];
};

const initialState: MoodsState = {
  moods: loadMoodsFromStorage(),
  analytics: null,
  isLoading: false,
  error: null,
};

export const fetchMoods = createAsyncThunk<MoodEntry[], void>(
  'moods/fetchMoods',
  async (_, { rejectWithValue }) => {
    try {
      return await moodService.getMoods();
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const createMoodEntry = createAsyncThunk<MoodEntry, Omit<MoodEntry, 'id' | 'createdAt'>>(
  'moods/createMoodEntry',
  async (moodData, { rejectWithValue }) => {
    try {
      return await moodService.createMood(moodData);
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMoodAnalytics = createAsyncThunk<MoodAnalytics, void>(
  'moods/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await moodService.getAnalytics();
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

const moodsSlice = createSlice({
  name: 'moods',
  initialState,
  reducers: {
    addMood: (state, action: PayloadAction<MoodEntry>) => {
      state.moods.push(action.payload);
      localStorage.setItem('moods', JSON.stringify(state.moods));
    },
    setMoods: (state, action: PayloadAction<MoodEntry[]>) => {
      state.moods = action.payload;
      localStorage.setItem('moods', JSON.stringify(action.payload));
    },
    clearMoodsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMoods.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMoods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.moods = action.payload;
        localStorage.setItem('moods', JSON.stringify(action.payload));
      })
      .addCase(fetchMoods.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createMoodEntry.fulfilled, (state, action) => {
        state.moods.push(action.payload);
        localStorage.setItem('moods', JSON.stringify(state.moods));
      })
      .addCase(fetchMoodAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const { addMood, setMoods, clearMoodsError } = moodsSlice.actions;
export default moodsSlice.reducer;
