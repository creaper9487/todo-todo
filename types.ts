export interface Todo {
  id: string;
  title: string;
  hour: number; // 0-23
  completed: boolean;
  color?: string;
}

export interface VoiceRecording {
  id: string;
  blob: Blob;
  timestamp: number;
  duration: number;
  status: 'queued' | 'uploading' | 'uploaded' | 'failed';
  url?: string;
}

export enum AppTab {
  VOICE = 'VOICE',
  TODO = 'TODO',
}

export interface ApiError {
  message: string;
}