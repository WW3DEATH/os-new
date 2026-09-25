import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { ThermalMode } from '../../types/os';
import { 
  Flame, 
  Wind, 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  ShieldAlert, 
  Play, 
  Square, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Server
} from 'lucide-react';

export const ActivityMonitorApp: React.FC = () => {
  const { 
    hardware, 
    setThermalMode, 
    toggleThrottlingPrevention, 
    addRenderTask, 
    cancelRenderTask, 
    settings 
  } = useOS();

  const [activeTab, setActiveTab] = useState<'cpu' | 'thermal' | 'render' | 'memory'>('thermal');

  // Test render trigger
  const handleDispatchHeavyRender = () => {
    addRenderTask({
      name: 'OmniVFX 4K Raytraced Volumetric Render',
      app: 'Creative Studio Engine',
      cpuLoad: 96,
      gpuLoad: 99,
      estimatedSecs: 60,
    });
  };

  const getTempColor = (temp: number) => {
    if (temp >= 85) return 'text-rose-500 bg-rose-500/20 border-rose-500/40';
    if (temp >= 70) return 'text-amber-400 bg-amber-400/20 border-amber-400/40';
    return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/40';
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Activity Monitor Header Toolbar */}
      <div className={`h-11 border-b flex items-center justify-between px-4 ${
        settings.theme === 'dark' ? 'bg-neutral-800/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('thermal')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'thermal' ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-white/10 opacity-70'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Thermals &amp; Cooling</span>
          </button>
          <button
            onClick={() => setActiveTab('cpu')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'cpu' ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-white/10 opacity-70'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>CPU &amp; GPU Cores</span>
          </button>
          <button
            onClick={() => setActiveTab('render')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'render' ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-white/10 opacity-70'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Render Queue ({hardware.activeTasks.filter(t => t.status === 'rendering').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'memory' ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-white/10 opacity-70'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Unified Memory</span>
          </button>
        </div>

        {/* Dispatch Test Render Button */}
        <button
          onClick={handleDispatchHeavyRender}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow hover:brightness-110 active:scale-95 transition-all text-xs"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Simulate Heavy 4K Render</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* THERMALS TAB */}
        {activeTab === 'thermal' && (
          <div className="space-y-4">
            {/* Top Thermal Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* CPU Thermal */}
              <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between ${
                settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
              }`}>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">CPU Package</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="my-2">
                  <div className="text-3xl font-bold font-mono">{hardware.cpuTemp}°C</div>
                  <div className="text-[11px] opacity-60">Die Peak: {hardware.cpuTemp + 3}°C</div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono border text-center ${getTempColor(hardware.cpuTemp)}`}>
                  {hardware.cpuTemp >= 85 ? 'HIGH THERMAL LOAD' : hardware.cpuTemp >= 70 ? 'WARM / ACTIVE' : 'NOMINAL / COOL'}
                </div>
              </div>

              {/* GPU Thermal */}
              <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between ${
                settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
              }`}>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">GPU Raytracing VRAM</span>
                  <Activity className="w-4 h-4 text-sky-400" />
                </div>
                <div className="my-2">
                  <div className="text-3xl font-bold font-mono">{hardware.gpuTemp}°C</div>
                  <div className="text-[11px] opacity-60">Hotspot: {hardware.gpuTemp + 4}°C</div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono border text-center ${getTempColor(hardware.gpuTemp)}`}>
                  OPTIMAL EFFICIENCY
                </div>
              </div>

              {/* Fan Speed */}
              <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between ${
                settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
              }`}>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Dual Turbofans</span>
                  <Wind className={`w-4 h-4 text-cyan-400 ${hardware.fanRPM > 3000 ? 'animate-spin' : ''}`} />
                </div>
                <div className="my-2">
                  <div className="text-3xl font-bold font-mono">{hardware.fanRPM} <span className="text-sm font-normal opacity-60">RPM</span></div>
                  <div className="text-[11px] opacity-60">Target: {hardware.fanTargetRPM} RPM</div>
                </div>
                <div className="w-full bg-black/20 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (hardware.fanRPM / 6000) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Thermal Mode Selector */}
              <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col justify-between ${
                settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
              }`}>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Thermal Profile</span>
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </div>
                <div className="grid grid-cols-3 gap-1 my-2">
                  {(['silent', 'auto', 'turbo'] as ThermalMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setThermalMode(mode)}
                      className={`py-1.5 rounded-lg text-center font-medium capitalize text-[11px] transition-all border ${
                        hardware.thermalMode === mode
                          ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 border-transparent opacity-70'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] opacity-60 truncate">
                  {hardware.thermalMode === 'turbo' ? 'Max 5800 RPM (No Throttling)' : hardware.thermalMode === 'silent' ? 'Acoustic Silent 1800 RPM' : 'Intelligent Dynamic Curve'}
                </div>
              </div>
            </div>

            {/* Proactive Throttling Prevention Settings */}
            <div className={`p-4 rounded-xl border backdrop-blur-md flex items-center justify-between ${
              settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Hardware Thermal Throttling Prevention</h4>
                  <p className="opacity-60 text-[11px] mt-0.5">
                    Automatically engages maximum cooling fans before silicon junction reaches 85°C to avoid drop in render frame rates.
                  </p>
                </div>
              </div>
              <button
                onClick={toggleThrottlingPrevention}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  hardware.throttlingPrevention ? 'bg-emerald-500 text-white' : 'bg-neutral-700 text-neutral-300'
                }`}
              >
                {hardware.throttlingPrevention ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Live Waveform Load Graph */}
            <div className={`p-4 rounded-xl border backdrop-blur-md ${
              settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-xs flex items-center space-x-1.5">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>Real-Time Silicon Compute Load</span>
                </h4>
                <div className="flex items-center space-x-4 text-[11px] font-mono">
                  <span className="flex items-center space-x-1 text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                    <span>CPU: {hardware.cpuLoad}%</span>
                  </span>
                  <span className="flex items-center space-x-1 text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
                    <span>GPU: {hardware.gpuLoad}%</span>
                  </span>
                </div>
              </div>

              {/* Progress bars visualizer */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="opacity-70">CPU Compute Load (16 Performance Cores + 8 Efficiency Cores)</span>
                    <span className="font-mono">{hardware.cpuLoad}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${hardware.cpuLoad > 80 ? 'bg-rose-500' : 'bg-sky-500'}`}
                      style={{ width: `${hardware.cpuLoad}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="opacity-70">GPU Metal 3 Raytracing Pipeline (40 Graphics Cores)</span>
                    <span className="font-mono">{hardware.gpuLoad}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${hardware.gpuLoad > 80 ? 'bg-amber-500' : 'bg-purple-500'}`}
                      style={{ width: `${hardware.gpuLoad}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CPU & GPU CORES TAB */}
        {activeTab === 'cpu' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => {
                const coreLoad = Math.min(100, Math.max(5, hardware.cpuLoad + Math.floor(Math.sin(i * 1.5) * 20)));
                return (
                  <div key={i} className={`p-2.5 rounded-lg border ${
                    settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
                  }`}>
                    <div className="flex justify-between text-[10px] opacity-70 mb-1">
                      <span>Core #{i + 1} {i < 12 ? '(P)' : '(E)'}</span>
                      <span className="font-mono">{coreLoad}%</span>
                    </div>
                    <div className="h-2 rounded bg-black/20 dark:bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${coreLoad > 85 ? 'bg-rose-500' : 'bg-sky-400'}`}
                        style={{ width: `${coreLoad}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RENDER QUEUE TAB */}
        {activeTab === 'render' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-xs">Active High-Performance Render Tasks</h4>
              <span className="opacity-60 text-[11px]">{hardware.activeTasks.length} Pipeline Jobs</span>
            </div>

            {hardware.activeTasks.map((task) => (
              <div 
                key={task.id} 
                className={`p-3.5 rounded-xl border flex flex-col space-y-2 ${
                  settings.theme === 'dark' ? 'bg-neutral-800/50 border-white/10' : 'bg-white/70 border-black/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {task.status === 'rendering' ? (
                      <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <div>
                      <div className="font-semibold text-xs">{task.name}</div>
                      <div className="text-[10px] opacity-60">{task.app} • CPU {task.cpuLoad}% • GPU {task.gpuLoad}%</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold">{task.progress}%</span>
                    {task.status === 'rendering' && (
                      <button
                        onClick={() => cancelRenderTask(task.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Cancel Task"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-2 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'}`}
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MEMORY TAB */}
        {activeTab === 'memory' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-white/60 border-black/10'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Unified Memory Architecture</span>
                <span className="font-mono text-sm font-bold text-sky-400">{hardware.ramUsageGB} GB / {hardware.ramTotalGB} GB</span>
              </div>
              <div className="h-4 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden mb-3">
                <div 
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${(hardware.ramUsageGB / hardware.ramTotalGB) * 100}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 text-center text-[11px] gap-2">
                <div className="p-2 rounded bg-black/10 dark:bg-white/5">
                  <span className="opacity-50 block">App Memory</span>
                  <span className="font-semibold">14.2 GB</span>
                </div>
                <div className="p-2 rounded bg-black/10 dark:bg-white/5">
                  <span className="opacity-50 block">Wired Memory</span>
                  <span className="font-semibold">5.8 GB</span>
                </div>
                <div className="p-2 rounded bg-black/10 dark:bg-white/5">
                  <span className="opacity-50 block">Compressed</span>
                  <span className="font-semibold">2.4 GB</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
