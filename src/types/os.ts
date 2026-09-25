export type AppId = 
  | 'finder'
  | 'safari'
  | 'youtube'
  | 'gmail'
  | 'gemini'
  | 'activity_monitor'
  | 'shortcuts'
  | 'settings'
  | 'gdrive'
  | 'gdocs'
  | 'gsheets'
  | 'keynote'
  | 'creative_studio'
  | 'terminal'
  | 'notes'
  | 'tasks'
  | 'calculator'
  | 'trash';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  displayId: string; // Multi-monitor screen target
  spaceId: number;   // Virtual desktop space (1, 2, 3...)
  data?: any;        // Passed context (e.g. file path to open in Docs)
}

export interface DisplayInfo {
  id: string;
  name: string;
  resolution: string;
  refreshRate: string;
  isPrimary: boolean;
  colorProfile: string;
}

export type ThermalMode = 'silent' | 'auto' | 'turbo';

export interface RenderTask {
  id: string;
  name: string;
  app: string;
  progress: number;
  status: 'rendering' | 'completed' | 'queued' | 'paused';
  cpuLoad: number;
  gpuLoad: number;
  estimatedSecs: number;
}

export interface HardwareThermalState {
  cpuTemp: number;         // in °C (e.g. 42 to 92)
  gpuTemp: number;         // in °C
  cpuLoad: number;         // % (0-100)
  gpuLoad: number;         // %
  ramUsageGB: number;      // e.g. 18.4
  ramTotalGB: number;      // e.g. 64.0
  fanRPM: number;          // e.g. 1800 to 5800
  fanTargetRPM: number;
  thermalMode: ThermalMode;
  throttlingPrevention: boolean;
  activeTasks: RenderTask[];
}

export interface ShortcutKeyBinding {
  id: string;
  label: string;
  category: 'System' | 'Window Management' | 'Creative Workflow' | 'Finder & Navigation' | 'Hardware & Render';
  defaultKeys: string[];
  currentKeys: string[];
  actionId: string;
  description: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'video' | '3d_model' | 'audio' | 'code';
  size: string;
  updatedAt: string;
  content?: string;
  tags?: string[];
  isCloudSynced?: boolean;
  isOfflineAvailable?: boolean;
  googleDriveId?: string;
  thumbnail?: string;
}

export interface OsSettings {
  theme: 'dark' | 'light' | 'auto';
  accentColor: string; // 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'graphite'
  wallpaper: string;
  soundEffects: boolean;
  dockSize: number;
  dockMagnification: boolean;
  activeDisplayId: string;
  autoCloudBackup: boolean;
  offlineSyncEnabled: boolean;
  dockApps?: AppId[];
  desktopApps?: AppId[];
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  activeApp: string;
  lastSeen: number;
  cursorPos?: { x: number; y: number };
}
