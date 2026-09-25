import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  StickyNote, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Pin, 
  Tag, 
  CheckCircle2, 
  Circle,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const NotesApp: React.FC = () => {
  const { settings, notify } = useOS();
  const [notes, setNotes] = useState([
    { id: '1', title: 'Lighting & Shading Pipeline', content: 'Use ACEScg color space for the raytracing pass. Keep roughness maps linear.', color: 'bg-amber-500/20 border-amber-500/30', pinned: true },
    { id: '2', title: 'Studio Render Schedule', content: 'Queue 8K sequence export on Turbo profile overnight. Check CPU thermal headroom.', color: 'bg-blue-500/20 border-blue-500/30', pinned: false },
    { id: '3', title: 'Client Feedback Notes', content: 'Client approved the color grade master. Need audio stems mixed by Friday.', color: 'bg-emerald-500/20 border-emerald-500/30', pinned: false }
  ]);

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleAddNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: 'New Creative Note',
      content: 'Start typing notes...',
      color: 'bg-sky-500/20 border-sky-500/30',
      pinned: false
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateActive = (key: string, val: any) => {
    setNotes(notes.map(n => n.id === activeNoteId ? { ...n, [key]: val } : n));
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    setActiveNoteId(notes.find(n => n.id !== id)?.id || '');
    notify('Note Deleted', 'Note removed from Google Keep.', 'info');
  };

  return (
    <div className={`h-full flex select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Sidebar List */}
      <div className={`w-56 border-r p-3 flex flex-col space-y-2 ${
        settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        <div className="flex justify-between items-center mb-1">
          <div className="font-semibold text-xs flex items-center space-x-1.5">
            <StickyNote className="w-4 h-4 text-amber-400" />
            <span>Keep Notes</span>
          </div>
          <button onClick={handleAddNote} className="p-1 rounded hover:bg-white/10" title="New Note">
            <Plus className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => setActiveNoteId(n.id)}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                activeNoteId === n.id 
                  ? 'bg-sky-500 text-white font-medium border-sky-400 shadow-sm' 
                  : 'hover:bg-white/10 border-transparent opacity-80'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold truncate">{n.title}</span>
                {n.pinned && <Pin className="w-3 h-3 text-amber-300" />}
              </div>
              <p className="text-[10px] opacity-70 truncate">{n.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 p-6 flex flex-col space-y-3">
        {activeNote ? (
          <>
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleUpdateActive('title', e.target.value)}
                className="font-bold text-sm bg-transparent outline-none w-full"
                placeholder="Note title..."
              />
              <button
                onClick={() => handleDelete(activeNote.id)}
                className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={activeNote.content}
              onChange={(e) => handleUpdateActive('content', e.target.value)}
              className="flex-1 bg-transparent resize-none outline-none font-sans text-xs leading-relaxed"
              placeholder="Note contents..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-50">
            No note selected
          </div>
        )}
      </div>
    </div>
  );
};

export const TasksApp: React.FC = () => {
  const { settings, notify } = useOS();
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Calibrate P3 wide color gamut on reference monitor', completed: true, priority: 'high' },
    { id: '2', title: 'Export 4K ProRes 422 color master for screening', completed: false, priority: 'urgent' },
    { id: '3', title: 'Sync audio stems to Google Drive collaborative folder', completed: false, priority: 'medium' },
    { id: '4', title: 'Verify thermal fan curve for 8K rendering session', completed: true, priority: 'medium' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleToggle = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks([
      ...tasks,
      { id: `task-${Date.now()}`, title: newTaskTitle.trim(), completed: false, priority: 'medium' }
    ]);
    setNewTaskTitle('');
    notify('Task Added', 'New task synced to Google Tasks.', 'info');
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      <div className={`h-11 border-b flex items-center justify-between px-4 ${
        settings.theme === 'dark' ? 'bg-neutral-800/70 border-white/10' : 'bg-neutral-100/80 border-black/10'
      }`}>
        <div className="flex items-center space-x-2">
          <CheckSquare className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs">Google Tasks &amp; Milestones</span>
        </div>
        <span className="opacity-60 text-[10px]">
          {tasks.filter(t => t.completed).length}/{tasks.length} Completed
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {tasks.map(t => (
          <div
            key={t.id}
            onClick={() => handleToggle(t.id)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              t.completed 
                ? 'opacity-50 bg-black/5 dark:bg-white/5 line-through' 
                : settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10 hover:border-cyan-400/40' : 'bg-white/70 border-black/10 hover:border-cyan-500'
            }`}
          >
            <div className="flex items-center space-x-3">
              {t.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              )}
              <span className="font-medium text-xs">{t.title}</span>
            </div>

            <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
              t.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 opacity-70'
            }`}>
              {t.priority}
            </span>
          </div>
        ))}
      </div>

      {/* Add Task Input */}
      <form onSubmit={handleAddTask} className={`p-3 border-t flex gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        <input
          type="text"
          placeholder="Add a new milestone or creative task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className={`flex-1 px-3 py-1.5 rounded-lg border outline-none text-xs ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/10 focus:border-cyan-400' : 'bg-white border-black/15 focus:border-cyan-500'
          }`}
        />
        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-sm transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
};
