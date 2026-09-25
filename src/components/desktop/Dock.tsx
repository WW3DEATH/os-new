import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { AppId } from '../../types/os';
import { APP_CATALOG } from '../../utils/appCatalog';
import { DEFAULT_DOCK_APPS } from '../../services/initialData';
import { 
  Trash2,
  Layers,
  Plus,
  X,
  ExternalLink,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';

export const Dock: React.FC = () => {
  const { 
    windows, 
    openApp, 
    focusWindow, 
    settings, 
    setMissionControlOpen,
    addAppToDock,
    removeAppFromDock,
    addAppToDesktop,
    removeAppFromDesktop,
    resetDockAndDesktopApps
  } = useOS();

  const [hoveredApp, setHoveredApp] = useState<AppId | 'trash' | 'mission' | 'add' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appId: AppId } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu and add menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setContextMenu(null);
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const dockAppIds = settings.dockApps || DEFAULT_DOCK_APPS;
  const desktopAppIds = settings.desktopApps || [];

  // Available apps to add to dock
  const availableAppsToAdd = (Object.keys(APP_CATALOG) as AppId[]).filter(
    id => id !== 'trash' && !dockAppIds.includes(id)
  );

  const handleContextMenu = (e: React.MouseEvent, appId: AppId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY - 120,
      appId
    });
  };

  // Minimized windows in the dock
  const minimizedWindows = windows.filter(w => w.isMinimized);

  return (
    <>
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-end">
        <nav 
          className={`px-3 py-2 rounded-2xl flex items-end space-x-2 backdrop-blur-2xl border transition-all duration-200 shadow-2xl ${
            settings.theme === 'dark' 
              ? 'bg-neutral-900/60 border-white/15' 
              : 'bg-white/60 border-black/10'
          }`}
        >
          {/* Mission Control Quick Button */}
          <div className="relative group">
            <button
              onClick={() => setMissionControlOpen(true)}
              onMouseEnter={() => setHoveredApp('mission')}
              onMouseLeave={() => setHoveredApp(null)}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform hover:-translate-y-2 active:scale-95 duration-150"
            >
              <Layers className="w-6 h-6 text-white" />
            </button>
            {hoveredApp === 'mission' && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-900/90 text-white backdrop-blur border border-white/10 shadow whitespace-nowrap pointer-events-none">
                Mission Control
              </div>
            )}
          </div>

          <div className="w-[1px] h-8 bg-white/15 self-center my-auto mx-0.5"></div>

          {/* User-Configured Dock Apps */}
          {dockAppIds.map((appId) => {
            const app = APP_CATALOG[appId];
            if (!app) return null;

            const isRunning = windows.some(w => w.appId === appId && w.isOpen);
            const isHovered = hoveredApp === appId;

            return (
              <div key={appId} className="relative group">
                <button
                  onClick={() => openApp(appId)}
                  onContextMenu={(e) => handleContextMenu(e, appId)}
                  onMouseEnter={() => setHoveredApp(appId)}
                  onMouseLeave={() => setHoveredApp(null)}
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg transition-all duration-150 transform hover:-translate-y-2.5 hover:scale-110 active:scale-95`}
                >
                  {app.icon}
                </button>

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-900/90 text-white backdrop-blur border border-white/10 shadow whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                    {app.label}
                  </div>
                )}

                {/* Running Indicator Dot */}
                {isRunning && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow"></div>
                )}
              </div>
            );
          })}

          {/* Quick Add App to Dock Button */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              onMouseEnter={() => setHoveredApp('add')}
              onMouseLeave={() => setHoveredApp(null)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all my-auto"
              title="Add or manage dock apps"
            >
              <Plus className="w-4 h-4" />
            </button>

            {hoveredApp === 'add' && !showAddMenu && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-900/90 text-white backdrop-blur border border-white/10 shadow whitespace-nowrap pointer-events-none">
                Add App to Dock
              </div>
            )}

            {/* Add App to Dock Dropdown Popover */}
            {showAddMenu && (
              <div className="absolute bottom-12 right-0 w-60 rounded-2xl bg-neutral-900/95 text-white border border-white/15 shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-semibold">
                  <span>Add Apps to Dock</span>
                  <button 
                    onClick={() => resetDockAndDesktopApps()} 
                    className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 opacity-80"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                </div>

                {availableAppsToAdd.length === 0 ? (
                  <div className="text-[11px] opacity-60 text-center py-3">
                    All apps are already pinned to the dock!
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {availableAppsToAdd.map((id) => {
                      const item = APP_CATALOG[id];
                      return (
                        <div
                          key={id}
                          onClick={() => {
                            addAppToDock(id);
                            setShowAddMenu(false);
                          }}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xs p-1`}>
                              {item.icon}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                          </div>
                          <Plus className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Minimized Windows Divider & Thumbnails */}
          {minimizedWindows.length > 0 && (
            <>
              <div className="w-[1px] h-8 bg-white/15 self-center my-auto mx-1"></div>
              {minimizedWindows.map((win) => (
                <div key={win.id} className="relative group">
                  <button
                    onClick={() => focusWindow(win.id)}
                    className="w-10 h-10 rounded-lg bg-neutral-800/80 border border-white/20 p-1 flex flex-col items-center justify-center shadow-lg transition-transform hover:-translate-y-2 active:scale-95"
                    title={`Restore ${win.title}`}
                  >
                    <div className="w-full h-full rounded bg-white/10 flex items-center justify-center text-[10px] text-neutral-300 font-mono font-bold truncate">
                      {win.title.slice(0, 3)}
                    </div>
                  </button>
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-900/90 text-white backdrop-blur border border-white/10 shadow whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    {win.title}
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="w-[1px] h-8 bg-white/15 self-center my-auto mx-0.5"></div>

          {/* Trash Can */}
          <div className="relative group">
            <button
              onClick={() => openApp('trash')}
              onMouseEnter={() => setHoveredApp('trash')}
              onMouseLeave={() => setHoveredApp(null)}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center shadow-lg transition-transform hover:-translate-y-2 active:scale-95"
            >
              <Trash2 className="w-6 h-6 text-neutral-200" />
            </button>
            {hoveredApp === 'trash' && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-900/90 text-white backdrop-blur border border-white/10 shadow whitespace-nowrap pointer-events-none">
                Trash
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Dock Item Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-52 rounded-xl bg-neutral-900/95 text-white border border-white/15 shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 text-xs"
          style={{ left: Math.max(10, Math.min(window.innerWidth - 220, contextMenu.x)), top: Math.max(10, contextMenu.y) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 font-bold border-b border-white/10 text-neutral-300">
            {APP_CATALOG[contextMenu.appId]?.label || contextMenu.appId}
          </div>

          <button
            onClick={() => {
              openApp(contextMenu.appId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
          >
            <span>Open Application</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>

          {desktopAppIds.includes(contextMenu.appId) ? (
            <button
              onClick={() => {
                removeAppFromDesktop(contextMenu.appId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
            >
              <span>Remove from Desktop</span>
              <X className="w-3 h-3 opacity-60" />
            </button>
          ) : (
            <button
              onClick={() => {
                addAppToDesktop(contextMenu.appId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between"
            >
              <span>Add to Desktop</span>
              <Plus className="w-3 h-3 opacity-60" />
            </button>
          )}

          <div className="my-1 border-t border-white/10"></div>

          <button
            onClick={() => {
              removeAppFromDock(contextMenu.appId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center justify-between"
          >
            <span>Remove from Dock</span>
            <Trash2 className="w-3 h-3 opacity-70" />
          </button>
        </div>
      )}
    </>
  );
};
