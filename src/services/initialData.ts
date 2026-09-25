import { AppId, ShortcutKeyBinding, FileItem, OsSettings, DisplayInfo, RenderTask } from '../types/os';

export const DEFAULT_DISPLAYS: DisplayInfo[] = [
  {
    id: 'display-1',
    name: 'Apple Studio Display (5K Retina)',
    resolution: '5120 × 2880 @ 120Hz ProMotion',
    refreshRate: '120Hz',
    isPrimary: true,
    colorProfile: 'Display P3 Wide Color (ColorSync Calibrated)'
  },
  {
    id: 'display-2',
    name: 'Pro Display XDR (HDR Reference)',
    resolution: '6016 × 3384 @ 120Hz ProMotion',
    refreshRate: '120Hz',
    isPrimary: false,
    colorProfile: 'HDR Video (P3-ST 2084 Reference Master)'
  }
];

export const DEFAULT_SHORTCUTS: ShortcutKeyBinding[] = [
  {
    id: 'sc-spotlight',
    label: 'Spotlight Search',
    category: 'System',
    defaultKeys: ['Meta', 'Space'],
    currentKeys: ['Meta', 'Space'],
    actionId: 'open_spotlight',
    description: 'Quickly find apps, documents, calculations, and system settings'
  },
  {
    id: 'sc-mission-control',
    label: 'Mission Control & Spaces',
    category: 'Window Management',
    defaultKeys: ['Control', 'ArrowUp'],
    currentKeys: ['Control', 'ArrowUp'],
    actionId: 'toggle_mission_control',
    description: 'Birds-eye view of all open windows across virtual desktop spaces'
  },
  {
    id: 'sc-close-window',
    label: 'Close Active Window',
    category: 'Window Management',
    defaultKeys: ['Meta', 'w'],
    currentKeys: ['Meta', 'w'],
    actionId: 'close_active_window',
    description: 'Dismiss the currently focused application window'
  },
  {
    id: 'sc-minimize-window',
    label: 'Minimize Window to Dock',
    category: 'Window Management',
    defaultKeys: ['Meta', 'm'],
    currentKeys: ['Meta', 'm'],
    actionId: 'minimize_active_window',
    description: 'Animate and dock active window to the right shelf'
  },
  {
    id: 'sc-switch-apps',
    label: 'App Switcher',
    category: 'Window Management',
    defaultKeys: ['Meta', 'Tab'],
    currentKeys: ['Meta', 'Tab'],
    actionId: 'cycle_apps',
    description: 'Cycle through running creative apps'
  },
  {
    id: 'sc-new-finder',
    label: 'New Finder Window',
    category: 'Finder & Navigation',
    defaultKeys: ['Meta', 'n'],
    currentKeys: ['Meta', 'n'],
    actionId: 'open_finder',
    description: 'Open new project asset file explorer'
  },
  {
    id: 'sc-turbo-render',
    label: 'Turbo Render Mode (Fan Boost)',
    category: 'Hardware & Render',
    defaultKeys: ['Meta', 'Shift', 'R'],
    currentKeys: ['Meta', 'Shift', 'R'],
    actionId: 'toggle_turbo_render',
    description: 'Engage Max Fan RPM (5800 RPM) and unlock maximum thermal headroom for rendering'
  },
  {
    id: 'sc-activity-monitor',
    label: 'Activity & Thermal Monitor',
    category: 'Hardware & Render',
    defaultKeys: ['Meta', 'Option', 'Escape'],
    currentKeys: ['Meta', 'Option', 'Escape'],
    actionId: 'open_activity_monitor',
    description: 'Inspect CPU/GPU thermal sensors, core loads, and processes'
  },
  {
    id: 'sc-toggle-theme',
    label: 'Toggle Dark / Light Mode',
    category: 'System',
    defaultKeys: ['Meta', 'Shift', 'D'],
    currentKeys: ['Meta', 'Shift', 'D'],
    actionId: 'toggle_theme',
    description: 'Instant transition between Studio Dark Mode and Daylight Light Mode'
  },
  {
    id: 'sc-switch-monitor',
    label: 'Switch Active Display',
    category: 'Window Management',
    defaultKeys: ['Control', 'Option', 'ArrowRight'],
    currentKeys: ['Control', 'Option', 'ArrowRight'],
    actionId: 'switch_display',
    description: 'Focus secondary reference monitor or primary Studio display'
  },
  {
    id: 'sc-lock-screen',
    label: 'Lock Screen',
    category: 'System',
    defaultKeys: ['Meta', 'Control', 'q'],
    currentKeys: ['Meta', 'Control', 'q'],
    actionId: 'lock_screen',
    description: 'Secure workstation and return to login lock screen'
  },
  {
    id: 'sc-open-terminal',
    label: 'Quick Terminal (Zsh)',
    category: 'Creative Workflow',
    defaultKeys: ['Meta', '`'],
    currentKeys: ['Meta', '`'],
    actionId: 'open_terminal',
    description: 'Summon drop-down developer & build terminal'
  }
];

export const DEFAULT_FILES: FileItem[] = [
  {
    id: 'file-1',
    name: 'Nebula_Sequencer_3D.blend',
    path: '/Creative Projects/3D Assets/Nebula_Sequencer_3D.blend',
    type: '3d_model',
    size: '142.8 MB',
    updatedAt: 'Today, 10:14 AM',
    tags: ['render', 'high-poly'],
    isCloudSynced: true,
    isOfflineAvailable: true,
    content: 'Binary 3D Scene Data - Cycles GPU Raytraced Project'
  },
  {
    id: 'file-2',
    name: 'Cyberpunk_City_Normal_Map_4K.exr',
    path: '/Creative Projects/Textures/Cyberpunk_City_Normal_Map_4K.exr',
    type: 'image',
    size: '84.2 MB',
    updatedAt: 'Yesterday, 4:20 PM',
    tags: ['textures'],
    isCloudSynced: true,
    isOfflineAvailable: true
  },
  {
    id: 'file-3',
    name: 'Studio Production Budget Q3.sheet',
    path: '/Google Drive/Studio Production Budget Q3.sheet',
    type: 'spreadsheet',
    size: '34 KB',
    updatedAt: 'Today, 08:30 AM',
    tags: ['finance', 'drive'],
    isCloudSynced: true,
    isOfflineAvailable: true,
    content: JSON.stringify({
      title: 'Studio Production Budget Q3',
      headers: ['Item / Asset', 'Category', 'Unit Cost', 'Qty', 'Total ($)'],
      rows: [
        ['RTX 6000 Ada Cloud Compute Hours', 'Rendering', '4.50', '250', '1125.00'],
        ['ProRes 422 High-Bitrate Storage', 'Storage', '180.00', '4', '720.00'],
        ['Soundtrack Orchestral Stems', 'Audio', '450.00', '3', '1350.00'],
        ['Motion Capture Rig Rental', 'Production', '600.00', '2', '1200.00'],
        ['Firebase & Serverless Render Nodes', 'Infrastructure', '120.00', '1', '120.00']
      ]
    })
  },
  {
    id: 'file-4',
    name: 'Creative Workflow Architecture.doc',
    path: '/Google Drive/Creative Workflow Architecture.doc',
    type: 'document',
    size: '18 KB',
    updatedAt: 'Today, 09:45 AM',
    tags: ['docs', 'drive'],
    isCloudSynced: true,
    isOfflineAvailable: true,
    content: `# NebulaOS Creative Workflow Architecture

## Executive Summary
NebulaOS Desktop Pro is designed from the ground up for high-performance creative workflows:
- **Zero-Latency Rendering Pipeline:** Integrated CPU/GPU load balancing with proactive fan throttling controls.
- **Direct Google Drive Integration:** Local cache mirroring with seamless zero-friction cloud synchronization.
- **Modular Multi-Monitor Workspace:** Studio 5K Retina primary screen alongside 4K HDR Reference grading preview.

### Hardware Acceleration Profiles
1. **Silent Studio (1800 RPM):** Audio recording & mixing where acoustic zero-noise is critical.
2. **Auto Balanced (3200 RPM):** Real-time 2D/3D compositing with dynamic thermal curves.
3. **Turbo Render Max (5800 RPM):** Uncapped TDP for 4K video exports, Blender raytracing, and neural upscaling.`
  },
  {
    id: 'file-5',
    name: 'Mastering_Stems_Stem4_Synth.wav',
    path: '/Creative Projects/Audio Stems/Mastering_Stems_Stem4_Synth.wav',
    type: 'audio',
    size: '48.9 MB',
    updatedAt: '2 days ago',
    tags: ['audio'],
    isCloudSynced: true,
    isOfflineAvailable: false
  },
  {
    id: 'file-6',
    name: 'shader_denoiser.glsl',
    path: '/Creative Projects/Shaders/shader_denoiser.glsl',
    type: 'code',
    size: '4.2 KB',
    updatedAt: 'Yesterday',
    tags: ['code'],
    isCloudSynced: true,
    isOfflineAvailable: true,
    content: `// NebulaOS Bilateral Spatial Denoiser
#version 450 core
layout(local_size_x = 16, local_size_y = 16) in;
layout(binding = 0, rgba32f) uniform readonly image2D u_InputFrame;
layout(binding = 1, rgba32f) uniform writeonly image2D u_OutputFrame;

void main() {
    ivec2 coord = ivec2(gl_GlobalInvocationID.xy);
    vec4 center = imageLoad(u_InputFrame, coord);
    // Gaussian weighting & spatial luminance filter
    imageStore(u_OutputFrame, coord, center);
}`
  }
];

export const DEFAULT_RENDER_TASKS: RenderTask[] = [
  {
    id: 'task-1',
    name: 'Blender 4K Cycles Raytracing (Scene 04)',
    app: 'Creative Studio',
    progress: 74,
    status: 'rendering',
    cpuLoad: 92,
    gpuLoad: 98,
    estimatedSecs: 42
  },
  {
    id: 'task-2',
    name: 'ProRes 422 HQ Color Grading Export',
    app: 'Final Cut Pro Link',
    progress: 35,
    status: 'rendering',
    cpuLoad: 68,
    gpuLoad: 84,
    estimatedSecs: 110
  }
];

export const WALLPAPERS = [
  {
    id: 'sequoia-dark',
    name: 'macOS Sequoia (Dark Forest)',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2800&q=80',
    theme: 'dark'
  },
  {
    id: 'sonoma-sunset',
    name: 'Sonoma Golden Ridge',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2800&q=80',
    theme: 'light'
  },
  {
    id: 'nebula-deep',
    name: 'Deep Space Nebula Pro',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2800&q=80',
    theme: 'dark'
  },
  {
    id: 'cyber-minimal',
    name: 'Minimal Dark Studio Gradient',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2800&q=80',
    theme: 'dark'
  },
  {
    id: 'daylight-mountains',
    name: 'High Sierra Daylight Peak',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2800&q=80',
    theme: 'light'
  }
];

export const DEFAULT_DOCK_APPS: AppId[] = [
  'finder',
  'safari',
  'gemini',
  'youtube',
  'gmail',
  'gdrive',
  'gdocs',
  'gsheets',
  'keynote',
  'creative_studio',
  'activity_monitor',
  'shortcuts',
  'terminal',
  'notes',
  'tasks',
  'settings'
];

export const DEFAULT_DESKTOP_APPS: AppId[] = [
  'finder',
  'gemini',
  'gdrive',
  'gmail',
  'youtube',
  'creative_studio',
  'gdocs',
  'gsheets',
  'keynote',
  'terminal',
  'activity_monitor'
];

export const DEFAULT_SETTINGS: OsSettings = {
  theme: 'dark',
  accentColor: 'blue',
  wallpaper: WALLPAPERS[0].url,
  soundEffects: true,
  dockSize: 64,
  dockMagnification: true,
  activeDisplayId: 'display-1',
  autoCloudBackup: true,
  offlineSyncEnabled: true,
  dockApps: DEFAULT_DOCK_APPS,
  desktopApps: DEFAULT_DESKTOP_APPS,
};
