import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { ShortcutKeyBinding } from '../../types/os';
import { 
  Command, 
  RotateCcw, 
  Search, 
  Plus, 
  Check, 
  Edit2, 
  Sparkles, 
  Sliders, 
  Layers, 
  Flame, 
  Folder 
} from 'lucide-react';

export const ShortcutsApp: React.FC = () => {
  const { shortcuts, updateShortcutKeys, resetShortcuts, settings } = useOS();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [testLog, setTestLog] = useState<string>('Press any shortcut to test it live here...');

  const categories = ['All', 'System', 'Window Management', 'Creative Workflow', 'Finder & Navigation', 'Hardware & Render'];

  const filteredShortcuts = shortcuts.filter(sc => {
    const matchesCat = selectedCategory === 'All' || sc.category === selectedCategory;
    const matchesQuery = sc.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         sc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const startRecording = (id: string, current: string[]) => {
    setEditingId(id);
    setRecordedKeys(current);
    setIsRecording(true);
  };

  const handleKeyRecordKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    e.stopPropagation();

    const keys: string[] = [];
    if (e.metaKey || e.ctrlKey) keys.push('Meta');
    if (e.altKey) keys.push('Option');
    if (e.shiftKey) keys.push('Shift');
    if (e.key && !['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
      keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    }

    if (keys.length > 0) {
      setRecordedKeys(keys);
    }
  };

  const saveRecording = (id: string) => {
    if (recordedKeys.length > 0) {
      updateShortcutKeys(id, recordedKeys);
    }
    setEditingId(null);
    setIsRecording(false);
  };

  // Live test listener
  const handleTestKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const pressed: string[] = [];
    if (e.metaKey || e.ctrlKey) pressed.push('Meta');
    if (e.altKey) pressed.push('Option');
    if (e.shiftKey) pressed.push('Shift');
    if (e.key && !['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
      pressed.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    }
    const pressedStr = pressed.join(' + ');

    // Check if matched
    const matched = shortcuts.find(sc => {
      const targetStr = sc.currentKeys.map(k => k === 'Control' ? 'Meta' : k).join(' + ');
      return targetStr.toLowerCase() === pressedStr.toLowerCase();
    });

    if (matched) {
      setTestLog(`⚡ Triggered: "${matched.label}" (${matched.category}) via [${pressedStr}]`);
    } else {
      setTestLog(`Pressed: [${pressedStr}] (No shortcut registered)`);
    }
  };

  const formatKeyDisplay = (key: string) => {
    switch (key.toLowerCase()) {
      case 'meta':
      case 'cmd':
      case 'command':
        return '⌘';
      case 'option':
      case 'alt':
        return '⌥';
      case 'shift':
        return '⇧';
      case 'control':
      case 'ctrl':
        return '⌃';
      case 'space':
        return 'Space';
      case 'arrowup':
        return '↑';
      case 'arrowdown':
        return '↓';
      case 'arrowleft':
        return '←';
      case 'arrowright':
        return '→';
      case 'escape':
        return 'Esc';
      default:
        return key.toUpperCase();
    }
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Top Header */}
      <div className={`h-11 border-b flex items-center justify-between px-4 ${
        settings.theme === 'dark' ? 'bg-neutral-800/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        <div className="flex items-center space-x-2">
          <Command className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs">Custom Keyboard Shortcuts Manager</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Reset button */}
          <button
            onClick={resetShortcuts}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors opacity-80 hover:opacity-100 text-[11px]"
            title="Restore default macOS keybindings"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* Categories Bar & Search */}
      <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-900/30 border-white/5' : 'bg-neutral-50/50 border-black/5'
      }`}>
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedCategory === cat 
                  ? 'bg-sky-500 text-white shadow-sm' 
                  : 'hover:bg-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 opacity-50" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-7 pr-2 py-1 rounded-md text-xs outline-none border transition-colors ${
              settings.theme === 'dark' ? 'bg-neutral-900/80 border-white/10' : 'bg-white border-black/15'
            }`}
          />
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {filteredShortcuts.map((sc) => {
          const isEditing = editingId === sc.id;
          return (
            <div
              key={sc.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                isEditing
                  ? 'bg-sky-500/15 border-sky-500 shadow-md ring-1 ring-sky-500/40'
                  : settings.theme === 'dark'
                  ? 'bg-neutral-800/40 border-white/5 hover:border-white/15'
                  : 'bg-white/60 border-black/10 hover:border-black/20'
              }`}
            >
              <div className="flex-1 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs">{sc.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 opacity-70 font-mono">
                    {sc.category}
                  </span>
                </div>
                <p className="text-[11px] opacity-60 mt-0.5">{sc.description}</p>
              </div>

              {/* Shortcut Keys or Recorder */}
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <div
                      tabIndex={0}
                      onKeyDown={handleKeyRecordKeyDown}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500 text-sky-300 font-mono text-xs flex items-center space-x-1 outline-none animate-pulse cursor-pointer"
                    >
                      <span>Press new hotkeys:</span>
                      <div className="flex space-x-1">
                        {recordedKeys.map((k, i) => (
                          <kbd key={i} className="px-1.5 py-0.5 rounded bg-sky-500 text-white text-[11px] font-bold">
                            {formatKeyDisplay(k)}
                          </kbd>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => saveRecording(sc.id)}
                      className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm transition-colors"
                      title="Save Shortcut"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {sc.currentKeys.map((k, i) => (
                        <kbd
                          key={i}
                          className={`px-2 py-1 rounded shadow-sm text-xs font-mono font-semibold border ${
                            settings.theme === 'dark'
                              ? 'bg-neutral-900 border-white/20 text-neutral-200'
                              : 'bg-neutral-200 border-black/20 text-neutral-800'
                          }`}
                        >
                          {formatKeyDisplay(k)}
                        </kbd>
                      ))}
                    </div>

                    <button
                      onClick={() => startRecording(sc.id, sc.currentKeys)}
                      className="p-1.5 rounded hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
                      title="Customize this shortcut"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Shortcut Testing Box */}
      <div className={`p-3 border-t flex items-center justify-between gap-3 ${
        settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        <div className="flex-1">
          <div className="text-[10px] font-semibold opacity-60 uppercase mb-0.5">Interactive Keybinding Sandbox</div>
          <div className="text-xs font-mono text-sky-400">{testLog}</div>
        </div>
        <input
          type="text"
          readOnly
          placeholder="Click here &amp; press shortcut..."
          onKeyDown={handleTestKeyDown}
          className={`w-56 px-3 py-1.5 rounded-lg border text-center font-mono text-xs cursor-pointer outline-none focus:border-sky-500 ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/20'
          }`}
        />
      </div>
    </div>
  );
};
