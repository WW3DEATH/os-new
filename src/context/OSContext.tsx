import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppId, 
  WindowState, 
  DisplayInfo, 
  HardwareThermalState, 
  ThermalMode, 
  RenderTask, 
  ShortcutKeyBinding, 
  FileItem, 
  OsSettings,
  TeamMember 
} from '../types/os';
import { 
  DEFAULT_DISPLAYS, 
  DEFAULT_SHORTCUTS, 
  DEFAULT_FILES, 
  DEFAULT_RENDER_TASKS, 
  DEFAULT_SETTINGS,
  DEFAULT_DOCK_APPS,
  DEFAULT_DESKTOP_APPS
} from '../services/initialData';
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  CloudSyncService, 
  UserProfile 
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { sounds } from '../utils/sound';

export interface OsNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'render' | 'sync' | 'thermal';
  timestamp: string;
}

interface OSContextType {
  user: UserProfile | null;
  isLocked: boolean;
  setLocked: (locked: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  
  // Windows
  windows: WindowState[];
  activeWindowId: string | null;
  openApp: (appId: AppId, data?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowBounds: (id: string, bounds: { x?: number; y?: number; width?: number; height?: number }) => void;
  
  // Displays & Virtual Spaces
  displays: DisplayInfo[];
  activeDisplayId: string;
  setActiveDisplayId: (id: string) => void;
  currentSpaceId: number;
  setCurrentSpaceId: (spaceId: number) => void;
  
  // Hardware & Thermals
  hardware: HardwareThermalState;
  setThermalMode: (mode: ThermalMode) => void;
  setFanRPMOverride: (rpm: number) => void;
  toggleThrottlingPrevention: () => void;
  addRenderTask: (task: Omit<RenderTask, 'id' | 'progress' | 'status'>) => void;
  cancelRenderTask: (id: string) => void;
  
  // Shortcuts
  shortcuts: ShortcutKeyBinding[];
  updateShortcutKeys: (id: string, keys: string[]) => void;
  resetShortcuts: () => void;
  
  // File System
  files: FileItem[];
  createFile: (file: Omit<FileItem, 'id' | 'updatedAt'>) => void;
  updateFile: (id: string, updates: Partial<FileItem>) => void;
  deleteFile: (id: string) => void;
  
  // Settings & Theme
  settings: OsSettings;
  updateSettings: (updates: Partial<OsSettings>) => void;
  toggleTheme: () => void;
  addAppToDock: (appId: AppId) => void;
  removeAppFromDock: (appId: AppId) => void;
  addAppToDesktop: (appId: AppId) => void;
  removeAppFromDesktop: (appId: AppId) => void;
  resetDockAndDesktopApps: () => void;
  
  // Cloud & Offline Sync
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastBackupTime: string;
  triggerManualBackup: () => Promise<void>;
  
  // Modals & Panels
  spotlightOpen: boolean;
  setSpotlightOpen: (open: boolean) => void;
  missionControlOpen: boolean;
  setMissionControlOpen: (open: boolean) => void;
  controlCenterOpen: boolean;
  setControlCenterOpen: (open: boolean) => void;
  
  // Notifications
  notifications: OsNotification[];
  notify: (title: string, message: string, type?: OsNotification['type']) => void;
  dismissNotification: (id: string) => void;
  
  // Team Collaboration Presence
  teamPresence: TeamMember[];
}

const OSContext = createContext<OSContextType | null>(null);

// Preset window dimensions and titles per app
const APP_METADATA: Record<AppId, { title: string; icon: string; width: number; height: number; minWidth: number; minHeight: number }> = {
  finder: { title: 'Finder', icon: 'folder', width: 920, height: 600, minWidth: 640, minHeight: 400 },
  safari: { title: 'Safari Pro', icon: 'compass', width: 1040, height: 660, minWidth: 600, minHeight: 400 },
  youtube: { title: 'YouTube Pro', icon: 'play-square', width: 1060, height: 680, minWidth: 640, minHeight: 440 },
  gmail: { title: 'Gmail & Mail', icon: 'mail', width: 1020, height: 660, minWidth: 640, minHeight: 440 },
  gemini: { title: 'Gemini AI Assistant', icon: 'sparkles', width: 980, height: 680, minWidth: 600, minHeight: 440 },
  activity_monitor: { title: 'Activity & Thermal Monitor', icon: 'cpu', width: 880, height: 560, minWidth: 640, minHeight: 420 },
  shortcuts: { title: 'Custom Shortcut Keys', icon: 'command', width: 840, height: 560, minWidth: 580, minHeight: 380 },
  settings: { title: 'System Settings', icon: 'settings', width: 860, height: 580, minWidth: 600, minHeight: 420 },
  gdrive: { title: 'Google Drive Explorer', icon: 'hard-drive', width: 960, height: 620, minWidth: 640, minHeight: 420 },
  gdocs: { title: 'Word & Google Docs', icon: 'file-text', width: 900, height: 680, minWidth: 540, minHeight: 440 },
  gsheets: { title: 'Excel & Google Sheets', icon: 'table', width: 980, height: 640, minWidth: 640, minHeight: 420 },
  keynote: { title: 'PowerPoint & Keynote', icon: 'presentation', width: 960, height: 640, minWidth: 600, minHeight: 440 },
  creative_studio: { title: 'Creative Studio (Renderer & Canvas)', icon: 'palette', width: 1080, height: 700, minWidth: 700, minHeight: 480 },
  terminal: { title: 'Terminal - zsh (Pro)', icon: 'terminal', width: 780, height: 480, minWidth: 480, minHeight: 320 },
  notes: { title: 'Google Keep Notes', icon: 'sticky-note', width: 800, height: 520, minWidth: 500, minHeight: 360 },
  tasks: { title: 'Google Tasks & Sprints', icon: 'check-square', width: 720, height: 520, minWidth: 460, minHeight: 340 },
  calculator: { title: 'Calculator', icon: 'calculator', width: 340, height: 460, minWidth: 320, minHeight: 420 },
  trash: { title: 'Trash', icon: 'trash-2', width: 680, height: 440, minWidth: 480, minHeight: 320 },
};

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Lock Screen
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nebula_os_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLocked, setLocked] = useState<boolean>(() => !user);

  // System Settings
  const [settings, setSettings] = useState<OsSettings>(() => {
    const local = CloudSyncService.loadLocal();
    return local?.settings || DEFAULT_SETTINGS;
  });

  // Sound Engine
  useEffect(() => {
    sounds.enabled = settings.soundEffects;
  }, [settings.soundEffects]);

  // Sync dark/light theme class on documentElement
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Displays & Spaces
  const [displays] = useState<DisplayInfo[]>(DEFAULT_DISPLAYS);
  const [activeDisplayId, setActiveDisplayId] = useState<string>('display-1');
  const [currentSpaceId, setCurrentSpaceId] = useState<number>(1);

  // File System
  const [files, setFiles] = useState<FileItem[]>(() => {
    const local = CloudSyncService.loadLocal();
    return local?.files || DEFAULT_FILES;
  });

  // Shortcuts
  const [shortcuts, setShortcuts] = useState<ShortcutKeyBinding[]>(() => {
    const local = CloudSyncService.loadLocal();
    return local?.shortcuts || DEFAULT_SHORTCUTS;
  });

  // Hardware & Thermals State
  const [hardware, setHardware] = useState<HardwareThermalState>({
    cpuTemp: 44,
    gpuTemp: 41,
    cpuLoad: 18,
    gpuLoad: 12,
    ramUsageGB: 22.4,
    ramTotalGB: 64.0,
    fanRPM: 2100,
    fanTargetRPM: 2200,
    thermalMode: 'auto',
    throttlingPrevention: true,
    activeTasks: DEFAULT_RENDER_TASKS,
  });

  // Windows State
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'win-finder-init',
      appId: 'finder',
      title: 'Finder',
      icon: 'folder',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      x: 120,
      y: 70,
      width: 920,
      height: 580,
      minWidth: 640,
      minHeight: 400,
      displayId: 'display-1',
      spaceId: 1,
    }
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>('win-finder-init');

  // UI Panels
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [missionControlOpen, setMissionControlOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<OsNotification[]>([
    {
      id: 'notif-welcome',
      title: 'NebulaOS Creative Suite',
      message: 'Hardware acceleration & P3 Color Calibration active.',
      type: 'info',
      timestamp: 'Just now',
    }
  ]);

  // Cloud Sync
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastBackupTime, setLastBackupTime] = useState<string>('Just now');
  const [teamPresence, setTeamPresence] = useState<TeamMember[]>([
    {
      id: 'member-1',
      name: 'Maya Chen (Art Director)',
      avatarColor: 'bg-emerald-500',
      activeApp: 'Creative Studio',
      lastSeen: Date.now(),
    },
    {
      id: 'member-2',
      name: 'Alex Vance (VFX Lead)',
      avatarColor: 'bg-indigo-500',
      activeApp: 'Activity Monitor',
      lastSeen: Date.now() - 15000,
    }
  ]);

  // Notification trigger
  const notify = useCallback((title: string, message: string, type: OsNotification['type'] = 'info') => {
    sounds.playChime();
    const newNotif: OsNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      timestamp: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 5)]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Creative Producer',
          email: fbUser.email || 'user@nebulaos.pro',
          photoURL: fbUser.photoURL || undefined,
          isGuest: false,
        };
        setUser(profile);
        localStorage.setItem('nebula_os_user', JSON.stringify(profile));
        setLocked(false);
      }
    });

    // Real-time team presence listener
    const unsubPresence = CloudSyncService.subscribeToTeamPresence((members) => {
      if (members.length > 0) {
        setTeamPresence(prev => {
          const map = new Map(prev.map(m => [m.id, m]));
          members.forEach(m => map.set(m.id, { ...map.get(m.id), ...m, avatarColor: 'bg-sky-500' }));
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsub();
      unsubPresence();
    };
  }, []);

  // Login Handlers
  const loginWithGoogle = async () => {
    try {
      setSyncStatus('syncing');
      const profile = await signInWithGoogle();
      setUser(profile);
      setLocked(false);
      notify('Google Account Connected', `Welcome back, ${profile.displayName}! Google Drive synced.`, 'sync');
      setSyncStatus('synced');
    } catch (err: any) {
      console.warn('Google sign-in popup failed, offering guest fallback:', err);
      // If popup was blocked or iframe restriction occurred, provide clear message
      notify('Sign-In Notice', 'You can also continue seamlessly as Guest Creative via the bypass button.', 'warning');
      throw err;
    }
  };

  const loginAsGuest = () => {
    const guestUser: UserProfile = {
      uid: `guest-${Date.now()}`,
      displayName: 'Guest Creative',
      email: 'guest@studio.local',
      isGuest: true,
    };
    setUser(guestUser);
    localStorage.setItem('nebula_os_user', JSON.stringify(guestUser));
    setLocked(false);
    sounds.playPop();
    notify('Guest Studio Mode', 'Running with full local offline persistence & thermal engine.', 'info');
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setLocked(true);
    sounds.playPop();
  };

  // Hardware Thermal Simulation Loop: Real-time dynamic simulation based on active rendering tasks
  useEffect(() => {
    const timer = setInterval(() => {
      setHardware(prev => {
        const renderingCount = prev.activeTasks.filter(t => t.status === 'rendering').length;
        
        // Progress render tasks
        let tasksUpdated = prev.activeTasks.map(t => {
          if (t.status === 'rendering') {
            const nextProgress = Math.min(100, t.progress + Math.floor(Math.random() * 4 + 1));
            return {
              ...t,
              progress: nextProgress,
              status: nextProgress >= 100 ? ('completed' as const) : ('rendering' as const)
            };
          }
          return t;
        });

        // Check if any just completed
        prev.activeTasks.forEach((t, i) => {
          if (t.status === 'rendering' && tasksUpdated[i].status === 'completed') {
            notify('Render Complete', `${t.name} exported successfully.`, 'render');
          }
        });

        // Target loads
        const baseCpuLoad = renderingCount > 0 ? 65 + renderingCount * 14 : 14;
        const targetCpuLoad = Math.min(99, baseCpuLoad + Math.floor(Math.random() * 10 - 5));
        const baseGpuLoad = renderingCount > 0 ? 75 + renderingCount * 12 : 10;
        const targetGpuLoad = Math.min(99, baseGpuLoad + Math.floor(Math.random() * 8 - 4));

        // Temperatures
        let targetTemp = 42 + (targetCpuLoad * 0.45);
        if (prev.thermalMode === 'turbo') {
          targetTemp = Math.max(38, targetTemp - 14); // Turbo fans cool it down aggressively!
        } else if (prev.thermalMode === 'silent') {
          targetTemp += 10; // Fans capped, runs warmer
        }

        // Fan RPM curves
        let targetRPM = 2100;
        if (prev.thermalMode === 'turbo') {
          targetRPM = 5800;
        } else if (prev.thermalMode === 'silent') {
          targetRPM = 1800;
        } else {
          // Auto
          targetRPM = Math.round(2000 + (targetTemp - 40) * 80);
          targetRPM = Math.max(1800, Math.min(5400, targetRPM));
        }

        // Smooth interpolation
        const nextTemp = Math.round(prev.cpuTemp + (targetTemp - prev.cpuTemp) * 0.15);
        const nextRPM = Math.round(prev.fanRPM + (targetRPM - prev.fanRPM) * 0.2);

        // Check thermal warning
        if (nextTemp >= 88 && prev.throttlingPrevention && prev.thermalMode !== 'turbo') {
          notify('Thermal Alert', `CPU reached ${nextTemp}°C. Engaging Turbo Fan Throttling Prevention.`, 'thermal');
        }

        return {
          ...prev,
          cpuLoad: targetCpuLoad,
          gpuLoad: targetGpuLoad,
          cpuTemp: nextTemp,
          gpuTemp: Math.max(38, nextTemp - 4),
          fanRPM: nextRPM,
          fanTargetRPM: targetRPM,
          activeTasks: tasksUpdated,
        };
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [notify]);

  // Automatic Cloud Backup Trigger on changes
  const saveTimeoutRef = useRef<any>(null);
  const queueCloudBackup = useCallback(() => {
    if (!settings.autoCloudBackup) return;
    setSyncStatus('syncing');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      const stateToSave = {
        files,
        settings,
        shortcuts,
      };
      const success = await CloudSyncService.backupToCloud(user?.uid || 'local', stateToSave);
      setSyncStatus(success ? 'synced' : 'offline');
      setLastBackupTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1500);
  }, [files, settings, shortcuts, user]);

  const triggerManualBackup = async () => {
    setSyncStatus('syncing');
    const stateToSave = { files, settings, shortcuts };
    await CloudSyncService.backupToCloud(user?.uid || 'local', stateToSave);
    setSyncStatus('synced');
    setLastBackupTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    sounds.playPop();
    notify('Cloud Backup Complete', 'All project assets, documents, and settings are backed up to Firebase.', 'sync');
  };

  // Window Operations
  const openApp = useCallback((appId: AppId, data?: any) => {
    sounds.playPop();
    setWindows(prev => {
      const existing = prev.find(w => w.appId === appId);
      const nextZIndex = Math.max(...prev.map(w => w.zIndex), 0) + 1;

      if (existing) {
        // Bring to front and unminimize
        setActiveWindowId(existing.id);
        return prev.map(w => w.id === existing.id ? { 
          ...w, 
          isOpen: true, 
          isMinimized: false, 
          zIndex: nextZIndex, 
          data: data || w.data,
          displayId: activeDisplayId 
        } : w);
      }

      // Create new window
      const meta = APP_METADATA[appId] || { title: appId, icon: 'app', width: 800, height: 500, minWidth: 400, minHeight: 300 };
      const offsetX = 80 + (prev.length % 6) * 32;
      const offsetY = 50 + (prev.length % 6) * 28;

      const newWindow: WindowState = {
        id: `win-${appId}-${Date.now()}`,
        appId,
        title: meta.title,
        icon: meta.icon,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: nextZIndex,
        x: offsetX,
        y: offsetY,
        width: Math.min(window.innerWidth - 60, meta.width),
        height: Math.min(window.innerHeight - 100, meta.height),
        minWidth: meta.minWidth,
        minHeight: meta.minHeight,
        displayId: activeDisplayId,
        spaceId: currentSpaceId,
        data,
      };

      setActiveWindowId(newWindow.id);
      return [...prev, newWindow];
    });

    // Broadcast team presence
    if (user) {
      CloudSyncService.broadcastPresence(user.uid, user.displayName, appId);
    }
  }, [activeDisplayId, currentSpaceId, user]);

  const closeWindow = useCallback((id: string) => {
    sounds.playSwoosh();
    setWindows(prev => {
      const filtered = prev.filter(w => w.id !== id);
      if (activeWindowId === id) {
        const remaining = filtered.filter(w => !w.isMinimized);
        if (remaining.length > 0) {
          const top = remaining.reduce((max, w) => w.zIndex > max.zIndex ? w : max, remaining[0]);
          setActiveWindowId(top.id);
        } else {
          setActiveWindowId(null);
        }
      }
      return filtered;
    });
  }, [activeWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    sounds.playSwoosh();
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    setActiveWindowId(prev => (prev === id ? null : prev));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    sounds.playPop();
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const nextZIndex = Math.max(...prev.map(w => w.zIndex), 0) + 1;
      return prev.map(w => w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w);
    });
    setActiveWindowId(id);
  }, []);

  const updateWindowBounds = useCallback((id: string, bounds: { x?: number; y?: number; width?: number; height?: number }) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;
      return {
        ...w,
        x: bounds.x !== undefined ? bounds.x : w.x,
        y: bounds.y !== undefined ? bounds.y : w.y,
        width: bounds.width !== undefined ? Math.max(w.minWidth, bounds.width) : w.width,
        height: bounds.height !== undefined ? Math.max(w.minHeight, bounds.height) : w.height,
      };
    }));
  }, []);

  // Hardware controls
  const setThermalMode = useCallback((mode: ThermalMode) => {
    sounds.playPop();
    setHardware(prev => ({
      ...prev,
      thermalMode: mode,
      fanTargetRPM: mode === 'turbo' ? 5800 : mode === 'silent' ? 1800 : 3200
    }));
    notify('Thermal Profile', `Switched to ${mode.toUpperCase()} mode.`, 'thermal');
  }, [notify]);

  const setFanRPMOverride = useCallback((rpm: number) => {
    setHardware(prev => ({ ...prev, fanTargetRPM: rpm }));
  }, []);

  const toggleThrottlingPrevention = useCallback(() => {
    setHardware(prev => ({ ...prev, throttlingPrevention: !prev.throttlingPrevention }));
  }, []);

  const addRenderTask = useCallback((task: Omit<RenderTask, 'id' | 'progress' | 'status'>) => {
    const newTask: RenderTask = {
      ...task,
      id: `task-${Date.now()}`,
      progress: 0,
      status: 'rendering',
    };
    setHardware(prev => ({
      ...prev,
      activeTasks: [newTask, ...prev.activeTasks]
    }));
    notify('Heavy Render Dispatched', `${task.name} queued on GPU/CPU compute cluster.`, 'render');
  }, [notify]);

  const cancelRenderTask = useCallback((id: string) => {
    setHardware(prev => ({
      ...prev,
      activeTasks: prev.activeTasks.filter(t => t.id !== id)
    }));
  }, []);

  // Custom Shortcuts Manager
  const updateShortcutKeys = useCallback((id: string, keys: string[]) => {
    setShortcuts(prev => {
      const updated = prev.map(sc => sc.id === id ? { ...sc, currentKeys: keys } : sc);
      queueCloudBackup();
      return updated;
    });
    notify('Shortcut Saved', 'Custom key combination updated and synced to cloud.', 'info');
  }, [notify, queueCloudBackup]);

  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
    queueCloudBackup();
    notify('Shortcuts Reset', 'All hotkeys restored to standard macOS factory defaults.', 'info');
  }, [notify, queueCloudBackup]);

  // File Operations
  const createFile = useCallback((file: Omit<FileItem, 'id' | 'updatedAt'>) => {
    const newFile: FileItem = {
      ...file,
      id: `file-${Date.now()}`,
      updatedAt: 'Just now',
      isCloudSynced: true,
      isOfflineAvailable: true,
    };
    setFiles(prev => [newFile, ...prev]);
    queueCloudBackup();
    sounds.playPop();
    notify('File Created', `${newFile.name} saved to ${newFile.path}.`, 'sync');
  }, [notify, queueCloudBackup]);

  const updateFile = useCallback((id: string, updates: Partial<FileItem>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates, updatedAt: 'Just now' } : f));
    queueCloudBackup();
  }, [queueCloudBackup]);

  const deleteFile = useCallback((id: string) => {
    sounds.playTrash();
    setFiles(prev => prev.filter(f => f.id !== id));
    queueCloudBackup();
    notify('Moved to Trash', 'File moved to system trash.', 'info');
  }, [notify, queueCloudBackup]);

  // Settings
  const updateSettings = useCallback((updates: Partial<OsSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      queueCloudBackup();
      return next;
    });
  }, [queueCloudBackup]);

  const toggleTheme = useCallback(() => {
    sounds.playPop();
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  }, []);

  const addAppToDock = useCallback((appId: AppId) => {
    sounds.playPop();
    setSettings(prev => {
      const current = prev.dockApps || DEFAULT_DOCK_APPS;
      if (current.includes(appId)) return prev;
      const next = { ...prev, dockApps: [...current, appId] };
      queueCloudBackup();
      return next;
    });
    notify('Dock Updated', `Added ${APP_METADATA[appId]?.title || appId} to Dock`, 'info');
  }, [queueCloudBackup, notify]);

  const removeAppFromDock = useCallback((appId: AppId) => {
    sounds.playTrash();
    setSettings(prev => {
      const current = prev.dockApps || DEFAULT_DOCK_APPS;
      const next = { ...prev, dockApps: current.filter(id => id !== appId) };
      queueCloudBackup();
      return next;
    });
    notify('Dock Updated', `Removed ${APP_METADATA[appId]?.title || appId} from Dock`, 'info');
  }, [queueCloudBackup, notify]);

  const addAppToDesktop = useCallback((appId: AppId) => {
    sounds.playPop();
    setSettings(prev => {
      const current = prev.desktopApps || DEFAULT_DESKTOP_APPS;
      if (current.includes(appId)) return prev;
      const next = { ...prev, desktopApps: [...current, appId] };
      queueCloudBackup();
      return next;
    });
    notify('Desktop Updated', `Added ${APP_METADATA[appId]?.title || appId} shortcut to Desktop`, 'info');
  }, [queueCloudBackup, notify]);

  const removeAppFromDesktop = useCallback((appId: AppId) => {
    sounds.playTrash();
    setSettings(prev => {
      const current = prev.desktopApps || DEFAULT_DESKTOP_APPS;
      const next = { ...prev, desktopApps: current.filter(id => id !== appId) };
      queueCloudBackup();
      return next;
    });
    notify('Desktop Updated', `Removed ${APP_METADATA[appId]?.title || appId} shortcut from Desktop`, 'info');
  }, [queueCloudBackup, notify]);

  const resetDockAndDesktopApps = useCallback(() => {
    sounds.playPop();
    setSettings(prev => {
      const next = { ...prev, dockApps: DEFAULT_DOCK_APPS, desktopApps: DEFAULT_DESKTOP_APPS };
      queueCloudBackup();
      return next;
    });
    notify('Reset Complete', 'Restored default Dock and Desktop apps.', 'info');
  }, [queueCloudBackup, notify]);

  // Global Keyboard Shortcuts Event Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input or textarea unless Meta is pressed
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Spotlight: Cmd + Space
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        setSpotlightOpen(prev => !prev);
        return;
      }

      // Mission control: Ctrl + ArrowUp
      if (e.ctrlKey && e.code === 'ArrowUp') {
        e.preventDefault();
        setMissionControlOpen(prev => !prev);
        return;
      }

      // Close active window: Cmd + W
      if ((e.metaKey || e.ctrlKey) && (e.key === 'w' || e.key === 'W') && !isInput) {
        e.preventDefault();
        if (activeWindowId) closeWindow(activeWindowId);
        return;
      }

      // Minimize active window: Cmd + M
      if ((e.metaKey || e.ctrlKey) && (e.key === 'm' || e.key === 'M') && !isInput) {
        e.preventDefault();
        if (activeWindowId) minimizeWindow(activeWindowId);
        return;
      }

      // Lock Screen: Cmd + Ctrl + Q
      if ((e.metaKey || e.ctrlKey) && e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setLocked(true);
        return;
      }

      // Toggle Theme: Cmd + Shift + D
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleTheme();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWindowId, closeWindow, minimizeWindow, toggleTheme]);

  return (
    <OSContext.Provider
      value={{
        user,
        isLocked,
        setLocked,
        loginWithGoogle,
        loginAsGuest,
        logout,
        windows,
        activeWindowId,
        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowBounds,
        displays,
        activeDisplayId,
        setActiveDisplayId,
        currentSpaceId,
        setCurrentSpaceId,
        hardware,
        setThermalMode,
        setFanRPMOverride,
        toggleThrottlingPrevention,
        addRenderTask,
        cancelRenderTask,
        shortcuts,
        updateShortcutKeys,
        resetShortcuts,
        files,
        createFile,
        updateFile,
        deleteFile,
        settings,
        updateSettings,
        toggleTheme,
        addAppToDock,
        removeAppFromDock,
        addAppToDesktop,
        removeAppFromDesktop,
        resetDockAndDesktopApps,
        syncStatus,
        lastBackupTime,
        triggerManualBackup,
        spotlightOpen,
        setSpotlightOpen,
        missionControlOpen,
        setMissionControlOpen,
        controlCenterOpen,
        setControlCenterOpen,
        notifications,
        notify,
        dismissNotification,
        teamPresence,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
