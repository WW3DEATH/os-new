import React, { useState, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { WALLPAPERS } from '../../services/initialData';
import { sounds } from '../../utils/sound';
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
  VolumeX,
  Palette, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Upload,
  Link,
  Compass,
  Check
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
    lastBackupTime,
    notify
  } = useOS();

  const [activeSection, setActiveSection] = useState<'appearance' | 'displays' | 'wallpaper' | 'thermal' | 'cloud'>('appearance');
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        notify('Invalid File', 'Please select an image file (PNG, JPG, WEBP).', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          updateSettings({ wallpaper: dataUrl });
          notify('Wallpaper Uploaded', `Custom wallpaper "${file.name}" applied successfully!`, 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customWallpaperUrl.trim()) return;
    updateSettings({ wallpaper: customWallpaperUrl.trim() });
    notify('Wallpaper Updated', 'Custom web wallpaper applied successfully.', 'info');
    setCustomWallpaperUrl('');
  };

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
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.displayName?.[0] || user?.email?.[0] || 'U'}</span>
            )}
          </div>
          <div className="truncate flex-1">
            <div className="font-semibold text-xs truncate">{user?.displayName || user?.email?.split('@')[0] || 'Google User'}</div>
            <div className="text-[10px] opacity-60 truncate">{user?.email || 'Logged in via Google'}</div>
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

            <div className="pt-4 border-t border-white/10 space-y-4 max-w-md">
              <div className="flex items-center justify-between">
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

              {/* Master Volume Slider */}
              <div className="p-3 rounded-xl bg-black/10 dark:bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    {(settings.volume ?? 85) === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
                    <span>Master Audio Output Volume</span>
                  </span>
                  <span className="font-mono font-bold text-sky-400">{settings.volume ?? 85}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume ?? 85}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateSettings({ volume: val });
                      sounds.setVolume(val);
                      sounds.playPop();
                    }}
                    className="flex-1 accent-sky-500 h-2 rounded-full cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      sounds.playChime();
                    }}
                    className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-medium transition-colors"
                    title="Play Test Chime"
                  >
                    Test Chime
                  </button>
                </div>
              </div>
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
            <div className="p-4 rounded-xl border border-white/10 space-y-4">
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

              {/* Display Brightness Slider */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Display Hardware Brightness</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400">{settings.brightness ?? 100}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={settings.brightness ?? 100}
                    onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                    className="flex-1 accent-amber-500 h-2 rounded-full cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    {[50, 75, 100].map(pct => (
                      <button
                        key={pct}
                        onClick={() => updateSettings({ brightness: pct })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          (settings.brightness ?? 100) === pct ? 'bg-amber-500 text-white font-bold' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WALLPAPER SECTION */}
        {activeSection === 'wallpaper' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold mb-1">Desktop Wallpaper</h3>
                <p className="opacity-60 text-xs">Choose curated studio wallpapers, upload your own images, or search DuckDuckGo in Safari.</p>
              </div>
              <button
                onClick={() => openApp('safari')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors border border-sky-500/30 font-medium text-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Search DuckDuckGo Wallpapers in Safari</span>
              </button>
            </div>

            {/* Custom Wallpaper Upload & URL Card */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/10 dark:bg-white/5 space-y-3">
              <h4 className="font-semibold text-xs flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload Custom Wallpaper</span>
              </h4>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                {/* File Upload Trigger */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleWallpaperUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-lg border border-dashed border-white/30 hover:border-sky-400 hover:bg-sky-500/10 transition-all flex items-center justify-center space-x-2 text-xs font-medium cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Choose Image File from Computer</span>
                </button>

                {/* Direct Image URL Input */}
                <div className="flex-1 flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <Link className="w-3.5 h-3.5 absolute left-2.5 opacity-40" />
                    <input
                      type="text"
                      placeholder="Paste image URL (e.g. from DuckDuckGo)..."
                      value={customWallpaperUrl}
                      onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                      className="w-full py-1.5 pl-8 pr-2 rounded-lg border border-white/15 bg-black/20 text-xs outline-none focus:border-sky-400"
                    />
                  </div>
                  <button
                    onClick={handleApplyCustomUrl}
                    disabled={!customWallpaperUrl.trim()}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-medium text-xs disabled:opacity-30 hover:bg-sky-400 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Curated Presets Grid */}
            <div>
              <h4 className="font-semibold text-xs mb-2 opacity-75">Curated High-Resolution Presets</h4>
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
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[11px] font-medium text-white flex justify-between items-center">
                      <span>{w.name}</span>
                      {settings.wallpaper === w.url && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                  </div>
                ))}
              </div>
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
                  <span className="font-semibold">{user?.email || 'Authenticated Google Account'}</span>
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
