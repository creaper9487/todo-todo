import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useStore';
import { apiService } from '../services/api';
import { VoiceRecording } from '../types';

const AUTO_UPLOAD_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes
// For demo purposes, you might want to lower this to test.
// const AUTO_UPLOAD_INTERVAL_MS = 10 * 1000; // 10 seconds for testing

export const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  const { addRecording, updateRecordingStatus, recordings } = useAppStore();

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  }, []);

  const saveAndUpload = useCallback(async (blob: Blob) => {
    const id = crypto.randomUUID();
    const newRecording: VoiceRecording = {
      id,
      blob,
      timestamp: Date.now(),
      duration: duration, 
      status: 'queued'
    };
    
    addRecording(newRecording);
    
    // Trigger upload (Mock Axios)
    try {
      updateRecordingStatus(id, 'uploading');
      await apiService.uploadVoiceChunk(blob);
      updateRecordingStatus(id, 'uploaded');
    } catch (error) {
      console.error("Upload failed", error);
      updateRecordingStatus(id, 'failed');
    }
  }, [addRecording, updateRecordingStatus, duration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timers
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = handleDataAvailable;
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        saveAndUpload(blob);
        chunksRef.current = [];
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // UI Timer
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Auto-save Interval (20 mins)
      intervalRef.current = window.setInterval(() => {
        console.log("Auto-saving voice chunk...");
        // To seamlessly switch, we stop and immediately restart. 
        // Note: There will be a tiny gap. 
        // For Gapless: use mediaRecorder.requestData() but that gives chunks, not a full file header. 
        // Safest 'File' approach: Stop -> Upload -> Start
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
           mediaRecorderRef.current.stop();
           // Wait a tiny bit for the stop event to fire and upload, then restart
           setTimeout(() => {
             startRecording(); // Recursively start new session
           }, 100);
        }
      }, AUTO_UPLOAD_INTERVAL_MS);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow permissions.");
    }
  }, [handleDataAvailable, saveAndUpload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8">
      {/* Visualizer / Status Circle */}
      <div className={`relative flex items-center justify-center w-64 h-64 rounded-full transition-all duration-500 ${isRecording ? 'bg-surface shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'bg-surface'}`}>
        {isRecording && (
          <div className="absolute w-full h-full rounded-full border-4 border-primary/30 animate-ping"></div>
        )}
        <div className="text-4xl font-mono text-zinc-100 tabular-nums">
          {formatTime(duration)}
        </div>
        <div className="absolute bottom-10 text-xs text-zinc-500 uppercase tracking-widest">
          {isRecording ? 'Recording Live' : 'Ready'}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-12 py-4 rounded-full font-bold text-lg tracking-wide transition-all duration-300 transform active:scale-95 shadow-lg ${
          isRecording 
            ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
            : 'bg-primary text-zinc-950 hover:bg-emerald-400 hover:shadow-emerald-500/20'
        }`}
      >
        {isRecording ? 'STOP SESSION' : 'START RECORDING'}
      </button>

      <div className="text-center text-zinc-500 text-sm max-w-xs">
        <p>Recordings are automatically uploaded every 20 minutes via secure connection.</p>
      </div>

      {/* History List */}
      <div className="w-full max-w-md mt-8 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Session History</h3>
        <div className="overflow-y-auto space-y-2 pr-2">
          {recordings.length === 0 && (
            <div className="text-zinc-600 text-sm text-center py-4">No recordings yet</div>
          )}
          {recordings.map((rec) => (
            <div key={rec.id} className="bg-zinc-800/50 p-3 rounded-lg flex items-center justify-between border border-zinc-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs">
                  Voice
                </div>
                <div className="flex flex-col">
                    <span className="text-sm text-zinc-200">Session {new Date(rec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-xs text-zinc-500">{formatTime(rec.duration)}</span>
                </div>
              </div>
              <div>
                {rec.status === 'uploading' && <span className="text-xs text-yellow-500 animate-pulse">Uploading...</span>}
                {rec.status === 'uploaded' && <span className="text-xs text-primary">Sent</span>}
                {rec.status === 'failed' && <span className="text-xs text-red-500">Error</span>}
                {rec.status === 'queued' && <span className="text-xs text-zinc-500">Queued</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};