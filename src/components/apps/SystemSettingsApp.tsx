import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { WALLPAPERS } from '../../services/initialData';
import { 
  Settings, 
  Monitor, 
  Moon, 
  Sun, 
  Flame, 
  Command, 
  Cloud, 
  HardDrive, 
  ShieldCheck, 
  Volume2, 
  Palette, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  LogOut
} from 'lucide-react';

export const SystemSettingsApp: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    displays, 
    activeDisplayId, 
    setActiveDisplayId, 
    hardware, 
    setThermalMode, 
    toggleThrottlingPrevention, 
    user, 
    logout, 
    openApp, 
    triggerManualBackup, 
    syncStatus, 
    lastBackupTime 
  } = useOS();

  const [activeSection, setActiveSection] = useState<'appearance' | 'displays' | 'wallpaper' | 'thermal' | 'cloud'>('appearance');

  const accentColors = [
    { name: 'blue', bg: 'bg-blue-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'pink', bg: 'bg-pink-500' },
    { name: 'orange', bg: 'bg-orange-500' },
    { name: 'green', bg: 'bg-emerald-500' },
    { name: 'graphite', bg: 'bg-neutral-500' },
  ];

  return (
    <div className={`h-full flex select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Settings Sidebar */}
      <div className={`w-52 border-r p-3 flex flex-col space-y-1 ${
        settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        {/* User Card */}
        <div className="p-2 mb-2 rounded-xl bg-black/10 dark:bg-white/5 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">
            {user?.displayName?.[0] || 'C'}
          </div>
          <div className="truncate flex-1">
            <div className="font-semibold text-xs truncate">{user?.displayName || 'Creative Producer'}</div>
            <div className="text-[10px] opacity-60 truncate">{user?.email || 'guest@studio.local'}</div>
          </div>
        </div>

        <button
          onClick={() => setActiveSection('appearance')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
            activeSection === 'appearance' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance &amp; Theme</span>
        </button>

        <button
          onClick={() => setActiveSection('displays')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
            activeSection === 'displays' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Multi-Monitor Displays</span>
        </button>

        <button
          onClick={() => setActiveSection('wallpaper')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
            activeSection === 'wallpaper' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Wallpaper &amp; Screens</span>
        </button>

        <button
          onClick={() => setActiveSection('thermal')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
            activeSection === 'thermal' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Thermals &amp; Fan Cooling</span>
        </button>

        <button
          onClick={() => setActiveSection('cloud')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
            activeSection === 'cloud' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
          }`}
        >
          <Cloud className="w-4 h-4 text-emerald-400" />
          <span>Firebase &amp; Cloud Backup</span>
        </button>

        <div className="pt-2 border-t border-white/10 mt-auto">
          <button
            onClick={() => openApp('shortcuts')}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left hover:bg-white/10 opacity-80 hover:opacity-100 text-[11px]"
          >
            <Command className="w-3.5 h-3.5" />
            <span>Customize Shortcuts</span>
          </button>
        </div>
      </div>

      {/* Settings Details Pane */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {/* APPEARANCE SECTION */}
        {activeSection === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Appearance</h3>
              <p className="opacity-60 text-xs">Switch between dark mode and light mode across the entire desktop environment.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`p-4 rounded-xl border flex flex-col items-center space-y-2 transition-all ${
                  settings.theme === 'dark' 
                    ? 'border-sky-500 bg-neutral-900 shadow-md ring-2 ring-sky-500/40' 
                    : 'border-white/10 bg-neutral-800/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-full h-16 rounded-lg bg-neutral-950 border border-white/10 flex items-center justify-center">
                  <Moon className="w-6 h-6 text-sky-400" />
                </div>
                <span className="font-semibold text-xs">Dark Mode (Studio)</span>
              </button>

              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`p-4 rounded-xl border flex flex-col items-center space-y-2 transition-all ${
                  settings.theme === 'light' 
                    ? 'border-sky-500 bg-white shadow-md ring-2 ring-sky-500/40 text-neutral-900' 
                    : 'border-black/10 bg-white/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-full h-16 rounded-lg bg-neutral-100 border border-black/10 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-amber-500" />
                </div>
                <span className="font-semibold text-xs">Light Mode (Daylight)</span>
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-xs mb-2">Accent Color</h4>
              <div className="flex items-center space-x-3">
                {accentColors.map(c => (
                  <button
                    key={c.name}
                    onClick={() => updateSettings({ accentColor: c.name })}
                    className={`w-6 h-6 rounded-full ${c.bg} transition-transform ${
                      settings.accentColor === c.name ? 'scale-125 ring-2 ring-white shadow' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between max-w-md">
              <div>
                <span className="font-semibold block">UI Sound Effects</span>
                <span className="opacity-60 text-[11px]">Play native clicks, shutters, and notifications</span>
              </div>
              <button
                onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  settings.soundEffects ? 'bg-sky-500 text-white' : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                {settings.soundEffects ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* DISPLAYS & MULTI-MONITOR SECTION */}
        {activeSection === 'displays' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Multi-Monitor Displays</h3>
              <p className="opacity-60 text-xs">Seamless hardware compatibility with dual high-resolution studio monitors.</p>
            </div>

            {/* Displays Arrangement Simulation */}
            <div className="p-6 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 flex items-center justify-center space-x-6">
              {displays.map(d => (
                <div
                  key={d.id}
                  onClick={() => setActiveDisplayId(d.id)}
                  className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    activeDisplayId === d.id
                      ? 'border-sky-500 bg-sky-500/10 shadow-lg scale-105'
                      : 'border-white/10 bg-neutral-800/40 opacity-60 hover:opacity-100'
                  }`}
                  style={{ width: d.id === 'display-1' ? '180px' : '160px', height: '120px' }}
                >
                  <Monitor className="w-8 h-8 mb-2 text-sky-400" />
                  <span className="font-bold text-xs text-center">{d.id === 'display-1' ? 'Display 1' : 'Display 2'}</span>
                  <span className="text-[10px] opacity-60">{d.id === 'display-1' ? '5K Studio' : '4K Reference'}</span>
                </div>
              ))}
            </div>

            {/* Selected Display Details */}
            <div className="p-4 rounded-xl border border-white/10 space-y-3">
              <h4 className="font-semibold text-xs">Active Monitor Configuration</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="opacity-50 block">Hardware Display:</span>
                  <span className="font-medium">{displays.find(d => d.id === activeDisplayId)?.name}</span>
                </div>
                <div>
                  <span className="opacity-50 block">Resolution &amp; Refresh:</span>
                  <span className="font-medium font-mono">{displays.find(d => d.id === activeDisplayId)?.resolution}</span>
                </div>
                <div>
                  <span className="opacity-50 block">Color Profile:</span>
                  <span className="font-medium text-emerald-400">{displays.find(d => d.id === activeDisplayId)?.colorProfile}</span>
                </div>
                <div>
                  <span className="opacity-50 block">ProMotion Variable Refresh:</span>
                  <span className="font-medium text-sky-400">120Hz Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WALLPAPER SECTION */}
        {activeSection === 'wallpaper' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Desktop Wallpaper</h3>
              <p className="opacity-60 text-xs">Dynamic and studio creative wallpapers optimized for Retina displays.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {WALLPAPERS.map(w => (
                <div
                  key={w.id}
                  onClick={() => updateSettings({ wallpaper: w.url })}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-video ${
                    settings.wallpaper === w.url ? 'border-sky-500 ring-2 ring-sky-500/40 shadow-lg' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={w.url} alt={w.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[11px] font-medium text-white">
                    {w.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THERMALS & COOLING SECTION */}
        {activeSection === 'thermal' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Thermal &amp; Hardware Management</h3>
              <p className="opacity-60 text-xs">Configure silicon fan curves, heavy rendering boost, and throttling prevention.</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-xs">Thermal Profiles</h4>
                  <p className="opacity-60 text-[11px]">Adjust cooling intensity based on your current studio workflow.</p>
                </div>
                <span className="font-mono text-xs text-amber-400 font-semibold">{hardware.cpuTemp}°C</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['silent', 'auto', 'turbo'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setThermalMode(mode)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium capitalize text-xs transition-all ${
                      hardware.thermalMode === mode
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border-transparent opacity-70'
                    }`}
                  >
                    {mode} ({mode === 'turbo' ? '5800 RPM' : mode === 'silent' ? '1800 RPM' : 'Auto'})
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <div>
                  <span className="font-semibold block">Proactive Throttling Prevention</span>
                  <span className="opacity-60 text-[11px]">Engage cooling headroom before silicon limits are hit</span>
                </div>
                <button
                  onClick={toggleThrottlingPrevention}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    hardware.throttlingPrevention ? 'bg-emerald-500 text-white' : 'bg-neutral-700 text-neutral-400'
                  }`}
                >
                  {hardware.throttlingPrevention ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CLOUD & FIREBASE BACKUP */}
        {activeSection === 'cloud' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Cloud Synchronization &amp; Storage</h3>
              <p className="opacity-60 text-xs">Real-time database updates and automatic cloud backups whenever changes occur.</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="font-semibold text-xs">Firebase Realtime &amp; Firestore</h4>
                    <span className="text-[10px] opacity-60 font-mono">Project ID: cloud-os-6a14c</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-mono border border-emerald-500/30">
                  {syncStatus === 'synced' ? 'Online & Synced' : 'Syncing...'}
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="opacity-60">Connected Google Account:</span>
                  <span className="font-semibold">{user?.email || 'guest@studio.local'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Last Automatic Cloud Backup:</span>
                  <span className="font-mono text-sky-400">{lastBackupTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Offline Storage Cache:</span>
                  <span className="text-emerald-400">IndexedDB &amp; LocalStorage Active</span>
                </div>
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  onClick={triggerManualBackup}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Backup to Cloud Now</span>
                </button>

                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-rose-400 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
