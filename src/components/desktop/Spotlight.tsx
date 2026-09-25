import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { AppId } from '../../types/os';
import { 
  Search, 
  Folder, 
  Compass, 
  Cpu, 
  Command, 
  Settings, 
  HardDrive, 
  FileText, 
  Table, 
  Palette, 
  Terminal, 
  Calculator, 
  StickyNote, 
  CheckSquare,
  Presentation,
  Mail,
  Play
} from 'lucide-react';

export const Spotlight: React.FC = () => {
  const { spotlightOpen, setSpotlightOpen, openApp, files, settings } = useOS();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (spotlightOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [spotlightOpen]);

  if (!spotlightOpen) return null;

  // Search Results
  interface SearchResultItem {
    id: string;
    title: string;
    subtitle: string;
    category: 'Application' | 'Document' | 'Calculation' | 'Shortcut';
    action: () => void;
    icon: React.ReactNode;
  }

  const results: SearchResultItem[] = [];

  // Math calculation evaluate
  if (query.match(/^[0-9+\-*/().^ ]+$/) && query.length > 1) {
    try {
      // safe eval for math
      const sanitized = query.replace(/[^-()\d/*+.]/g, '');
      const calcResult = Function(`'use strict'; return (${sanitized})`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult)) {
        results.push({
          id: 'calc-res',
          title: `= ${calcResult}`,
          subtitle: `Calculation: ${query}`,
          category: 'Calculation',
          action: () => setSpotlightOpen(false),
          icon: <Calculator className="w-5 h-5 text-emerald-400" />
        });
      }
    } catch {}
  }

  // App entries
  const APPS: Array<{ id: AppId; name: string; subtitle: string; icon: React.ReactNode }> = [
    { id: 'finder', name: 'Finder', subtitle: 'Project asset file explorer', icon: <Folder className="w-5 h-5 text-sky-400" /> },
    { id: 'safari', name: 'Safari Pro', subtitle: 'High-performance web browser', icon: <Compass className="w-5 h-5 text-sky-500" /> },
    { id: 'youtube', name: 'YouTube Pro', subtitle: 'Hardware-accelerated video & audio streaming', icon: <Play className="w-5 h-5 text-red-500 fill-current" /> },
    { id: 'gmail', name: 'Gmail & Mail', subtitle: 'Google Workspace message center & composer', icon: <Mail className="w-5 h-5 text-red-500" /> },
    { id: 'gdrive', name: 'Google Drive Explorer', subtitle: 'Direct cloud file storage', icon: <HardDrive className="w-5 h-5 text-emerald-400" /> },
    { id: 'gdocs', name: 'Word (Google Docs)', subtitle: 'Real-time document editor & formatting', icon: <FileText className="w-5 h-5 text-blue-500" /> },
    { id: 'gsheets', name: 'Excel (Google Sheets)', subtitle: 'Financials, formulas & spreadsheets', icon: <Table className="w-5 h-5 text-emerald-500" /> },
    { id: 'keynote', name: 'PowerPoint (Keynote)', subtitle: 'Interactive presentation pitch decks & slides', icon: <Presentation className="w-5 h-5 text-amber-500" /> },
    { id: 'activity_monitor', name: 'Activity & Thermals', subtitle: 'CPU/GPU hardware & fan curves', icon: <Cpu className="w-5 h-5 text-amber-400" /> },
    { id: 'shortcuts', name: 'Custom Shortcuts', subtitle: 'Keyboard hotkey configurator', icon: <Command className="w-5 h-5 text-violet-400" /> },
    { id: 'safari', name: 'Safari Pro', subtitle: 'High-performance web browser', icon: <Compass className="w-5 h-5 text-sky-500" /> },
    { id: 'terminal', name: 'Terminal (Zsh)', subtitle: 'Darwin UNIX command line', icon: <Terminal className="w-5 h-5 text-neutral-300" /> },
    { id: 'notes', name: 'Keep Notes', subtitle: 'Fast creative notes', icon: <StickyNote className="w-5 h-5 text-amber-400" /> },
    { id: 'tasks', name: 'Google Tasks', subtitle: 'Production task sprints', icon: <CheckSquare className="w-5 h-5 text-cyan-400" /> },
    { id: 'settings', name: 'System Settings', subtitle: 'Wallpaper, displays, and theme', icon: <Settings className="w-5 h-5 text-neutral-400" /> },
  ];

  APPS.forEach(app => {
    if (!query || app.name.toLowerCase().includes(query.toLowerCase()) || app.subtitle.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        id: `app-${app.id}`,
        title: app.name,
        subtitle: app.subtitle,
        category: 'Application',
        action: () => {
          openApp(app.id);
          setSpotlightOpen(false);
        },
        icon: app.icon
      });
    }
  });

  // File entries
  files.forEach(file => {
    if (query && (file.name.toLowerCase().includes(query.toLowerCase()) || file.tags?.some(t => t.toLowerCase().includes(query.toLowerCase())))) {
      results.push({
        id: `file-${file.id}`,
        title: file.name,
        subtitle: `${file.path} • ${file.size}`,
        category: 'Document',
        action: () => {
          if (file.type === 'document') openApp('gdocs', { fileId: file.id, fileName: file.name, content: file.content });
          else if (file.type === 'spreadsheet') openApp('gsheets', { fileId: file.id, fileName: file.name, content: file.content });
          else if (file.type === '3d_model' || file.type === 'image') openApp('creative_studio', { assetName: file.name });
          else openApp('finder');
          setSpotlightOpen(false);
        },
        icon: <FileText className="w-5 h-5 text-blue-400" />
      });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSpotlightOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24"
      onClick={() => setSpotlightOpen(false)}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-3xl select-none ${
          settings.theme === 'dark' 
            ? 'bg-neutral-800/90 text-neutral-200 border-white/20' 
            : 'bg-white/90 text-neutral-800 border-black/15'
        }`}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 opacity-60 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Spotlight Search (Apps, Files, Calculations, Shortcuts)..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 opacity-60 font-mono">
            esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="p-6 text-center opacity-50 text-xs">
              No results found for "{query}"
            </div>
          ) : (
            results.slice(0, 8).map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-1 rounded-lg bg-black/10 dark:bg-white/10">
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate">{item.title}</div>
                      <div className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'opacity-60'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-white/20' : 'bg-white/10 opacity-60'
                  }`}>
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
