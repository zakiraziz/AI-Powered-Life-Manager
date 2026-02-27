import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Task, TaskFilter, TaskCategory, TaskPriority } from '../../types';
import { taskService } from '../../services/taskService';

interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  filter: TaskFilter;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
}

const loadTasksFromStorage = (): Task[] => {
  const saved = localStorage.getItem('tasks');
  return saved ? JSON.parse(saved) : [];
};

const initialState: TasksState = {
  tasks: loadTasksFromStorage(),
  selectedTask: null,
  filter: { status: 'all' },
  isLoading: false,
  error: null,
  isSyncing: false,
};

// Async thunks
export const fetchTasks = createAsyncThunk<Task[], void>(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const tasks = await taskService.getTasks();
      return tasks;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const createTask = createAsyncThunk<Task, Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const task = await taskService.createTask(taskData);
      return task;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const updateTask = createAsyncThunk<Task, { id: string; updates: Partial<Task> }>(
  'tasks/updateTask',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const task = await taskService.updateTask(id, updates);
      return task;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const deleteTask = createAsyncThunk<string, string>(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(id);
      return id;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const syncTasks = createAsyncThunk<void, void>(
  'tasks/syncTasks',
  async () => {
    await taskService.syncTasks();
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    },
    toggleTaskComplete: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(t => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        if (task.completed) {
          task.completedAt = new Date().toISOString();
        }
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
      }
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    setFilter: (state, action: PayloadAction<TaskFilter>) => {
      state.filter = action.payload;
    },
    reorderTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
        localStorage.setItem('tasks', JSON.stringify(action.payload));
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
          localStorage.setItem('tasks', JSON.stringify(state.tasks));
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
      })
      .addCase(syncTasks.pending, (state) => {
        state.isSyncing = true;
      })
      .addCase(syncTasks.fulfilled, (state) => {
        state.isSyncing = false;
      })
      .addCase(syncTasks.rejected, (state) => {
        state.isSyncing = false;
      });
  },
});

export const {
  addTask,
  removeTask,
  toggleTaskComplete,
  setSelectedTask,
  setFilter,
  reorderTasks,
  clearError,
} = tasksSlice.actions;

export default tasksSlice.reducer;
