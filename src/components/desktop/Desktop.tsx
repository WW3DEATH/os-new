import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { MenuBar } from './MenuBar';
import { Dock } from './Dock';
import { WindowFrame } from './WindowFrame';
import { ControlCenter } from './ControlCenter';
import { Spotlight } from './Spotlight';
import { MissionControl } from './MissionControl';
import { LockScreen } from './LockScreen';
import { NotificationBanner } from './NotificationBanner';
import { AppId } from '../../types/os';
import { APP_CATALOG } from '../../utils/appCatalog';
import { DEFAULT_DESKTOP_APPS, DEFAULT_DOCK_APPS } from '../../services/initialData';
import { 
  Monitor, 
  Plus, 
  X, 
  Trash2, 
  Sliders, 
  ExternalLink, 
  Check, 
  Layers, 
  RotateCcw,
  Sparkles,
  Palette
} from 'lucide-react';

export const Desktop: React.FC = () => {
  const { 
    isLocked, 
    windows, 
    openApp, 
    settings, 
    activeDisplayId, 
    displays, 
    currentSpaceId,
    addAppToDesktop,
    removeAppFromDesktop,
    addAppToDock,
    removeAppFromDock,
    resetDockAndDesktopApps
  } = useOS();

  // Desktop Context Menu & Modals State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'wallpaper' | 'icon'; appId?: AppId } | null>(null);
  const [showManagerModal, setShowManagerModal] = useState<boolean>(false);
  const [hoveredIconId, setHoveredIconId] = useState<AppId | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  if (isLocked) {
    return <LockScreen />;
  }

  const activeDisplay = displays.find(d => d.id === activeDisplayId) || displays[0];
  const desktopAppIds = settings.desktopApps || DEFAULT_DESKTOP_APPS;
  const dockAppIds = settings.dockApps || DEFAULT_DOCK_APPS;

  const handleWallpaperContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'wallpaper'
    });
  };

  const handleIconContextMenu = (e: React.MouseEvent, appId: AppId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'icon',
      appId
    });
  };

  return (
    <div 
      onContextMenu={handleWallpaperContextMenu}
      className={`fixed inset-0 overflow-hidden select-none bg-cover bg-center transition-all duration-500 font-sans ${
        settings.theme === 'dark' ? 'dark' : ''
      }`}
      style={{
        backgroundImage: `url('${settings.wallpaper}')`,
      }}
    >
      {/* Top MenuBar */}
      <MenuBar />

      {/* Multi-Monitor Active Screen Indicator Pill (Top Left below menu bar) */}
      <div className="absolute top-9 left-4 z-10 hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white/90 text-[10px] shadow pointer-events-none">
        <Monitor className="w-3 h-3 text-sky-400" />
        <span className="font-semibold">{activeDisplay.name}</span>
        <span className="opacity-60">• {activeDisplay.refreshRate}</span>
        <span className="opacity-60">• Desktop {currentSpaceId}</span>
      </div>

      {/* Dynamic Desktop Icons Grid (Top Right) */}
      <div className="absolute top-12 right-4 z-10 flex flex-col items-center space-y-3 max-h-[82vh] overflow-y-auto pr-1">
        {desktopAppIds.map((appId) => {
          const app = APP_CATALOG[appId];
          if (!app) return null;

          const isHovered = hoveredIconId === appId;

          return (
            <div
              key={appId}
              onDoubleClick={() => openApp(appId)}
              onContextMenu={(e) => handleIconContextMenu(e, appId)}
              onMouseEnter={() => setHoveredIconId(appId)}
              onMouseLeave={() => setHoveredIconId(null)}
              className="flex flex-col items-center text-center cursor-pointer group p-1.5 rounded-xl hover:bg-white/10 transition-all w-20 relative"
            >
              {/* Quick Remove Button on Hover */}
              {isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAppFromDesktop(appId);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow z-20 transition-transform active:scale-90"
                  title={`Remove ${app.label} from Desktop`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${app.gradient} p-0.5 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                {app.icon}
              </div>

              <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-1 truncate max-w-full leading-tight">
                {app.label}
              </span>
            </div>
          );
        })}

        {/* Add App to Desktop Shortcut Icon */}
        <div
          onClick={() => setShowManagerModal(true)}
          className="flex flex-col items-center text-center cursor-pointer group p-1.5 rounded-xl hover:bg-white/10 transition-all w-20 opacity-80 hover:opacity-100"
          title="Add or manage desktop app shortcuts"
        >
          <div className="w-11 h-11 rounded-xl border border-dashed border-white/40 group-hover:border-white flex items-center justify-center text-white/80 group-hover:text-white transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-white/80 drop-shadow mt-1">
            + Add App
          </span>
        </div>
      </div>

      {/* Floating Windows Stack */}
      {windows.map((win) => (
        <WindowFrame key={win.id} window={win} />
      ))}

      {/* Bottom Dock / Taskbar */}
      <Dock />

      {/* Control Center & Spotlight Overlays */}
      <ControlCenter />
      <Spotlight />
      <MissionControl />

      {/* Notifications Banner Stack */}
      <NotificationBanner />

      {/* Wallpaper & Desktop Icon Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-56 rounded-2xl bg-neutral-900/95 text-white border border-white/15 shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 text-xs"
          style={{ 
            left: Math.max(10, Math.min(window.innerWidth - 240, contextMenu.x)), 
            top: Math.max(10, Math.min(window.innerHeight - 220, contextMenu.y)) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'icon' && contextMenu.appId ? (
            <>
              <div className="px-3 py-1.5 font-bold border-b border-white/10 text-neutral-300">
                {APP_CATALOG[contextMenu.appId]?.label || contextMenu.appId}
              </div>

              <button
                onClick={() => {
                  if (contextMenu.appId) openApp(contextMenu.appId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>Open App</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>

              {dockAppIds.includes(contextMenu.appId) ? (
                <button
                  onClick={() => {
                    if (contextMenu.appId) removeAppFromDock(contextMenu.appId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>Remove from Dock</span>
                  <X className="w-3 h-3 opacity-60" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (contextMenu.appId) addAppToDock(contextMenu.appId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>Pin to Dock</span>
                  <Plus className="w-3 h-3 opacity-60" />
                </button>
              )}

              <div className="my-1 border-t border-white/10"></div>

              <button
                onClick={() => {
                  if (contextMenu.appId) removeAppFromDesktop(contextMenu.appId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center justify-between"
              >
                <span>Remove from Desktop</span>
                <Trash2 className="w-3 h-3 opacity-70" />
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-1 font-bold border-b border-white/10 text-neutral-400 text-[10px] uppercase tracking-wider">
                Desktop Options
              </div>

              <button
                onClick={() => {
                  setShowManagerModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between font-medium"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>Add Apps to Desktop...</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowManagerModal(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between font-medium"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manage Desktop &amp; Dock</span>
                </div>
              </button>

              <div className="my-1 border-t border-white/10"></div>

              <button
                onClick={() => {
                  openApp('settings');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Change Wallpaper</span>
                </div>
              </button>

              <button
                onClick={() => {
                  resetDockAndDesktopApps();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between text-neutral-400 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default Icons</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      {/* Desktop & Taskbar (Dock) Full App Manager Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15 text-neutral-100' : 'bg-white border-black/15 text-neutral-800'
          }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-black/10 dark:bg-white/5">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span>Desktop &amp; Taskbar (Dock) App Manager</span>
                </h3>
                <p className="text-[11px] opacity-60 mt-0.5">
                  Toggle any app on or off to pin or unpin from your Desktop and Taskbar.
                </p>
              </div>

              <button 
                onClick={() => setShowManagerModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apps Table List */}
            <div className="p-4 max-h-[60vh] overflow-y-auto divide-y divide-white/10">
              {(Object.keys(APP_CATALOG) as AppId[]).filter(id => id !== 'trash').map((appId) => {
                const app = APP_CATALOG[appId];
                const isOnDesktop = desktopAppIds.includes(appId);
                const isOnDock = dockAppIds.includes(appId);

                return (
                  <div key={appId} className="py-2.5 flex items-center justify-between px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${app.gradient} flex items-center justify-center p-1.5 shadow`}>
                        {app.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-2">
                          <span>{app.label}</span>
                          <span className="text-[9px] px-1.5 rounded bg-white/10 font-mono font-normal">
                            {app.category}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-60 max-w-xs truncate">
                          {app.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Toggle Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Desktop Toggle */}
                      <button
                        onClick={() => {
                          if (isOnDesktop) removeAppFromDesktop(appId);
                          else addAppToDesktop(appId);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isOnDesktop
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-white/10 hover:bg-white/20 opacity-70'
                        }`}
                      >
                        {isOnDesktop && <Check className="w-3 h-3" />}
                        <span>Desktop</span>
                      </button>

                      {/* Dock Toggle */}
                      <button
                        onClick={() => {
                          if (isOnDock) removeAppFromDock(appId);
                          else addAppToDock(appId);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isOnDock
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-white/10 hover:bg-white/20 opacity-70'
                        }`}
                      >
                        {isOnDock && <Check className="w-3 h-3" />}
                        <span>Dock</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t flex items-center justify-between bg-black/10 dark:bg-white/5 text-xs">
              <button
                onClick={() => resetDockAndDesktopApps()}
                className="text-neutral-400 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Layout</span>
              </button>

              <button
                onClick={() => setShowManagerModal(false)}
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-md transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
