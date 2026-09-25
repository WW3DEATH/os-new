import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Presentation, 
  Plus, 
  Play, 
  Trash2, 
  Layout, 
  Image as ImageIcon, 
  Type, 
  Maximize2, 
  Download, 
  Share2, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Palette,
  FolderOpen,
  FilePlus,
  RotateCw,
  Sliders,
  Move,
  Clock,
  Eye,
  X,
  FileText,
  Copy,
  Zap,
  Check,
  Tv,
  Layers,
  ArrowRight
} from 'lucide-react';

export type TransitionType = 
  | 'morph'
  | 'fade' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom' 
  | 'flip' 
  | 'wipe' 
  | 'cube' 
  | 'revolve' 
  | 'drop' 
  | 'none';

export type ElementAnimation = 
  | 'fade-up' 
  | 'fly-left' 
  | 'fly-right' 
  | 'bounce' 
  | 'zoom-in' 
  | 'pop' 
  | 'shimmer' 
  | 'none';

export type SlideLayoutType = 'title' | 'bullets' | 'two-column' | 'stat' | 'quote' | 'blank';

export interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'stat';
  content: string;
  subContent?: string;
  animation: ElementAnimation;
}

export interface Slide {
  id: string;
  layout: SlideLayoutType;
  title: string;
  subtitle: string;
  body: string;
  theme: 'neon' | 'dark' | 'clean' | 'gradient' | 'emerald' | 'sunset';
  transition: TransitionType;
  transitionSpeed: 'fast' | 'normal' | 'slow';
  titleAnimation: ElementAnimation;
  subtitleAnimation: ElementAnimation;
  bodyAnimation: ElementAnimation;
  bulletPoints?: string[];
  leftColumn?: string;
  rightColumn?: string;
  statNumber?: string;
  statLabel?: string;
  speakerNotes?: string;
  elements?: SlideElement[];
}

interface KeynoteAppProps {
  initialFileId?: string;
  initialFileName?: string;
}

export const KeynoteApp: React.FC<KeynoteAppProps> = ({ initialFileId, initialFileName }) => {
  const { files, updateFile, createFile, settings, notify } = useOS();

  // Find file from OS or default
  const activeFile = files.find(f => f.id === initialFileId) || files.find(f => f.name.endsWith('.key') || f.name.endsWith('.pptx'));
  const [fileId, setFileId] = useState<string>(activeFile?.id || 'new-deck');
  const [deckTitle, setDeckTitle] = useState<string>(initialFileName || activeFile?.name || 'Studio Product Launch Keynote.key');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Dynamic Preview Engine State
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isPreviewRunning, setIsPreviewRunning] = useState<boolean>(false);

  // File open modal & inspectors
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [showLayoutModal, setShowLayoutModal] = useState<boolean>(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState<boolean>(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);

  // Initial Slides
  const defaultSlides: Slide[] = [
    {
      id: 's1',
      layout: 'title',
      title: 'NebulaOS Desktop Pro',
      subtitle: 'The Next-Generation Desktop OS for High-Performance Creatives',
      body: 'Designed for silicon-level cooling efficiency, dynamic thermal curves, and zero-latency creative production pipelines.',
      theme: 'neon',
      transition: 'zoom',
      transitionSpeed: 'normal',
      titleAnimation: 'fade-up',
      subtitleAnimation: 'fly-left',
      bodyAnimation: 'fade-up',
      bulletPoints: ['Apple M3 Ultra 24-Core Support', 'Proactive Fan Throttling Guard (5,800 RPM)', 'Direct Google Drive Synchronization'],
      speakerNotes: 'Welcome the team and introduce the primary vision: minimal modular OS running directly in the browser.'
    },
    {
      id: 's2',
      layout: 'two-column',
      title: 'Hardware Acceleration & Dual 5K Master',
      subtitle: 'Multi-Monitor Pipeline Configuration',
      body: 'Calibrated P3 Wide Color gamut on Apple Studio Display with seamless HDR video color grading preview.',
      theme: 'dark',
      transition: 'slide-left',
      transitionSpeed: 'normal',
      titleAnimation: 'fade-up',
      subtitleAnimation: 'fly-right',
      bodyAnimation: 'zoom-in',
      leftColumn: 'Rendering Engine:\n• Cycles 4.0 Raytracing\n• Metal GPU compute nodes\n• 4K ProMotion 120Hz display',
      rightColumn: 'Thermal Architecture:\n• Adaptive fan RPM curve\n• Sub-70°C sustained load\n• Zero throttling under heavy batch render',
      speakerNotes: 'Demonstrate live thermal management graph in Activity Monitor.'
    },
    {
      id: 's3',
      layout: 'stat',
      title: 'Performance Benchmarks',
      subtitle: 'Zero Overhead Google Workspace Integration',
      body: 'Direct file synchronization to personal Google Drive with local offline caching.',
      statNumber: '10x Faster',
      statLabel: 'Asset loading and delta cloud synchronization speed',
      theme: 'emerald',
      transition: 'cube',
      transitionSpeed: 'slow',
      titleAnimation: 'fade-up',
      subtitleAnimation: 'fade-up',
      bodyAnimation: 'bounce',
      speakerNotes: 'Highlight that files live directly in the user’s Google Drive without host server storage costs.'
    },
    {
      id: 's4',
      layout: 'bullets',
      title: 'Integrated Office & Creative Suite',
      subtitle: 'Everything You Need in One Unified Workspace',
      body: 'Seamless file creation, inline editing, and collaborative teamwork.',
      theme: 'sunset',
      transition: 'fade',
      transitionSpeed: 'normal',
      titleAnimation: 'fly-left',
      subtitleAnimation: 'fade-up',
      bodyAnimation: 'fly-left',
      bulletPoints: [
        'Word & Google Docs: Rich text formatting & real-time collaboration',
        'Excel & Google Sheets: Complex formula engine, charts & CSV export',
        'Keynote & PowerPoint: Interactive slide decks with 3D transitions & animations',
        'Safari Pro: Persistent multi-tab browsing & proxy bypass engine',
        'YouTube Pro: Hardware-accelerated HD streaming with working search'
      ],
      speakerNotes: 'Wrap up with next steps and invite questions.'
    }
  ];

  const [slides, setSlides] = useState<Slide[]>(() => {
    if (activeFile?.content) {
      try {
        const parsed = JSON.parse(activeFile.content);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return defaultSlides;
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlayingPresentation, setIsPlayingPresentation] = useState(false);
  const [laserPointerActive, setLaserPointerActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });

  const currentSlide = slides[currentSlideIndex] || slides[0];

  // Trigger dynamic preview engine
  const triggerDynamicPreview = () => {
    setIsPreviewRunning(true);
    setPreviewKey(prev => prev + 1);
    const durationMs = currentSlide.transitionSpeed === 'fast' ? 350 : currentSlide.transitionSpeed === 'slow' ? 1200 : 700;
    setTimeout(() => {
      setIsPreviewRunning(false);
    }, durationMs + 800);
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!isPlayingPresentation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentSlideIndex < slides.length - 1) {
          setCurrentSlideIndex(prev => prev + 1);
          setPreviewKey(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex(prev => prev - 1);
          setPreviewKey(prev => prev + 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPlayingPresentation(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingPresentation, slides.length, currentSlideIndex]);

  const handleAddSlide = (layout: SlideLayoutType = 'bullets') => {
    const newSlide: Slide = {
      id: `s-${Date.now()}`,
      layout,
      title: layout === 'title' ? 'New Deck Presentation' : 'New Presentation Slide',
      subtitle: 'Presentation Subtitle & Vision',
      body: 'Click any text or element to edit this slide.',
      theme: currentSlide.theme || 'dark',
      transition: 'slide-left',
      transitionSpeed: 'normal',
      titleAnimation: 'fade-up',
      subtitleAnimation: 'fade-up',
      bodyAnimation: 'fade-up',
      bulletPoints: ['First key milestone or metric', 'Second tactical production goal', 'Third delivery result'],
      leftColumn: 'Primary Pillar\n• Focus item 1\n• Focus item 2',
      rightColumn: 'Secondary Pillar\n• Strategy point A\n• Strategy point B',
      statNumber: '99.9%',
      statLabel: 'Target metric performance efficiency',
      speakerNotes: 'Add your presenter notes here.'
    };
    const next = [...slides, newSlide];
    setSlides(next);
    setCurrentSlideIndex(next.length - 1);
    setIsSaved(false);
    setShowLayoutModal(false);
    setPreviewKey(prev => prev + 1);
    notify('Slide Added', `Added slide #${next.length} with ${layout} layout.`, 'info');
  };

  const handleDuplicateSlide = () => {
    const clone: Slide = {
      ...currentSlide,
      id: `s-${Date.now()}`,
      title: `${currentSlide.title} (Copy)`
    };
    const next = [...slides];
    next.splice(currentSlideIndex + 1, 0, clone);
    setSlides(next);
    setCurrentSlideIndex(currentSlideIndex + 1);
    setIsSaved(false);
    setPreviewKey(prev => prev + 1);
    notify('Slide Duplicated', 'Duplicated active slide.', 'info');
  };

  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length === 1) return;
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setCurrentSlideIndex(Math.max(0, idx - 1));
    setIsSaved(false);
    setPreviewKey(prev => prev + 1);
    notify('Slide Removed', 'Slide deleted from presentation deck.', 'info');
  };

  const handleUpdateSlide = (key: keyof Slide, value: any) => {
    setSlides(prev => prev.map((s, i) => i === currentSlideIndex ? { ...s, [key]: value } : s));
    setIsSaved(false);
  };

  const handleSaveToDrive = () => {
    const content = JSON.stringify(slides, null, 2);
    if (fileId && files.some(f => f.id === fileId)) {
      updateFile(fileId, { content, name: deckTitle });
    } else {
      createFile({
        name: deckTitle,
        path: `/Google Drive/${deckTitle}`,
        type: 'presentation',
        size: `${Math.round(content.length / 1024 * 10) / 10 || 2.4} KB`,
        content,
        tags: ['drive', 'presentation', 'keynote'],
        isCloudSynced: true,
        isOfflineAvailable: true
      });
    }
    setIsSaved(true);
    notify('Saved to Google Drive', `${deckTitle} synchronized with cloud backup.`, 'sync');
  };

  const handleDownloadDeck = () => {
    const deckContent = JSON.stringify(slides, null, 2);
    const blob = new Blob([deckContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = deckTitle.endsWith('.key') || deckTitle.endsWith('.pptx') ? deckTitle : `${deckTitle}.key`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Deck Exported', `Downloaded ${a.download}`, 'info');
  };

  // Open existing presentation from OS files
  const handleOpenFile = (f: any) => {
    setFileId(f.id);
    setDeckTitle(f.name);
    if (f.content) {
      try {
        const parsed = JSON.parse(f.content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
          setCurrentSlideIndex(0);
          setPreviewKey(prev => prev + 1);
        }
      } catch {}
    }
    setShowOpenModal(false);
    setIsSaved(true);
    notify('Presentation Loaded', `Opened ${f.name}`, 'info');
  };

  const getSlideThemeStyles = (theme: Slide['theme']) => {
    switch (theme) {
      case 'neon':
        return 'bg-gradient-to-br from-neutral-950 via-indigo-950 to-neutral-900 text-white border-indigo-500/30';
      case 'gradient':
        return 'bg-gradient-to-br from-violet-900 via-purple-900 to-rose-900 text-white border-purple-500/30';
      case 'emerald':
        return 'bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white border-emerald-500/30';
      case 'sunset':
        return 'bg-gradient-to-br from-neutral-950 via-rose-950 to-amber-950 text-white border-amber-500/30';
      case 'clean':
        return 'bg-neutral-100 text-neutral-900 border-neutral-300';
      default:
        return 'bg-neutral-900 text-white border-white/10';
    }
  };

  const getTransitionDuration = (speed: Slide['transitionSpeed']) => {
    switch (speed) {
      case 'fast': return '0.35s';
      case 'slow': return '1.1s';
      default: return '0.6s';
    }
  };

  const getSlideTransitionStyle = (transition: TransitionType, speed: Slide['transitionSpeed']): React.CSSProperties => {
    if (transition === 'none') return {};
    const duration = getTransitionDuration(speed);
    return {
      animation: `keynote-${transition} ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`,
    };
  };

  const getElementAnimationStyle = (anim: ElementAnimation | undefined, delaySec: number = 0.2): React.CSSProperties => {
    if (!anim || anim === 'none') return {};
    return {
      animation: `elem-${anim} 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delaySec}s both`,
    };
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs relative ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes keynote-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes keynote-slide-left {
          0% { transform: translate3d(100%, 0, 0); opacity: 0; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes keynote-slide-right {
          0% { transform: translate3d(-100%, 0, 0); opacity: 0; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes keynote-zoom {
          0% { transform: scale3d(0.35, 0.35, 1) rotate(-3deg); opacity: 0; }
          100% { transform: scale3d(1, 1, 1) rotate(0deg); opacity: 1; }
        }
        @keyframes keynote-flip {
          0% { transform: perspective(1000px) rotateY(90deg) scale(0.85); opacity: 0; }
          100% { transform: perspective(1000px) rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes keynote-wipe {
          0% { clip-path: inset(0 100% 0 0); opacity: 0.6; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        @keyframes keynote-cube {
          0% { transform: perspective(1200px) rotateY(-50deg) translateZ(-150px); opacity: 0.1; }
          100% { transform: perspective(1200px) rotateY(0deg) translateZ(0); opacity: 1; }
        }
        @keyframes keynote-revolve {
          0% { transform: perspective(900px) rotateX(45deg) scale(0.75); opacity: 0; }
          100% { transform: perspective(900px) rotateX(0deg) scale(1); opacity: 1; }
        }
        @keyframes keynote-drop {
          0% { transform: translate3d(0, -90px, 0) scale(0.88); opacity: 0; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
        }

        /* Element Entrance Keyframes */
        @keyframes elem-fade-up {
          0% { opacity: 0; transform: translate3d(0, 26px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes elem-fly-left {
          0% { opacity: 0; transform: translate3d(-36px, 0, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes elem-fly-right {
          0% { opacity: 0; transform: translate3d(36px, 0, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes elem-bounce {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 0.95; transform: scale(1.08); }
          75% { transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes elem-zoom-in {
          0% { opacity: 0; transform: scale(0.65); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes elem-pop {
          0% { opacity: 0; transform: rotate(-5deg) scale(0.8); }
          100% { opacity: 1; transform: rotate(0deg) scale(1); }
        }
        @keyframes elem-shimmer {
          0% { filter: brightness(1.7) drop-shadow(0 0 16px rgba(245, 158, 11, 0.7)); }
          100% { filter: brightness(1) drop-shadow(0 0 0 transparent); }
        }
      `}</style>

      {/* Top PowerPoint / Keynote Pro Command Bar */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/80 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-sm flex items-center justify-center">
            <Presentation className="w-4 h-4" />
          </div>

          {/* Title Editor */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={deckTitle}
              onChange={(e) => { setDeckTitle(e.target.value); setIsSaved(false); }}
              className={`font-semibold text-xs px-2 py-1 rounded border border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-amber-500 bg-transparent outline-none w-52 ${
                settings.theme === 'dark' ? 'text-neutral-100' : 'text-neutral-800'
              }`}
            />
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
              Keynote &amp; PowerPoint Pro
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
              isSaved ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10 animate-pulse'
            }`}>
              {isSaved ? 'Drive Synced' : 'Unsaved Changes'}
            </span>
          </div>

          <div className="w-[1px] h-5 bg-white/10"></div>

          {/* Quick Insert Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleAddSlide('bullets')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors font-semibold text-xs"
              title="Add new slide"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Slide</span>
            </button>

            <button
              onClick={() => setShowLayoutModal(true)}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors text-xs opacity-80 hover:opacity-100"
              title="Change slide layout template"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Layout</span>
            </button>

            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors text-xs opacity-80 hover:opacity-100"
              title="Open presentation from files"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open</span>
            </button>
          </div>
        </div>

        {/* Right Action Controls: Dynamic Preview, Present, Save */}
        <div className="flex items-center space-x-2">
          {/* Dynamic Preview Trigger */}
          <button
            onClick={triggerDynamicPreview}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all shadow-sm ${
              isPreviewRunning
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
            }`}
            title="Preview slide transition and element animations"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isPreviewRunning ? 'animate-spin' : ''}`} />
            <span>Dynamic Preview</span>
          </button>

          {/* Animations & Transitions Drawer Toggle */}
          <button
            onClick={() => setShowAnimationPanel(!showAnimationPanel)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              showAnimationPanel 
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                : 'border-white/10 hover:bg-white/10'
            }`}
            title="Slide transitions and element animations inspector"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Animations</span>
          </button>

          {/* Theme Selector */}
          <select
            value={currentSlide.theme}
            onChange={(e) => handleUpdateSlide('theme', e.target.value as any)}
            className={`px-2 py-1.5 rounded-md border text-xs outline-none ${
              settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
            }`}
          >
            <option value="neon">Neon Studio</option>
            <option value="dark">Cinematic Dark</option>
            <option value="gradient">Purple Gradient</option>
            <option value="emerald">Emerald Pro</option>
            <option value="sunset">Sunset Amber</option>
            <option value="clean">Minimal Clean</option>
          </select>

          {/* Save to Drive */}
          <button
            onClick={handleSaveToDrive}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors font-medium text-xs"
            title="Save to Google Drive"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Download Deck */}
          <button
            onClick={handleDownloadDeck}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors font-medium text-xs"
            title="Export PowerPoint / Keynote deck"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Present Slideshow */}
          <button
            onClick={() => {
              setIsPlayingPresentation(true);
              setPreviewKey(prev => prev + 1);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-md transition-all active:scale-95"
            title="Play fullscreen presentation slideshow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Present</span>
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails List */}
        <div className={`w-52 border-r p-3 overflow-y-auto space-y-3 ${
          settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
        }`}>
          <div className="flex justify-between items-center text-[10px] font-semibold opacity-60 uppercase tracking-wider mb-2">
            <span>Slides ({slides.length})</span>
            <button
              onClick={() => handleAddSlide('bullets')}
              className="p-1 rounded hover:bg-white/10 text-amber-400"
              title="Add slide"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => {
                setCurrentSlideIndex(idx);
                setPreviewKey(prev => prev + 1);
              }}
              className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col space-y-1 relative group ${
                currentSlideIndex === idx
                  ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg scale-[1.02] bg-amber-500/10'
                  : 'border-white/10 hover:border-white/30 bg-black/10 dark:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] opacity-60 mb-1">
                <span className="font-mono font-bold">#{idx + 1}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 font-mono capitalize">
                  {s.transition}
                </span>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteSlide(idx, e)}
                    className="p-0.5 rounded hover:bg-rose-500/20 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete slide"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Mini Slide Preview */}
              <div className={`h-20 rounded-lg p-2 flex flex-col justify-center border border-white/10 overflow-hidden ${getSlideThemeStyles(s.theme)}`}>
                <span className="font-bold text-[10px] truncate">{s.title}</span>
                <span className="text-[8px] opacity-70 truncate mt-0.5">{s.subtitle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Center: Interactive Slide Stage with Dynamic Preview */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-black/20 dark:bg-black/60 overflow-y-auto relative">
          
          {/* Dynamic Preview Engine Floating Control Pill */}
          <div className="mb-4 flex items-center space-x-3 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-white/15 shadow-xl text-white backdrop-blur z-10">
            <span className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Preview Engine</span>
            </span>
            <div className="w-[1px] h-3.5 bg-white/20"></div>

            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] opacity-70">Transition:</span>
              <select
                value={currentSlide.transition}
                onChange={(e) => {
                  handleUpdateSlide('transition', e.target.value as TransitionType);
                  triggerDynamicPreview();
                }}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-[11px] outline-none text-white"
              >
                <option value="fade">Dissolve (Fade)</option>
                <option value="slide-left">Push Left</option>
                <option value="slide-right">Push Right</option>
                <option value="zoom">Zoom 3D</option>
                <option value="flip">Flip Card</option>
                <option value="wipe">Wipe</option>
                <option value="cube">Cube 3D</option>
                <option value="revolve">Revolve</option>
                <option value="drop">Drop In</option>
                <option value="none">Instant</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] opacity-70">Speed:</span>
              <select
                value={currentSlide.transitionSpeed}
                onChange={(e) => {
                  handleUpdateSlide('transitionSpeed', e.target.value as any);
                  triggerDynamicPreview();
                }}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-[11px] outline-none text-white"
              >
                <option value="fast">Fast (0.35s)</option>
                <option value="normal">Normal (0.6s)</option>
                <option value="slow">Cinematic (1.1s)</option>
              </select>
            </div>

            <button
              onClick={triggerDynamicPreview}
              className="px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
            >
              <RotateCw className={`w-3 h-3 ${isPreviewRunning ? 'animate-spin' : ''}`} />
              <span>Replay</span>
            </button>
          </div>

          {/* Active Slide Stage Viewport with Dynamic CSS Keyframes Transition & Element Animations */}
          <div 
            key={`${currentSlide.id}-${previewKey}`}
            style={getSlideTransitionStyle(currentSlide.transition, currentSlide.transitionSpeed)}
            className={`w-full max-w-3xl aspect-[16/9] rounded-2xl shadow-2xl border p-12 flex flex-col justify-between overflow-hidden relative ${getSlideThemeStyles(currentSlide.theme)}`}
          >
            {/* Top Area: Title & Subtitle with Element Animations */}
            <div className="space-y-3">
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => handleUpdateSlide('title', e.target.value)}
                placeholder="Click to add slide title..."
                style={getElementAnimationStyle(currentSlide.titleAnimation, 0.1)}
                className="w-full bg-transparent font-black text-2xl md:text-3xl tracking-tight outline-none border-b border-transparent hover:border-white/20 focus:border-amber-400 pb-1"
              />

              <input
                type="text"
                value={currentSlide.subtitle}
                onChange={(e) => handleUpdateSlide('subtitle', e.target.value)}
                placeholder="Click to add subtitle or description..."
                style={getElementAnimationStyle(currentSlide.subtitleAnimation, 0.25)}
                className="w-full bg-transparent text-sm opacity-75 outline-none border-b border-transparent hover:border-white/20 focus:border-amber-400 pb-1"
              />
            </div>

            {/* Layout Specific Dynamic Body Content with Staggered Element Animations */}
            <div className="flex-1 my-6 flex flex-col justify-center">
              {currentSlide.layout === 'title' && (
                <textarea
                  rows={3}
                  value={currentSlide.body}
                  onChange={(e) => handleUpdateSlide('body', e.target.value)}
                  placeholder="Introductory body text..."
                  style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.35)}
                  className="w-full bg-transparent text-sm leading-relaxed opacity-85 outline-none resize-none"
                />
              )}

              {currentSlide.layout === 'bullets' && (
                <div className="space-y-2.5">
                  {(currentSlide.bulletPoints || []).map((bp, bpIdx) => (
                    <div 
                      key={bpIdx} 
                      style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.3 + bpIdx * 0.12)}
                      className="flex items-center space-x-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                      <input
                        type="text"
                        value={bp}
                        onChange={(e) => {
                          const nextBp = [...(currentSlide.bulletPoints || [])];
                          nextBp[bpIdx] = e.target.value;
                          handleUpdateSlide('bulletPoints', nextBp);
                        }}
                        className="w-full bg-transparent text-xs sm:text-sm outline-none border-b border-transparent hover:border-white/10 focus:border-amber-400"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const nextBp = [...(currentSlide.bulletPoints || []), 'New key milestone or metric...'];
                      handleUpdateSlide('bulletPoints', nextBp);
                    }}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 pt-1 opacity-80"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bullet Point</span>
                  </button>
                </div>
              )}

              {currentSlide.layout === 'two-column' && (
                <div className="grid grid-cols-2 gap-6">
                  <div 
                    style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.3)}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col"
                  >
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Column 1</span>
                    <textarea
                      rows={4}
                      value={currentSlide.leftColumn || ''}
                      onChange={(e) => handleUpdateSlide('leftColumn', e.target.value)}
                      className="w-full bg-transparent text-xs leading-relaxed outline-none resize-none font-sans"
                    />
                  </div>
                  <div 
                    style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.45)}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col"
                  >
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Column 2</span>
                    <textarea
                      rows={4}
                      value={currentSlide.rightColumn || ''}
                      onChange={(e) => handleUpdateSlide('rightColumn', e.target.value)}
                      className="w-full bg-transparent text-xs leading-relaxed outline-none resize-none font-sans"
                    />
                  </div>
                </div>
              )}

              {currentSlide.layout === 'stat' && (
                <div className="flex flex-col items-center text-center space-y-2 py-4">
                  <input
                    type="text"
                    value={currentSlide.statNumber || '10x'}
                    onChange={(e) => handleUpdateSlide('statNumber', e.target.value)}
                    style={getElementAnimationStyle(currentSlide.bodyAnimation || 'bounce', 0.3)}
                    className="font-black text-5xl md:text-6xl text-amber-400 bg-transparent text-center outline-none"
                  />
                  <input
                    type="text"
                    value={currentSlide.statLabel || 'Speed metric multiplier'}
                    onChange={(e) => handleUpdateSlide('statLabel', e.target.value)}
                    style={getElementAnimationStyle(currentSlide.subtitleAnimation || 'fade-up', 0.45)}
                    className="font-semibold text-sm opacity-80 bg-transparent text-center outline-none w-full"
                  />
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="flex justify-between items-center text-[10px] opacity-60 border-t border-white/10 pt-4">
              <span className="font-mono">{deckTitle}</span>
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono">
                  {currentSlide.transition} ({currentSlide.transitionSpeed})
                </span>
                <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Stage Pagination Bar */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={() => {
                setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                setPreviewKey(prev => prev + 1);
              }}
              disabled={currentSlideIndex === 0}
              className={`p-2 rounded-xl border transition-colors ${
                currentSlideIndex > 0 ? 'hover:bg-white/10 bg-black/20 border-white/10' : 'opacity-30 cursor-not-allowed border-transparent'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs opacity-75">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => {
                setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1));
                setPreviewKey(prev => prev + 1);
              }}
              disabled={currentSlideIndex === slides.length - 1}
              className={`p-2 rounded-xl border transition-colors ${
                currentSlideIndex < slides.length - 1 ? 'hover:bg-white/10 bg-black/20 border-white/10' : 'opacity-30 cursor-not-allowed border-transparent'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Animations & Transitions Inspector Panel */}
        {showAnimationPanel && (
          <div className={`w-72 border-l p-4 flex flex-col space-y-4 overflow-y-auto animate-in slide-in-from-right-4 duration-200 ${
            settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-neutral-100/95 border-black/10'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="font-bold text-xs flex items-center gap-1.5 text-amber-500">
                <Zap className="w-3.5 h-3.5" />
                <span>Dynamic Animations</span>
              </span>
              <button onClick={() => setShowAnimationPanel(false)} className="hover:opacity-100 opacity-60">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Slide Transition Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold opacity-70 block">Slide 3D Transition</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'fade', label: 'Dissolve' },
                  { id: 'slide-left', label: 'Push Left' },
                  { id: 'slide-right', label: 'Push Right' },
                  { id: 'zoom', label: 'Zoom 3D' },
                  { id: 'flip', label: 'Flip Card' },
                  { id: 'wipe', label: 'Wipe' },
                  { id: 'cube', label: 'Cube 3D' },
                  { id: 'revolve', label: 'Revolve' },
                  { id: 'drop', label: 'Drop In' },
                  { id: 'none', label: 'Instant' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      handleUpdateSlide('transition', t.id);
                      triggerDynamicPreview();
                      notify('Transition Updated', `Applied ${t.label} to slide #${currentSlideIndex + 1}`, 'info');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                      currentSlide.transition === t.id
                        ? 'bg-amber-500 text-white border-amber-500 font-semibold'
                        : 'border-white/10 hover:bg-white/5 opacity-80'
                    }`}
                  >
                    <span>{t.label}</span>
                    {currentSlide.transition === t.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Element Animations Controls */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <label className="text-[11px] font-semibold opacity-70 block uppercase tracking-wider text-amber-400">
                Element Animations
              </label>

              {/* Title Animation */}
              <div>
                <span className="text-[10px] opacity-60 block mb-1">Title Entrance</span>
                <select
                  value={currentSlide.titleAnimation || 'fade-up'}
                  onChange={(e) => {
                    handleUpdateSlide('titleAnimation', e.target.value as ElementAnimation);
                    triggerDynamicPreview();
                  }}
                  className={`w-full px-2 py-1 rounded border text-xs outline-none ${
                    settings.theme === 'dark' ? 'bg-neutral-800 border-white/15' : 'bg-white border-black/15'
                  }`}
                >
                  <option value="fade-up">Fade Up</option>
                  <option value="fly-left">Fly from Left</option>
                  <option value="bounce">Bounce In</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="pop">Pop &amp; Settle</option>
                  <option value="none">None (Instant)</option>
                </select>
              </div>

              {/* Subtitle Animation */}
              <div>
                <span className="text-[10px] opacity-60 block mb-1">Subtitle Entrance</span>
                <select
                  value={currentSlide.subtitleAnimation || 'fade-up'}
                  onChange={(e) => {
                    handleUpdateSlide('subtitleAnimation', e.target.value as ElementAnimation);
                    triggerDynamicPreview();
                  }}
                  className={`w-full px-2 py-1 rounded border text-xs outline-none ${
                    settings.theme === 'dark' ? 'bg-neutral-800 border-white/15' : 'bg-white border-black/15'
                  }`}
                >
                  <option value="fade-up">Fade Up</option>
                  <option value="fly-right">Fly from Right</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="shimmer">Golden Shimmer</option>
                  <option value="none">None (Instant)</option>
                </select>
              </div>

              {/* Body / Bullets Animation */}
              <div>
                <span className="text-[10px] opacity-60 block mb-1">Content / Bullets Entrance</span>
                <select
                  value={currentSlide.bodyAnimation || 'fade-up'}
                  onChange={(e) => {
                    handleUpdateSlide('bodyAnimation', e.target.value as ElementAnimation);
                    triggerDynamicPreview();
                  }}
                  className={`w-full px-2 py-1 rounded border text-xs outline-none ${
                    settings.theme === 'dark' ? 'bg-neutral-800 border-white/15' : 'bg-white border-black/15'
                  }`}
                >
                  <option value="fade-up">Staggered Fade Up</option>
                  <option value="fly-left">Staggered Fly Left</option>
                  <option value="bounce">Staggered Bounce</option>
                  <option value="zoom-in">Staggered Zoom In</option>
                  <option value="none">None (Instant)</option>
                </select>
              </div>
            </div>

            {/* Duplicate / Slide Actions */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                onClick={handleDuplicateSlide}
                className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center space-x-2 text-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate Slide</span>
              </button>

              <button
                onClick={() => {
                  slides.forEach((_, idx) => {
                    handleUpdateSlide('transition', currentSlide.transition);
                    handleUpdateSlide('titleAnimation', currentSlide.titleAnimation);
                    handleUpdateSlide('subtitleAnimation', currentSlide.subtitleAnimation);
                    handleUpdateSlide('bodyAnimation', currentSlide.bodyAnimation);
                  });
                  notify('Applied to All', `Applied ${currentSlide.transition} and element animations to all ${slides.length} slides.`, 'info');
                }}
                className="w-full py-1.5 px-3 rounded-lg border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 transition-colors text-xs font-medium"
              >
                Apply Animations to All Slides
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Presentation Fullscreen Slideshow Mode */}
      {isPlayingPresentation && (
        <div 
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-8 cursor-none overflow-hidden select-none"
          onMouseMove={(e) => {
            if (laserPointerActive) {
              setLaserPos({ x: e.clientX, y: e.clientY });
            }
          }}
        >
          {/* Laser Pointer Glow Effect */}
          {laserPointerActive && (
            <div 
              className="fixed pointer-events-none z-50 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_6px_rgba(239,68,68,0.8)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
              style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
            />
          )}

          {/* Top Control Bar (reveals on hover at top) */}
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex justify-between items-center text-white/80 py-2 cursor-default">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-xs bg-red-600 px-2 py-0.5 rounded text-white font-mono">
                SLIDESHOW
              </span>
              <span className="font-semibold text-xs">{deckTitle}</span>
              <span className="text-[11px] opacity-60">Slide {currentSlideIndex + 1} of {slides.length}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLaserPointerActive(!laserPointerActive)}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                  laserPointerActive ? 'bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                <span>Laser Pointer</span>
              </button>

              <button
                onClick={() => setIsPlayingPresentation(false)}
                className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-medium"
              >
                Exit Slideshow (Esc)
              </button>
            </div>
          </div>

          {/* Presentation Slide Visual Stage with Keyframes Transition & Element Animations */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div 
              key={`slideshow-${currentSlide.id}-${previewKey}`}
              style={getSlideTransitionStyle(currentSlide.transition, currentSlide.transitionSpeed)}
              className={`w-full max-w-5xl aspect-[16/9] rounded-3xl shadow-2xl p-16 flex flex-col justify-between border ${getSlideThemeStyles(currentSlide.theme)}`}
            >
              <div className="space-y-3">
                <h1 
                  style={getElementAnimationStyle(currentSlide.titleAnimation, 0.1)}
                  className="text-4xl md:text-5xl font-black tracking-tight"
                >
                  {currentSlide.title}
                </h1>
                <p 
                  style={getElementAnimationStyle(currentSlide.subtitleAnimation, 0.25)}
                  className="text-lg opacity-75 font-medium"
                >
                  {currentSlide.subtitle}
                </p>
              </div>

              <div className="my-8 flex-1 flex flex-col justify-center">
                {currentSlide.layout === 'bullets' && (
                  <div className="space-y-4">
                    {(currentSlide.bulletPoints || []).map((bp, i) => (
                      <div 
                        key={i} 
                        style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.3 + i * 0.12)}
                        className="flex items-center space-x-4"
                      >
                        <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0"></span>
                        <span className="text-lg font-medium">{bp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlide.layout === 'two-column' && (
                  <div className="grid grid-cols-2 gap-8 text-base">
                    <div 
                      style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.3)}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 whitespace-pre-wrap leading-relaxed"
                    >
                      {currentSlide.leftColumn}
                    </div>
                    <div 
                      style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.45)}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 whitespace-pre-wrap leading-relaxed"
                    >
                      {currentSlide.rightColumn}
                    </div>
                  </div>
                )}

                {currentSlide.layout === 'stat' && (
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div 
                      style={getElementAnimationStyle(currentSlide.bodyAnimation || 'bounce', 0.3)}
                      className="text-7xl md:text-8xl font-black text-amber-400 drop-shadow-lg"
                    >
                      {currentSlide.statNumber}
                    </div>
                    <div 
                      style={getElementAnimationStyle(currentSlide.subtitleAnimation || 'fade-up', 0.45)}
                      className="text-xl font-medium opacity-80"
                    >
                      {currentSlide.statLabel}
                    </div>
                  </div>
                )}

                {currentSlide.layout === 'title' && (
                  <p 
                    style={getElementAnimationStyle(currentSlide.bodyAnimation, 0.35)}
                    className="text-xl leading-relaxed opacity-85 max-w-3xl"
                  >
                    {currentSlide.body}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-xs opacity-50 border-t border-white/10 pt-4">
                <span>NebulaOS Presentation Mode</span>
                <span>{currentSlideIndex + 1} / {slides.length}</span>
              </div>
            </div>
          </div>

          {/* Bottom Slideshow Navigation Controller */}
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex justify-center items-center space-x-6 py-2 cursor-default">
            <button
              onClick={() => {
                setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                setPreviewKey(prev => prev + 1);
              }}
              disabled={currentSlideIndex === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-white font-mono text-sm font-bold">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => {
                setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1));
                setPreviewKey(prev => prev + 1);
              }}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
              title="Next slide (Right Arrow / Space)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Layout Selection Modal */}
      {showLayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm">Select Slide Layout</h3>
              <button onClick={() => setShowLayoutModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'title', title: 'Title & Vision', desc: 'Large title with narrative body' },
                { id: 'bullets', title: 'Bullet Points', desc: 'Header with listed milestones' },
                { id: 'two-column', title: 'Two Columns', desc: 'Side-by-side comparison pillars' },
                { id: 'stat', title: 'Key Metric', desc: 'Giant stat number & callout' }
              ].map((l) => (
                <div
                  key={l.id}
                  onClick={() => handleAddSlide(l.id as SlideLayoutType)}
                  className="p-3 rounded-xl border border-white/10 hover:border-amber-500 hover:bg-amber-500/10 cursor-pointer transition-all"
                >
                  <div className="font-semibold text-xs">{l.title}</div>
                  <div className="text-[10px] opacity-60 mt-1">{l.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Open Existing Presentation File Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span>Open Presentation from Google Drive</span>
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
              {files.filter(f => f.type === 'presentation' || f.name.endsWith('.key') || f.name.endsWith('.pptx')).map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleOpenFile(f)}
                  className="p-3 hover:bg-white/5 cursor-pointer rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Presentation className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="font-semibold text-xs">{f.name}</div>
                      <div className="text-[10px] opacity-60">{f.path} • {f.size}</div>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-semibold">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
