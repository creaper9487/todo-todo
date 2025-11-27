import { create } from 'zustand';
import { Todo, VoiceRecording } from '../types';

interface AppState {
  todos: Todo[];
  recordings: VoiceRecording[];
  isLoading: boolean;
  error: string | null;
  completedCount: number;
  
  // Todo Actions
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  toggleTodo: (id: string) => void;
  completeTodo: (id: string) => void;
  
  // Voice Actions
  addRecording: (recording: VoiceRecording) => void;
  updateRecordingStatus: (id: string, status: VoiceRecording['status']) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  todos: [],
  recordings: [],
  isLoading: false,
  error: null,
  completedCount: 0,

  setTodos: (todos) => {
    const active = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed).length;
    set({ todos: active, completedCount: completed });
  },

  addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
  
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ),
  })),

  completeTodo: (id) => set((state) => ({
    todos: state.todos.filter((t) => t.id !== id),
    completedCount: state.completedCount + 1
  })),

  addRecording: (recording) => set((state) => ({ recordings: [recording, ...state.recordings] })),
  updateRecordingStatus: (id, status) => set((state) => ({
    recordings: state.recordings.map((r) =>
      r.id === id ? { ...r, status } : r
    ),
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));