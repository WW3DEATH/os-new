import React from 'react';
import { useOS } from '../../context/OSContext';
import { Layers, Plus, Monitor, X } from 'lucide-react';

export const MissionControl: React.FC = () => {
  const { 
    missionControlOpen, 
    setMissionControlOpen, 
    windows, 
    focusWindow, 
    currentSpaceId, 
    setCurrentSpaceId, 
    activeDisplayId, 
    settings 
  } = useOS();

  if (!missionControlOpen) return null;

  const spaces = [
    { id: 1, name: 'Desktop 1 (Creative Hub)' },
    { id: 2, name: 'Desktop 2 (VFX & Render)' },
    { id: 3, name: 'Desktop 3 (Docs & Drive)' },
  ];

  const currentWindows = windows.filter(w => w.isOpen && !w.isMinimized);

  return (
    <div
      onClick={() => setMissionControlOpen(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex flex-col p-6 select-none animate-in fade-in duration-200"
    >
      {/* Top Spaces Bar */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        {spaces.map(s => (
          <button
            key={s.id}
            onClick={(e) => { e.stopPropagation(); setCurrentSpaceId(s.id); }}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
              currentSpaceId === s.id
                ? 'bg-sky-500 text-white border-sky-400 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-neutral-300 border-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Scaled Windows Overview */}
      <div className="flex-1 flex flex-wrap items-center justify-center gap-6 p-4 overflow-y-auto">
        {currentWindows.length === 0 ? (
          <div className="text-center text-white/50 space-y-2">
            <Layers className="w-12 h-12 mx-auto" />
            <p className="text-sm">No active windows open in this space.</p>
          </div>
        ) : (
          currentWindows.map((win) => (
            <div
              key={win.id}
              onClick={(e) => {
                e.stopPropagation();
                focusWindow(win.id);
                setMissionControlOpen(false);
              }}
              className="w-72 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 hover:border-sky-400 cursor-pointer transform hover:scale-105 transition-all duration-200 flex flex-col bg-neutral-900/90 text-white group"
            >
              {/* Fake Window Header */}
              <div className="h-6 bg-neutral-800 border-b border-white/10 flex items-center justify-between px-2 text-[10px]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <span className="font-semibold truncate max-w-[140px] opacity-80">{win.title}</span>
                <div className="w-6"></div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-400">
                <span className="font-bold text-xs uppercase tracking-wider group-hover:text-sky-300 transition-colors">
                  {win.appId.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center text-white/40 text-xs mt-2">
        Click any window or press ESC to return to desktop
      </div>
    </div>
  );
};
