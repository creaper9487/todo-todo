import { Todo } from '../types';

// Simulating axios for the purpose of the demo
// In a real app, you would import axios from 'axios';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  fetchTodos: async (): Promise<Todo[]> => {
    await delay(800); // Simulate network latency
    // Mock data
    return [
      { id: '1', title: 'Morning Standup', hour: 9, completed: false, color: 'bg-blue-500' },
      { id: '2', title: 'Code Review', hour: 9, completed: true, color: 'bg-indigo-500' },
      { id: '3', title: 'Client Call', hour: 10, completed: false, color: 'bg-emerald-500' },
      { id: '4', title: 'Lunch Break', hour: 12, completed: false, color: 'bg-orange-500' },
      { id: '5', title: 'Focus Time', hour: 14, completed: false, color: 'bg-purple-500' },
      { id: '6', title: 'Focus Time', hour: 14, completed: false, color: 'bg-purple-500' },
      { id: '7', title: 'Team Sync', hour: 16, completed: false, color: 'bg-pink-500' },
    ];
  },

  uploadVoiceChunk: async (blob: Blob): Promise<boolean> => {
    // This simulates axios.post('/api/upload', formData)
    console.log(`[Mock Axios] Uploading A/V media chunk (${blob.type}), size: ${blob.size} bytes...`);
    await delay(1500); // Simulate upload time
    if (Math.random() > 0.95) {
        // Random failure chance
        throw new Error("Network Error");
    }
    console.log(`[Mock Axios] Upload complete.`);
    return true;
  }
};