import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Wifi, 
  Search, 
  Sliders, 
  Flame, 
  Monitor, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  BatteryMedium, 
  UserCheck, 
  Moon, 
  Sun,
  ShieldCheck,
  Check
} from 'lucide-react';

export const MenuBar: React.FC = () => {
  const { 
    windows, 
    activeWindowId, 
    openApp, 
    closeWindow, 
    hardware, 
    setThermalMode, 
    displays, 
    activeDisplayId, 
    setActiveDisplayId, 
    syncStatus, 
    triggerManualBackup, 
    lastBackupTime, 
    setSpotlightOpen, 
    setControlCenterOpen, 
    controlCenterOpen, 
    settings, 
    toggleTheme, 
    setLocked, 
    user, 
    teamPresence 
  } = useOS();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Active window title
  const activeWindow = windows.find(w => w.id === activeWindowId);
  const activeAppName = activeWindow?.title || 'Finder';

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAppleMenuAction = (action: string) => {
    setActiveMenu(null);
    if (action === 'about') {
      openApp('settings');
    } else if (action === 'settings') {
      openApp('settings');
    } else if (action === 'lock') {
      setLocked(true);
    } else if (action === 'activity') {
      openApp('activity_monitor');
    } else if (action === 'restart' || action === 'shutdown') {
      setLocked(true);
    }
  };

  return (
    <header 
      ref={menuBarRef} 
      className={`fixed top-0 left-0 right-0 h-7 z-50 px-3 flex items-center justify-between text-xs select-none backdrop-blur-2xl transition-colors duration-300 border-b ${
        settings.theme === 'dark' 
          ? 'bg-neutral-900/75 text-neutral-200 border-white/10 shadow-sm' 
          : 'bg-white/80 text-neutral-800 border-black/10 shadow-sm'
      }`}
    >
      {/* Left items: Apple logo, App menus */}
      <div className="flex items-center space-x-1 font-medium">
        {/* Apple Menu */}
        <div className="relative">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'apple' ? null : 'apple')}
            className={`px-2 py-0.5 rounded flex items-center transition-colors ${
              activeMenu === 'apple' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            {/* Apple Logo SVG */}
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.71-11.65-14.01-6.73-10.45-12-22.18-15.82-35.18-3.82-13-5.73-25.26-5.73-36.78 0-14.56 3.65-26.65 10.95-36.27 7.3-9.61 16.48-14.53 27.54-14.76 5.43 0 11.36 1.48 17.79 4.45 6.43 2.97 10.5 4.51 12.22 4.63 1.93-.24 6.25-1.9 12.95-4.99 6.71-3.09 12.44-4.53 17.2-4.32 12.73.66 22.84 5.37 30.33 14.13-11.03 6.64-16.4 15.74-16.1 27.31.29 9.17 3.86 16.89 10.71 23.16 6.85 6.27 15.13 9.77 24.84 10.51-2.22 6.85-4.88 13.91-7.98 21.19zM119.22 31.84c0-7.39 2.65-14.32 7.96-20.78 5.3-6.46 11.83-10.49 19.58-12.06.31 1.25.47 2.47.47 3.66 0 7.39-2.73 14.47-8.19 21.24-5.46 6.77-12.02 10.75-19.68 11.94-.09-1.2-.14-2.53-.14-4z"/>
            </svg>
          </button>

          {activeMenu === 'apple' && (
            <div className={`absolute top-full left-0 mt-1 w-56 rounded-lg py-1 shadow-2xl backdrop-blur-2xl border text-xs z-50 ${
              settings.theme === 'dark' ? 'bg-neutral-800/90 text-neutral-200 border-white/10' : 'bg-white/90 text-neutral-800 border-black/10'
            }`}>
              <button onClick={() => handleAppleMenuAction('about')} className="w-full text-left px-4 py-1.5 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                <span>About NebulaOS</span>
                <span className="opacity-50 text-[10px]">M3 Ultra</span>
              </button>
              <div className="h-[1px] bg-white/10 my-1"></div>
              <button onClick={() => handleAppleMenuAction('settings')} className="w-full text-left px-4 py-1.5 hover:bg-sky-500 hover:text-white transition-colors">
                System Settings...
              </button>
              <button onClick={() => openApp('activity_monitor')} className="w-full text-left px-4 py-1.5 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                <span>Activity & Thermals</span>
                <span className="opacity-50 text-[10px]">⌥⌘Esc</span>
              </button>
              <button onClick={() => openApp('shortcuts')} className="w-full text-left px-4 py-1.5 hover:bg-sky-500 hover:text-white transition-colors">
                Custom Keyboard Shortcuts...
              </button>
              <div className="h-[1px] bg-white/10 my-1"></div>
              <button onClick={() => handleAppleMenuAction('lock')} className="w-full text-left px-4 py-1.5 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                <span>Lock Screen</span>
                <span className="opacity-50 text-[10px]">⌥⌘L</span>
              </button>
              <button onClick={() => handleAppleMenuAction('restart')} className="w-full text-left px-4 py-1.5 hover:bg-sky-500 hover:text-white transition-colors">
                Restart NebulaOS...
              </button>
            </div>
          )}
        </div>

        {/* Current Focused App */}
        <span className="font-semibold px-2 py-0.5 rounded cursor-default">{activeAppName}</span>

        {/* Standard macOS Menu Items */}
        {['File', 'Edit', 'View', 'Window', 'Help'].map((item) => (
          <div key={item} className="relative hidden sm:block">
            <button
              onClick={() => setActiveMenu(activeMenu === item ? null : item)}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeMenu === item ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              {item}
            </button>
            {activeMenu === item && (
              <div className={`absolute top-full left-0 mt-1 w-48 rounded-lg py-1 shadow-2xl backdrop-blur-2xl border text-xs z-50 ${
                settings.theme === 'dark' ? 'bg-neutral-800/90 text-neutral-200 border-white/10' : 'bg-white/90 text-neutral-800 border-black/10'
              }`}>
                {item === 'File' && (
                  <>
                    <button onClick={() => { openApp('finder'); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                      <span>New Finder Window</span>
                      <span className="opacity-50 text-[10px]">⌘N</span>
                    </button>
                    <button onClick={() => { if (activeWindowId) closeWindow(activeWindowId); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                      <span>Close Window</span>
                      <span className="opacity-50 text-[10px]">⌘W</span>
                    </button>
                    <button onClick={() => { triggerManualBackup(); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                      <span>Save Cloud Snapshot</span>
                      <span className="opacity-50 text-[10px]">⌘S</span>
                    </button>
                  </>
                )}
                {item === 'Edit' && (
                  <>
                    <button onClick={() => setActiveMenu(null)} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                      <span>Undo</span>
                      <span className="opacity-50 text-[10px]">⌘Z</span>
                    </button>
                    <button onClick={() => setActiveMenu(null)} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                      <span>Redo</span>
                      <span className="opacity-50 text-[10px]">⇧⌘Z</span>
                    </button>
                  </>
                )}
                {item === 'View' && (
                  <>
                    <button onClick={() => { toggleTheme(); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors flex justify-between">
                      <span>Toggle Theme</span>
                      <span className="opacity-50 text-[10px]">⇧⌘D</span>
                    </button>
                    <button onClick={() => { openApp('shortcuts'); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors">
                      Customize Shortcuts...
                    </button>
                  </>
                )}
                {item === 'Window' && (
                  <>
                    <button onClick={() => { openApp('activity_monitor'); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors">
                      Activity Monitor
                    </button>
                    <button onClick={() => { openApp('terminal'); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors">
                      Terminal (Zsh)
                    </button>
                  </>
                )}
                {item === 'Help' && (
                  <>
                    <button onClick={() => { openApp('shortcuts'); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors">
                      Keyboard Shortcuts Cheat Sheet
                    </button>
                    <button onClick={() => { openApp('settings'); setActiveMenu(null); }} className="w-full text-left px-4 py-1 hover:bg-sky-500 hover:text-white transition-colors">
                      NebulaOS Documentation
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right items: Hardware thermals, Multi-monitor, Cloud sync, Team presence, Control Center, Clock */}
      <div className="flex items-center space-x-2">
        {/* Thermal Sensor Quick Pill */}
        <button
          onClick={() => openApp('activity_monitor')}
          title={`CPU: ${hardware.cpuTemp}°C | Fan: ${hardware.fanRPM} RPM | Profile: ${hardware.thermalMode.toUpperCase()}`}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded-full transition-all text-[11px] font-mono ${
            hardware.cpuTemp >= 78 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : hardware.thermalMode === 'turbo'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'hover:bg-white/10 text-neutral-300'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${hardware.cpuTemp >= 78 ? 'text-rose-400' : 'text-amber-400'}`} />
          <span>{hardware.cpuTemp}°C</span>
          <span className="opacity-60 text-[10px] hidden md:inline">{hardware.fanRPM} RPM</span>
        </button>

        {/* Multi-Monitor Display Pill */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setActiveMenu(activeMenu === 'display' ? null : 'display')}
            title="Switch Monitor / Virtual Workspace"
            className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-white/10 transition-colors text-[11px]"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span>{activeDisplayId === 'display-1' ? 'Display 1 (5K)' : 'Display 2 (HDR)'}</span>
          </button>

          {activeMenu === 'display' && (
            <div className={`absolute top-full right-0 mt-1 w-64 rounded-lg p-2 shadow-2xl backdrop-blur-2xl border text-xs z-50 ${
              settings.theme === 'dark' ? 'bg-neutral-800/95 text-neutral-200 border-white/10' : 'bg-white/95 text-neutral-800 border-black/10'
            }`}>
              <div className="font-semibold px-2 py-1 text-[11px] text-neutral-400 uppercase tracking-wider">
                Multi-Monitor Configuration
              </div>
              {displays.map(disp => (
                <button
                  key={disp.id}
                  onClick={() => { setActiveDisplayId(disp.id); setActiveMenu(null); }}
                  className={`w-full text-left p-2 rounded-md transition-colors flex items-start justify-between ${
                    activeDisplayId === disp.id ? 'bg-sky-500/20 border border-sky-500/30 text-sky-300' : 'hover:bg-white/10'
                  }`}
                >
                  <div>
                    <div className="font-medium text-xs">{disp.name}</div>
                    <div className="text-[10px] opacity-60">{disp.resolution}</div>
                  </div>
                  {activeDisplayId === disp.id && <Check className="w-4 h-4 text-sky-400 mt-0.5" />}
                </button>
              ))}
              <div className="h-[1px] bg-white/10 my-1"></div>
              <button 
                onClick={() => { openApp('settings'); setActiveMenu(null); }}
                className="w-full text-left px-2 py-1 text-[11px] text-sky-400 hover:underline"
              >
                Arrange Displays in Settings...
              </button>
            </div>
          )}
        </div>

        {/* Cloud Sync Status */}
        <button
          onClick={triggerManualBackup}
          title={`Status: ${syncStatus === 'synced' ? 'Firebase & Google Drive Synced' : 'Syncing changes...'} (Last backup: ${lastBackupTime})`}
          className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
          ) : syncStatus === 'synced' ? (
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden xl:inline text-[11px] opacity-75">
            {syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline Ready'}
          </span>
        </button>

        {/* Team Collaboration Avatars */}
        {teamPresence.length > 0 && (
          <div className="hidden md:flex items-center -space-x-1.5 pl-1" title={`${teamPresence.length} Team Members Active Online`}>
            {teamPresence.slice(0, 2).map((m, idx) => (
              <div 
                key={m.id || idx} 
                className={`w-4 h-4 rounded-full border border-black/40 text-[9px] flex items-center justify-center font-bold text-white shadow-sm ${m.avatarColor || 'bg-sky-500'}`}
              >
                {m.name[0]}
              </div>
            ))}
          </div>
        )}

        {/* Wi-Fi & Battery */}
        <div className="flex items-center space-x-1 px-1 opacity-80 hidden sm:flex">
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4" />
        </div>

        {/* Spotlight Search Trigger */}
        <button
          onClick={() => setSpotlightOpen(true)}
          title="Spotlight Search (⌘Space)"
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Control Center Toggle */}
        <button
          onClick={() => setControlCenterOpen(!controlCenterOpen)}
          title="Control Center"
          className={`p-1 rounded transition-colors ${controlCenterOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Date & Time */}
        <button 
          onClick={() => setControlCenterOpen(!controlCenterOpen)}
          className="px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors font-medium text-[11px]"
        >
          <span className="hidden sm:inline mr-1 opacity-80">{currentDate}</span>
          <span>{currentTime}</span>
        </button>
      </div>
    </header>
  );
};
