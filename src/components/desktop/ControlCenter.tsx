import React, { useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Wifi, 
  Bluetooth, 
  Airplay, 
  Sun, 
  Moon, 
  Volume2, 
  Flame, 
  Layers, 
  Cloud, 
  Check, 
  SlidersHorizontal,
  Power
} from 'lucide-react';

export const ControlCenter: React.FC = () => {
  const { 
    controlCenterOpen, 
    setControlCenterOpen, 
    settings, 
    updateSettings, 
    toggleTheme, 
    hardware, 
    setThermalMode, 
    setMissionControlOpen, 
    setLocked, 
    syncStatus, 
    user 
  } = useOS();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Only if target is not the menubar trigger
        const target = e.target as HTMLElement;
        if (!target.closest('header')) {
          setControlCenterOpen(false);
        }
      }
    };
    if (controlCenterOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [controlCenterOpen, setControlCenterOpen]);

  if (!controlCenterOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed top-9 right-3 w-80 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl border z-50 select-none text-xs transition-all duration-200 animate-in fade-in zoom-in-95 ${
        settings.theme === 'dark' 
          ? 'bg-neutral-800/80 text-neutral-200 border-white/15' 
          : 'bg-white/80 text-neutral-800 border-black/15'
      }`}
    >
      {/* 2x2 Network & Connection Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Wi-Fi & Bluetooth Tile */}
        <div className="p-2.5 rounded-xl bg-black/10 dark:bg-white/10 flex flex-col justify-between space-y-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-full bg-blue-500 text-white shadow-sm">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[11px]">Wi-Fi 6E</div>
              <div className="text-[9px] opacity-60">Studio-5G</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-full bg-blue-500 text-white shadow-sm">
              <Bluetooth className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[11px]">Bluetooth</div>
              <div className="text-[9px] opacity-60">Connected</div>
            </div>
          </div>
        </div>

        {/* AirDrop & Theme Tile */}
        <div className="p-2.5 rounded-xl bg-black/10 dark:bg-white/10 flex flex-col justify-between space-y-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-full bg-blue-500 text-white shadow-sm">
              <Airplay className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-[11px]">AirDrop</div>
              <div className="text-[9px] opacity-60">Contacts Only</div>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-white/10 text-left transition-colors"
          >
            <div className={`p-1 rounded-full ${settings.theme === 'dark' ? 'bg-sky-500 text-white' : 'bg-amber-500 text-white'}`}>
              {settings.theme === 'dark' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            </div>
            <div>
              <div className="font-semibold text-[11px]">{settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
              <div className="text-[9px] opacity-60">Daylight Switch</div>
            </div>
          </button>
        </div>
      </div>

      {/* Thermal & Fan Speed Card */}
      <div className="p-3 rounded-xl bg-black/10 dark:bg-white/10 mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-[11px]">Hardware Thermals</span>
          </div>
          <span className="font-mono text-[11px] text-amber-400 font-semibold">{hardware.cpuTemp}°C</span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {(['silent', 'auto', 'turbo'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setThermalMode(mode)}
              className={`py-1 rounded text-center text-[10px] font-medium capitalize transition-all ${
                hardware.thermalMode === mode
                  ? 'bg-sky-500 text-white shadow'
                  : 'hover:bg-white/10 opacity-70'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Brightness Slider */}
      <div className="p-2.5 rounded-xl bg-black/10 dark:bg-white/10 mb-2">
        <div className="flex justify-between text-[11px] mb-1 opacity-70">
          <span>Display Brightness (5K Retina)</span>
          <span>100%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sun className="w-3.5 h-3.5 opacity-60" />
          <input
            type="range"
            min="20"
            max="100"
            defaultValue="100"
            className="flex-1 accent-sky-500 h-1.5 rounded-full cursor-pointer"
          />
        </div>
      </div>

      {/* Sound Volume Slider */}
      <div className="p-2.5 rounded-xl bg-black/10 dark:bg-white/10 mb-2">
        <div className="flex justify-between text-[11px] mb-1 opacity-70">
          <span>Sound Volume</span>
          <span>85%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Volume2 className="w-3.5 h-3.5 opacity-60" />
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="85"
            className="flex-1 accent-sky-500 h-1.5 rounded-full cursor-pointer"
          />
        </div>
      </div>

      {/* Lock Workstation Button */}
      <button
        onClick={() => { setControlCenterOpen(false); setLocked(true); }}
        className="w-full py-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-rose-500/20 text-rose-400 font-medium transition-colors flex items-center justify-center space-x-1.5 text-[11px]"
      >
        <Power className="w-3.5 h-3.5" />
        <span>Lock Workstation (⌥⌘L)</span>
      </button>
    </div>
  );
};
