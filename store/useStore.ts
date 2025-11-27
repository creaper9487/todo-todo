import { create } from 'zustand';
import { Todo, VoiceRecording } from '../types';

interface AppState {
  todos: Todo[];
  recordings: VoiceRecording[];
  isLoading: boolean;
  error: string | null;
  
  // Todo Actions
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  toggleTodo: (id: string) => void;
  
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

  setTodos: (todos) => set({ todos }),
  addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ),
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