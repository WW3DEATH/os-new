import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { WindowState } from '../../types/os';
import { FinderApp } from '../apps/FinderApp';
import { ActivityMonitorApp } from '../apps/ActivityMonitorApp';
import { ShortcutsApp } from '../apps/ShortcutsApp';
import { GoogleDriveApp } from '../apps/GoogleDriveApp';
import { GoogleDocsApp } from '../apps/GoogleDocsApp';
import { GoogleSheetsApp } from '../apps/GoogleSheetsApp';
import { CreativeStudioApp } from '../apps/CreativeStudioApp';
import { BrowserApp } from '../apps/BrowserApp';
import { TerminalApp } from '../apps/TerminalApp';
import { SystemSettingsApp } from '../apps/SystemSettingsApp';
import { NotesApp, TasksApp } from '../apps/NotesAndTasksApp';
import { KeynoteApp } from '../apps/KeynoteApp';
import { GmailApp } from '../apps/GmailApp';
import { YouTubeApp } from '../apps/YouTubeApp';
import { X, Minus, Maximize2 } from 'lucide-react';

interface WindowFrameProps {
  window: WindowState;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win }) => {
  const { 
    activeWindowId, 
    focusWindow, 
    closeWindow, 
    minimizeWindow, 
    maximizeWindow, 
    updateWindowBounds, 
    settings 
  } = useOS();

  const isFocused = activeWindowId === win.id;
  const [isTrafficHovered, setIsTrafficHovered] = useState(false);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });

  // Resizing state
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, winW: 0, winH: 0 });

  // Handle Dragging
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click and when not maximized
    if (e.button !== 0 || win.isMaximized) return;
    focusWindow(win.id);
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.x,
      winY: win.y,
    };
    e.preventDefault();
  };

  // Handle Resizing from bottom right corner
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || win.isMaximized) return;
    focusWindow(win.id);
    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winW: win.width,
      winH: win.height,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  // Global mouse move & mouse up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - dragStartRef.current.mouseX;
        const deltaY = e.clientY - dragStartRef.current.mouseY;
        const nextX = Math.max(0, Math.min(window.innerWidth - 100, dragStartRef.current.winX + deltaX));
        const nextY = Math.max(28, Math.min(window.innerHeight - 80, dragStartRef.current.winY + deltaY));
        updateWindowBounds(win.id, { x: nextX, y: nextY });
      } else if (isResizingRef.current) {
        const deltaW = e.clientX - resizeStartRef.current.mouseX;
        const deltaH = e.clientY - resizeStartRef.current.mouseY;
        const nextW = Math.max(win.minWidth, resizeStartRef.current.winW + deltaW);
        const nextH = Math.max(win.minHeight, resizeStartRef.current.winH + deltaH);
        updateWindowBounds(win.id, { width: nextW, height: nextH });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [win.id, win.minWidth, win.minHeight, updateWindowBounds]);

  if (!win.isOpen || win.isMinimized) {
    return null;
  }

  // Render App Content
  const renderAppContent = () => {
    switch (win.appId) {
      case 'finder':
        return <FinderApp />;
      case 'safari':
        return <BrowserApp />;
      case 'youtube':
        return <YouTubeApp />;
      case 'gmail':
        return <GmailApp />;
      case 'activity_monitor':
        return <ActivityMonitorApp />;
      case 'shortcuts':
        return <ShortcutsApp />;
      case 'settings':
        return <SystemSettingsApp />;
      case 'gdrive':
        return <GoogleDriveApp />;
      case 'gdocs':
        return <GoogleDocsApp initialFileId={win.data?.fileId} initialFileName={win.data?.fileName} initialContent={win.data?.content} />;
      case 'gsheets':
        return <GoogleSheetsApp initialFileId={win.data?.fileId} initialFileName={win.data?.fileName} />;
      case 'keynote':
        return <KeynoteApp initialFileId={win.data?.fileId} initialFileName={win.data?.fileName} />;
      case 'creative_studio':
        return <CreativeStudioApp />;
      case 'terminal':
        return <TerminalApp initialCommand={win.data?.command} />;
      case 'notes':
        return <NotesApp />;
      case 'tasks':
        return <TasksApp />;
      case 'trash':
        return <FinderApp />;
      default:
        return <div className="p-8 text-center opacity-60">App Content Loading...</div>;
    }
  };

  return (
    <div
      onMouseDown={() => focusWindow(win.id)}
      style={{
        zIndex: win.zIndex,
        left: win.isMaximized ? 0 : win.x,
        top: win.isMaximized ? 28 : win.y,
        width: win.isMaximized ? '100vw' : `${win.width}px`,
        height: win.isMaximized ? 'calc(100vh - 28px)' : `${win.height}px`,
      }}
      className={`fixed rounded-xl overflow-hidden flex flex-col transition-[box-shadow,opacity] duration-150 backdrop-blur-2xl border ${
        win.isMaximized ? 'rounded-none border-0' : ''
      } ${
        isFocused
          ? settings.theme === 'dark'
            ? 'shadow-[0_24px_64px_rgba(0,0,0,0.85)] border-white/20'
            : 'shadow-[0_24px_64px_rgba(0,0,0,0.3)] border-black/15'
          : settings.theme === 'dark'
          ? 'shadow-[0_12px_32px_rgba(0,0,0,0.5)] border-white/10 opacity-95'
          : 'shadow-[0_12px_32px_rgba(0,0,0,0.15)] border-black/10 opacity-95'
      }`}
    >
      {/* Title Bar with macOS Traffic Lights */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
        className={`h-9 border-b flex items-center justify-between px-3 select-none cursor-default transition-colors ${
          settings.theme === 'dark'
            ? isFocused ? 'bg-neutral-800/90 text-neutral-200 border-white/10' : 'bg-neutral-800/60 text-neutral-400 border-white/5'
            : isFocused ? 'bg-white/95 text-neutral-800 border-black/10' : 'bg-neutral-100/70 text-neutral-500 border-black/5'
        }`}
      >
        {/* Left: Traffic Lights */}
        <div 
          className="flex items-center space-x-2"
          onMouseEnter={() => setIsTrafficHovered(true)}
          onMouseLeave={() => setIsTrafficHovered(false)}
        >
          {/* Close - Red */}
          <button
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-neutral-900"
            title="Close"
          >
            {isTrafficHovered && <X className="w-2 h-2 opacity-80" strokeWidth={3} />}
          </button>

          {/* Minimize - Yellow */}
          <button
            onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-neutral-900"
            title="Minimize"
          >
            {isTrafficHovered && <Minus className="w-2 h-2 opacity-80" strokeWidth={3} />}
          </button>

          {/* Maximize / Zoom - Green */}
          <button
            onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-neutral-900"
            title="Maximize"
          >
            {isTrafficHovered && <Maximize2 className="w-1.5 h-1.5 opacity-80" strokeWidth={3} />}
          </button>
        </div>

        {/* Center: Window Title */}
        <div className="font-semibold text-xs truncate max-w-sm pointer-events-none opacity-90">
          {win.title}
        </div>

        {/* Right placeholder to keep title centered */}
        <div className="w-12"></div>
      </div>

      {/* App Body Container */}
      <div className={`flex-1 overflow-hidden relative ${
        settings.theme === 'dark' ? 'bg-neutral-900/90' : 'bg-white/95'
      }`}>
        {renderAppContent()}
      </div>

      {/* Resize Grip (Bottom-Right Corner) */}
      {!win.isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5 opacity-40 hover:opacity-100"
        >
          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 10 10">
            <path d="M9 1L1 9M9 5L5 9M9 9H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
};
