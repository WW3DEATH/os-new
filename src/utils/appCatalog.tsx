import React from 'react';
import { AppId } from '../types/os';
import { 
  Folder, 
  Compass, 
  Play, 
  Mail, 
  HardDrive, 
  FileText, 
  Table, 
  Presentation, 
  Palette, 
  Cpu, 
  Command, 
  Terminal, 
  StickyNote, 
  CheckSquare, 
  Settings,
  Calculator,
  Sparkles
} from 'lucide-react';

export interface AppCatalogItem {
  appId: AppId;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  category: 'Workspace' | 'Productivity' | 'System' | 'Media' | 'Utilities';
}

export const APP_CATALOG: Record<AppId, AppCatalogItem> = {
  finder: {
    appId: 'finder',
    label: 'Finder',
    subtitle: 'File system & creative asset manager',
    icon: <Folder className="w-6 h-6 text-white" />,
    gradient: 'from-blue-500 to-sky-400',
    category: 'System'
  },
  safari: {
    appId: 'safari',
    label: 'Safari Pro',
    subtitle: 'Persistent multi-tab browser with proxy bypass',
    icon: <Compass className="w-6 h-6 text-white" />,
    gradient: 'from-sky-500 to-blue-600',
    category: 'Media'
  },
  youtube: {
    appId: 'youtube',
    label: 'YouTube Pro',
    subtitle: '1080p hardware-accelerated video & audio',
    icon: <Play className="w-6 h-6 text-white fill-current" />,
    gradient: 'from-red-600 to-rose-700',
    category: 'Media'
  },
  gmail: {
    appId: 'gmail',
    label: 'Gmail',
    subtitle: 'Google Workspace mail center & composer',
    icon: <Mail className="w-6 h-6 text-white" />,
    gradient: 'from-red-500 to-red-600',
    category: 'Workspace'
  },
  gemini: {
    appId: 'gemini',
    label: 'Gemini AI',
    subtitle: 'Conversational assistant, image creator & web search',
    icon: <Sparkles className="w-6 h-6 text-white" />,
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
    category: 'Productivity'
  },
  gdrive: {
    appId: 'gdrive',
    label: 'Google Drive',
    subtitle: 'Zero overhead personal cloud storage',
    icon: <HardDrive className="w-6 h-6 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    category: 'Workspace'
  },
  gdocs: {
    appId: 'gdocs',
    label: 'Word (Docs)',
    subtitle: 'Rich text word processing & document creator',
    icon: <FileText className="w-6 h-6 text-white" />,
    gradient: 'from-blue-600 to-indigo-600',
    category: 'Workspace'
  },
  gsheets: {
    appId: 'gsheets',
    label: 'Excel (Sheets)',
    subtitle: 'Calculations, formula grids & financial charts',
    icon: <Table className="w-6 h-6 text-white" />,
    gradient: 'from-green-600 to-emerald-500',
    category: 'Workspace'
  },
  keynote: {
    appId: 'keynote',
    label: 'PowerPoint (Keynote)',
    subtitle: 'Interactive decks with 3D keyframe transitions',
    icon: <Presentation className="w-6 h-6 text-white" />,
    gradient: 'from-amber-500 to-orange-600',
    category: 'Workspace'
  },
  creative_studio: {
    appId: 'creative_studio',
    label: 'Creative Studio',
    subtitle: '3D Cycles GPU raytracing & canvas suite',
    icon: <Palette className="w-6 h-6 text-white" />,
    gradient: 'from-fuchsia-600 to-pink-500',
    category: 'Productivity'
  },
  activity_monitor: {
    appId: 'activity_monitor',
    label: 'Activity & Thermals',
    subtitle: 'Hardware curves, GPU thermals & CPU load',
    icon: <Cpu className="w-6 h-6 text-white" />,
    gradient: 'from-amber-500 to-red-500',
    category: 'System'
  },
  shortcuts: {
    appId: 'shortcuts',
    label: 'Custom Shortcuts',
    subtitle: 'Configurable global keyboard bindings',
    icon: <Command className="w-6 h-6 text-white" />,
    gradient: 'from-violet-600 to-purple-500',
    category: 'Utilities'
  },
  terminal: {
    appId: 'terminal',
    label: 'Terminal (Zsh)',
    subtitle: 'Unix environment with native shell execution',
    icon: <Terminal className="w-6 h-6 text-neutral-200" />,
    gradient: 'from-neutral-800 to-neutral-900 border border-neutral-700',
    category: 'Utilities'
  },
  notes: {
    appId: 'notes',
    label: 'Keep Notes',
    subtitle: 'Post-it notes & synchronized quick briefs',
    icon: <StickyNote className="w-6 h-6 text-white" />,
    gradient: 'from-amber-400 to-orange-500',
    category: 'Productivity'
  },
  tasks: {
    appId: 'tasks',
    label: 'Google Tasks',
    subtitle: 'Sprint checklists, milestones & deliverables',
    icon: <CheckSquare className="w-6 h-6 text-white" />,
    gradient: 'from-cyan-500 to-blue-500',
    category: 'Productivity'
  },
  settings: {
    appId: 'settings',
    label: 'System Settings',
    subtitle: 'Wallpapers, themes, displays & audio profile',
    icon: <Settings className="w-6 h-6 text-neutral-300" />,
    gradient: 'from-slate-600 to-neutral-700',
    category: 'System'
  },
  calculator: {
    appId: 'calculator',
    label: 'Calculator',
    subtitle: 'Precision scientific & arithmetic math',
    icon: <Calculator className="w-6 h-6 text-white" />,
    gradient: 'from-orange-500 to-amber-600',
    category: 'Utilities'
  },
  trash: {
    appId: 'trash',
    label: 'Trash',
    subtitle: 'Recycle bin & deleted drafts',
    icon: <Folder className="w-6 h-6 text-white" />,
    gradient: 'from-neutral-500 to-neutral-600',
    category: 'System'
  }
};
