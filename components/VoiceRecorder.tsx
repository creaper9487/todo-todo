import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useStore';
import { apiService } from '../services/api';
import { VoiceRecording } from '../types';

const AUTO_UPLOAD_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes

export const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    // Clear timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
         mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    // Stop all tracks (Microphone and Screen)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async (isRestart = false) => {
    try {
      let stream = streamRef.current;

      // If strictly starting new session (not a restart), get streams
      if (!isRestart) {
        // 1. Get Microphone
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 2. Get Screen (Video only)
        // User will be prompted to select screen/window
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: false // We use microphone audio usually
        });

        // 3. Combine into one stream
        stream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
        ]);
        streamRef.current = stream;

        // 4. Handle if user stops screen sharing via browser UI
        displayStream.getVideoTracks()[0].onended = () => {
            stopRecording();
        };
      }

      // Safety check
      if (!stream || !stream.active) {
        console.warn("Stream is inactive or missing during start/restart.");
        stopRecording();
        return;
      }

      // Create Recorder
      // Attempt to use a video mime type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') 
         ? 'video/webm;codecs=vp8,opus' 
         : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = handleDataAvailable;
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 0) {
            saveAndUpload(blob);
        }
        chunksRef.current = [];
        // Note: We DO NOT stop tracks here to allow for the restart logic
      };

      mediaRecorder.start();

      // If this is a fresh start (not a cycle), setup UI and intervals
      if (!isRestart) {
        setIsRecording(true);
        setDuration(0);

        // UI Timer
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);

        // Auto-save Interval (20 mins)
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(() => {
          console.log("Auto-cycling recording session...");
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
             mediaRecorderRef.current.stop(); 
             // Triggers onstop -> saves blob -> does NOT stop stream
             // Immediately start new recorder with SAME stream
             // Use setTimeout to ensure event loop clears
             setTimeout(() => {
               startRecording(true); 
             }, 100);
          }
        }, AUTO_UPLOAD_INTERVAL_MS);
      }

    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not start recording. Please ensure microphone and screen permissions are granted.");
      stopRecording();
    }
  }, [handleDataAvailable, saveAndUpload, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-8">
      {/* Visualizer / Status Circle */}
      <div className={`relative flex items-center justify-center w-64 h-64 rounded-full transition-all duration-500 ${isRecording ? 'bg-surface shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'bg-surface'}`}>
        {isRecording && (
          <div className="absolute w-full h-full rounded-full border-4 border-red-500/30 animate-ping"></div>
        )}
        <div className="flex flex-col items-center z-10">
            <div className="text-4xl font-mono text-zinc-100 tabular-nums mb-2">
            {formatTime(duration)}
            </div>
            {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">REC SCREEN</span>
                </div>
            )}
        </div>
        
        <div className="absolute bottom-10 text-xs text-zinc-500 uppercase tracking-widest">
          {isRecording ? 'System Active' : 'Ready to Record'}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={() => isRecording ? stopRecording() : startRecording(false)}
        className={`px-12 py-4 rounded-full font-bold text-lg tracking-wide transition-all duration-300 transform active:scale-95 shadow-lg ${
          isRecording 
            ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
            : 'bg-primary text-zinc-950 hover:bg-emerald-400 hover:shadow-emerald-500/20'
        }`}
      >
        {isRecording ? 'STOP CAPTURE' : 'START CAPTURE'}
      </button>

      <div className="text-center text-zinc-500 text-sm max-w-xs">
        <p>Screen and audio are captured and uploaded every 20 minutes automatically.</p>
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
                  AV
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
