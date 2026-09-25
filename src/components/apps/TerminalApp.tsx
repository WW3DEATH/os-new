import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';

interface TerminalAppProps {
  initialCommand?: string;
}

export const TerminalApp: React.FC<TerminalAppProps> = ({ initialCommand }) => {
  const { files, hardware, setThermalMode, triggerManualBackup, toggleTheme, user } = useOS();
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([
    {
      command: 'neofetch',
      output: `
   /\\_/\\     OS: NebulaOS Pro Sequoia 15.4 (ARM64)
  ( o.o )    Kernel: Darwin 24.3.0 Release-Creative
   > ^ <     Uptime: 4 days, 12 hours
             Host: Apple Studio Display (5K Retina) + Pro Display XDR
             CPU: Apple M3 Ultra (24 Cores - 16P + 8E)
             GPU: Metal 3 Raytracing (40 Cores)
             Memory: 22.4 GB / 64.0 GB Unified
             Thermals: ${hardware.cpuTemp}°C (Fans: ${hardware.fanRPM} RPM)
             Cloud: Firebase RTDB & Google Drive Connected
`
    }
  ]);
  const [inputVal, setInputVal] = useState(initialCommand || '');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    let output = '';
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        output = `Available NebulaOS commands:
  neofetch       Display system specs & silicon metrics
  ls             List project assets & documents
  cat <file>     Display contents of a file
  top            Show CPU, GPU, and RAM loads
  render --turbo Engage 5800 RPM fan speed for raytracing
  cloud-sync     Force sync snapshot to Firebase & Google Drive
  theme          Toggle between Dark and Light mode
  clear          Clear the terminal window
  whoami         Display current user credentials`;
        break;

      case 'neofetch':
        output = `
   /\\_/\\     OS: NebulaOS Pro Sequoia 15.4 (ARM64)
  ( o.o )    Kernel: Darwin 24.3.0 Release-Creative
   > ^ <     Host: Apple Studio Display + Pro Display XDR
             CPU: Apple M3 Ultra (24 Cores)
             Thermals: ${hardware.cpuTemp}°C | Fan: ${hardware.fanRPM} RPM
             User: ${user?.displayName || 'Creative Producer'}`;
        break;

      case 'ls':
        output = files.map(f => `${f.type.padEnd(12)} ${f.size.padEnd(10)} ${f.name}`).join('\n');
        break;

      case 'cat':
        const found = files.find(f => f.name.toLowerCase() === arg.toLowerCase() || f.path.toLowerCase().endsWith(arg.toLowerCase()));
        output = found ? (found.content || '[Binary file asset preview unavailable]') : `cat: ${arg}: No such file or directory`;
        break;

      case 'top':
        output = `Silicon CPU Load: ${hardware.cpuLoad}%\nGPU Load: ${hardware.gpuLoad}%\nUnified RAM: ${hardware.ramUsageGB} GB / ${hardware.ramTotalGB} GB\nThermals: ${hardware.cpuTemp}°C (Cooling Profile: ${hardware.thermalMode.toUpperCase()})`;
        break;

      case 'render':
        if (arg === '--turbo') {
          setThermalMode('turbo');
          output = `[TURBO ENGAGED] Fan speed ramped to 5800 RPM. Maximum thermal headroom unlocked for rendering.`;
        } else {
          output = `Usage: render --turbo`;
        }
        break;

      case 'cloud-sync':
        triggerManualBackup();
        output = `[SYNC] Pushed snapshot to Firebase Realtime Database and Google Drive.`;
        break;

      case 'theme':
        toggleTheme();
        output = `Workspace theme toggled.`;
        break;

      case 'clear':
        setHistory([]);
        return;

      case 'whoami':
        output = `${user?.displayName || 'Creative Producer'} <${user?.email || 'guest@studio.local'}> (ID: ${user?.uid || 'offline'})`;
        break;

      default:
        output = `zsh: command not found: ${cmd}. Type 'help' for available commands.`;
    }

    setHistory(prev => [...prev, { command: cmdStr, output }]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    }
  };

  return (
    <div className="h-full bg-neutral-950 text-emerald-400 font-mono text-xs p-4 flex flex-col overflow-y-auto select-text">
      <div className="space-y-3">
        {history.map((item, idx) => (
          <div key={idx}>
            <div className="flex items-center space-x-2 text-neutral-300">
              <span className="text-sky-400">nebula@studio-m3-pro</span>
              <span className="text-pink-400">~ %</span>
              <span>{item.command}</span>
            </div>
            {item.output && (
              <pre className="whitespace-pre-wrap text-neutral-200 mt-1 font-mono text-[11px] leading-relaxed">
                {item.output}
              </pre>
            )}
          </div>
        ))}

        <div className="flex items-center space-x-2 text-neutral-300">
          <span className="text-sky-400">nebula@studio-m3-pro</span>
          <span className="text-pink-400">~ %</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent text-emerald-400 outline-none font-mono text-xs caret-emerald-400"
          />
        </div>
        <div ref={bottomRef}></div>
      </div>
    </div>
  );
};
