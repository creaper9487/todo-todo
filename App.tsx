import React, { useState } from 'react';
import { VoiceRecorder } from './components/VoiceRecorder';
import { ScheduleView } from './components/ScheduleView';
import { AppTab } from './types';
import { useAppStore } from './store/useStore';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.VOICE);
  const { todos } = useAppStore();

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans flex flex-col md:flex-row max-w-6xl mx-auto shadow-2xl overflow-hidden md:h-screen">
      
      {/* Sidebar / Navigation */}
      <div className="w-full md:w-20 lg:w-64 bg-surface border-b md:border-b-0 md:border-r border-zinc-800 flex flex-row md:flex-col justify-between p-4 z-20">
        <div className="flex flex-row md:flex-col gap-6 md:gap-8 items-center md:items-start w-full">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-0 md:mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-lg hidden lg:block">ChronoVoice</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-row md:flex-col gap-2 w-full justify-center md:justify-start">
            <button
              onClick={() => setActiveTab(AppTab.VOICE)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all group ${
                activeTab === AppTab.VOICE 
                  ? 'bg-zinc-800 text-white shadow-inner' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <svg className={`w-5 h-5 ${activeTab === AppTab.VOICE ? 'text-primary' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="hidden lg:block text-sm font-medium">Recorder</span>
            </button>

            <button
              onClick={() => setActiveTab(AppTab.TODO)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all group ${
                activeTab === AppTab.TODO 
                  ? 'bg-zinc-800 text-white shadow-inner' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <svg className={`w-5 h-5 ${activeTab === AppTab.TODO ? 'text-secondary' : 'text-current'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="hidden lg:block text-sm font-medium">Schedule</span>
            </button>
          </nav>
        </div>

        {/* Stats Footer */}
        <div className="hidden md:block mt-auto p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
           <div className="text-xs text-zinc-500 mb-1">Today's Progress</div>
           <div className="flex items-end gap-1 mb-2">
             <span className="text-2xl font-bold text-white">{completedCount}</span>
             <span className="text-sm text-zinc-500 mb-1">/ {todos.length}</span>
           </div>
           <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
             <div 
                className="h-full bg-secondary transition-all duration-500"
                style={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
             ></div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-background">
        <header className="absolute top-0 left-0 w-full p-6 border-b border-zinc-800 bg-background/95 backdrop-blur z-10 flex justify-between items-center h-16">
           <h1 className="text-lg font-semibold tracking-wide">
             {activeTab === AppTab.VOICE ? 'Voice Session' : 'Daily Schedule'}
           </h1>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-zinc-500 font-mono">ONLINE</span>
           </div>
        </header>

        <div className="h-full pt-16">
          {activeTab === AppTab.VOICE && <VoiceRecorder />}
          {activeTab === AppTab.TODO && <ScheduleView />}
        </div>
      </main>

    </div>
  );
};

export default App;