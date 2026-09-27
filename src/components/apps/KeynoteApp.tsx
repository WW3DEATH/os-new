import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { jsPDF } from 'jspdf';
import { GoogleDriveService } from '../../services/googleDrive';
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
  ChevronDown,
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
  ArrowRight,
  Loader2,
  Printer,
  FileDown,
  Upload,
  Sun,
  HardDrive
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
  brightness?: number; // 50 to 150
  contrast?: number; // 50 to 150
  filter?: 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'warm' | 'cool';
  rotation?: number; // 0, 90, 180, 270
  borderRadius?: 'square' | 'rounded' | 'circle';
  size?: 'sm' | 'md' | 'lg' | 'full';
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

  // Find file from OS if explicitly specified, otherwise start with a brand new presentation
  const activeFile = initialFileId ? files.find(f => f.id === initialFileId) : null;
  const [fileId, setFileId] = useState<string>(activeFile?.id || `deck-${Date.now()}`);
  const [deckTitle, setDeckTitle] = useState<string>(initialFileName || activeFile?.name || 'Untitled Presentation.pptx');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Dynamic Preview Engine State
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [isPreviewRunning, setIsPreviewRunning] = useState<boolean>(false);

  // Image upload & editing state
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [selectedImageElementId, setSelectedImageElementId] = useState<string | null>(null);

  // Animated Slide Switch State
  const [switchDirection, setSwitchDirection] = useState<'next' | 'prev' | 'none'>('none');
  const [switchAnimMode, setSwitchAnimMode] = useState<'slide' | 'transition' | 'morph'>('slide');

  // Export Menu & Modal State
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; text: string } | null>(null);
  const [exportOptions, setExportOptions] = useState<{
    format: 'pdf' | 'png' | 'jpeg';
    resolution: '1080p' | '4k';
    scope: 'all' | 'current';
    includeSlideNumbers: boolean;
  }>({
    format: 'pdf',
    resolution: '1080p',
    scope: 'all',
    includeSlideNumbers: true
  });
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // File open modal & inspectors
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [showLayoutModal, setShowLayoutModal] = useState<boolean>(false);
  const [showAnimationPanel, setShowAnimationPanel] = useState<boolean>(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);

  // Default clean slide for all new presentation decks
  const cleanNewSlides: Slide[] = [
    {
      id: 'slide-1',
      layout: 'title',
      title: 'Untitled Presentation',
      subtitle: 'Click to edit subtitle or add description',
      body: 'Start creating your slides, customize transitions, or upload images from your laptop.',
      theme: 'neon',
      transition: 'morph',
      transitionSpeed: 'normal',
      titleAnimation: 'fade-up',
      subtitleAnimation: 'fly-left',
      bodyAnimation: 'fade-up',
      bulletPoints: [],
      elements: []
    }
  ];

  const [slides, setSlides] = useState<Slide[]>(() => {
    if (activeFile?.content) {
      try {
        const parsed = JSON.parse(activeFile.content);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return cleanNewSlides;
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [prevSlide, setPrevSlide] = useState<Slide | null>(null);
  const [isPlayingPresentation, setIsPlayingPresentation] = useState(false);
  const [laserPointerActive, setLaserPointerActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });

  const currentSlide = slides[currentSlideIndex] || slides[0];

  // Upload image from laptop to current slide
  const handleAddImageFromLaptop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Invalid File', 'Please upload a PNG, JPG, WEBP, GIF, or SVG image.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newImgElem: SlideElement = {
          id: `elem-img-${Date.now()}`,
          type: 'image',
          content: event.target.result as string,
          animation: 'zoom-in',
          brightness: 100,
          contrast: 100,
          filter: 'none',
          rotation: 0,
          borderRadius: 'rounded',
          size: 'md'
        };
        const currentElements = currentSlide.elements || [];
        handleUpdateSlide('elements', [...currentElements, newImgElem]);
        setSelectedImageElementId(newImgElem.id);
        setIsSaved(false);
        notify('Image Added', `${file.name} added to slide. Click image to edit properties.`, 'info');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpdateImageElement = (elemId: string, updates: Partial<SlideElement>) => {
    const updated = (currentSlide.elements || []).map(el => el.id === elemId ? { ...el, ...updates } : el);
    handleUpdateSlide('elements', updated);
    setIsSaved(false);
  };

  const handleDeleteImageElement = (elemId: string) => {
    const updated = (currentSlide.elements || []).filter(el => el.id !== elemId);
    handleUpdateSlide('elements', updated);
    if (selectedImageElementId === elemId) setSelectedImageElementId(null);
    setIsSaved(false);
    notify('Image Removed', 'Image removed from slide.', 'info');
  };

  // Trigger dynamic preview engine
  const triggerDynamicPreview = () => {
    setIsPreviewRunning(true);
    setPreviewKey(prev => prev + 1);
    const durationMs = currentSlide.transitionSpeed === 'fast' ? 350 : currentSlide.transitionSpeed === 'slow' ? 1200 : 700;
    setTimeout(() => {
      setIsPreviewRunning(false);
    }, durationMs + 800);
  };

  // Animated Slide Switch Helper
  const switchSlide = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= slides.length || targetIndex === currentSlideIndex) return;
    const dir = targetIndex > currentSlideIndex ? 'next' : 'prev';
    setPrevSlide(slides[currentSlideIndex]);
    setSwitchDirection(dir);
    setCurrentSlideIndex(targetIndex);
    setPreviewKey(prev => prev + 1);
  };

  // Close Export Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard Navigation (for presentation mode & regular stage when not in text input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      if (isPlayingPresentation) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          if (currentSlideIndex < slides.length - 1) {
            switchSlide(currentSlideIndex + 1);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          if (currentSlideIndex > 0) {
            switchSlide(currentSlideIndex - 1);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsPlayingPresentation(false);
        }
      } else if (!isInputFocused && !showLayoutModal && !showOpenModal && !showExportModal) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          if (currentSlideIndex < slides.length - 1) {
            e.preventDefault();
            switchSlide(currentSlideIndex + 1);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          if (currentSlideIndex > 0) {
            e.preventDefault();
            switchSlide(currentSlideIndex - 1);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingPresentation, slides.length, currentSlideIndex, showLayoutModal, showOpenModal, showExportModal]);

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

  const handleSaveToDrive = async () => {
    const content = JSON.stringify(slides, null, 2);
    // 1. Update OS local state & RTDB
    if (fileId && files.some(f => f.id === fileId)) {
      updateFile(fileId, { content, name: deckTitle });
    } else {
      createFile({
        name: deckTitle,
        path: `/Google Drive/${deckTitle}`,
        type: 'presentation',
        size: `${Math.round(content.length / 1024 * 10) / 10 || 2.4} KB`,
        content,
        tags: ['drive', 'presentation', 'keynote', 'powerpoint'],
        isCloudSynced: true,
        isOfflineAvailable: true
      });
    }

    // 2. Real Google Drive direct upload to user's private folder
    if (GoogleDriveService.isConnected()) {
      try {
        notify('Saving to Private Drive', `Uploading ${deckTitle} to private folder 'NebulaOS Workstation'...`, 'sync');
        await GoogleDriveService.saveFileToDrive({
          name: deckTitle,
          content,
          mimeType: 'application/json',
          description: 'PowerPoint & Keynote presentation deck created in NebulaOS Workstation'
        });
        setIsSaved(true);
        notify('Saved to Private Drive', `${deckTitle} saved directly in your private Google Drive folder ('NebulaOS Workstation')!`, 'sync');
        return;
      } catch (err: any) {
        console.warn('Real Google Drive upload notice:', err);
        notify('Saved to Cloud OS', `Deck saved in Cloud OS. (Drive note: ${err?.message || 'Ready'})`, 'info');
      }
    } else {
      notify('Saved to Cloud OS', `${deckTitle} saved. Sign in with Google to sync to your personal Google Drive.`, 'sync');
    }
    setIsSaved(true);
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
    setShowExportMenu(false);
  };

  // Canvas Drawing Utilities for High-Fidelity PDF & Image Export
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: boolean,
    stroke: boolean
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number => {
    if (!text) return 0;
    const paragraphs = text.split('\n');
    let currentY = y;
    let totalLines = 0;

    paragraphs.forEach((paragraph) => {
      const words = paragraph.split(' ');
      let line = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
          totalLines++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, currentY);
      currentY += lineHeight;
      totalLines++;
    });

    return totalLines;
  };

  const createSlideCanvas = (
    slide: Slide,
    index: number,
    total: number,
    title: string,
    width: number = 1920,
    height: number = 1080,
    includeSlideNumber: boolean = true
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background Theme Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (slide.theme === 'neon') {
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
    } else if (slide.theme === 'dark') {
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.5, '#090d16');
      grad.addColorStop(1, '#030712');
    } else if (slide.theme === 'gradient') {
      grad.addColorStop(0, '#4c1d95');
      grad.addColorStop(0.5, '#581c87');
      grad.addColorStop(1, '#881337');
    } else if (slide.theme === 'emerald') {
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#064e3b');
      grad.addColorStop(1, '#020617');
    } else if (slide.theme === 'sunset') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#4c0519');
      grad.addColorStop(1, '#451a03');
    } else {
      // clean theme
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient lighting glows for high-tech aesthetic
    if (slide.theme !== 'clean') {
      const glow1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 0, width * 0.85, height * 0.15, width * 0.45);
      glow1.addColorStop(0, slide.theme === 'emerald' ? 'rgba(16, 185, 129, 0.22)' : slide.theme === 'gradient' ? 'rgba(217, 70, 239, 0.22)' : 'rgba(99, 102, 241, 0.22)');
      glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 0, width * 0.15, height * 0.85, width * 0.35);
      glow2.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
      glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);
    }

    const isLight = slide.theme === 'clean';
    const textColor = isLight ? '#0f172a' : '#ffffff';
    const textMuted = isLight ? '#475569' : 'rgba(255, 255, 255, 0.75)';
    const accentColor = '#f59e0b'; // amber-500

    // Header Deck Title
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = textMuted;
    ctx.fillText(title.replace(/\.[^/.]+$/, "").toUpperCase(), 120, 110);

    // Slide Number Pill in Top Right
    if (includeSlideNumber) {
      const slidePillText = `SLIDE ${index + 1} / ${total}`;
      ctx.font = 'bold 22px monospace';
      const pillW = ctx.measureText(slidePillText).width + 36;
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)';
      roundRect(ctx, width - 120 - pillW, 80, pillW, 44, 22, true, false);
      ctx.fillStyle = accentColor;
      ctx.fillText(slidePillText, width - 120 - pillW + 18, 110);
    }

    // Top Accent Divider Line
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
    ctx.fillRect(120, 140, width - 240, 2);

    // Main Slide Title
    ctx.fillStyle = textColor;
    ctx.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    wrapText(ctx, slide.title, 120, 240, width - 240, 78);

    // Subtitle
    ctx.fillStyle = textMuted;
    ctx.font = '500 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    wrapText(ctx, slide.subtitle, 120, 335, width - 240, 44);

    // Layout Specific Body Content
    if (slide.layout === 'title') {
      ctx.fillStyle = textColor;
      ctx.font = '400 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      wrapText(ctx, slide.body, 120, 480, width - 240, 52);
    } else if (slide.layout === 'bullets') {
      const points = slide.bulletPoints || [];
      let startY = 460;
      points.forEach((pt) => {
        // Bullet dot
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(140, startY - 10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Bullet text
        ctx.fillStyle = textColor;
        ctx.font = '500 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const linesDrawn = wrapText(ctx, pt, 175, startY, width - 320, 46);
        startY += Math.max(70, linesDrawn * 48 + 24);
      });
    } else if (slide.layout === 'two-column') {
      const colW = (width - 240 - 60) / 2;
      const colH = 460;
      const colY = 420;

      // Pillar Card 1
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      roundRect(ctx, 120, colY, colW, colH, 24, true, true);

      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('PILLAR 01', 160, colY + 55);

      ctx.font = '400 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = textColor;
      wrapText(ctx, slide.leftColumn || '', 160, colY + 115, colW - 80, 42);

      // Pillar Card 2
      roundRect(ctx, 120 + colW + 60, colY, colW, colH, 24, true, true);
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('PILLAR 02', 120 + colW + 100, colY + 55);

      ctx.font = '400 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = textColor;
      wrapText(ctx, slide.rightColumn || '', 120 + colW + 100, colY + 115, colW - 80, 42);
    } else if (slide.layout === 'stat') {
      // Big Stat Number
      ctx.font = '900 160px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'center';
      ctx.fillText(slide.statNumber || '10x', width / 2, 580);

      // Stat Label
      ctx.font = '500 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = textColor;
      ctx.fillText(slide.statLabel || 'Target Metric Performance', width / 2, 670);
      ctx.textAlign = 'left';
    }

    // Slide Bottom Metadata & Footer
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
    ctx.fillRect(120, height - 100, width - 240, 1.5);

    ctx.font = '500 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = textMuted;
    ctx.fillText('NebulaOS Keynote Pro • Confidential Presentation Deck', 120, height - 60);

    const formatText = `16:9 • High-Definition Presentation • ${slide.theme.toUpperCase()}`;
    const fWidth = ctx.measureText(formatText).width;
    ctx.fillText(formatText, width - 120 - fWidth, height - 60);

    return canvas;
  };

  // Export Entire Presentation or Selection to PDF
  const handleExportPDF = async (options?: { resolution?: '1080p' | '4k'; includeSlideNumbers?: boolean; scope?: 'all' | 'current' }) => {
    setIsExporting(true);
    setShowExportMenu(false);
    setExportProgress({ current: 0, total: slides.length, text: 'Initializing High-Resolution PDF Engine...' });
    
    try {
      const is4k = options?.resolution === '4k';
      const width = is4k ? 3840 : 1920;
      const height = is4k ? 2160 : 1080;
      const scope = options?.scope || 'all';
      const targetSlides = scope === 'current' ? [currentSlide] : slides;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [width, height],
        compress: true
      });

      for (let i = 0; i < targetSlides.length; i++) {
        setExportProgress({ 
          current: i + 1, 
          total: targetSlides.length, 
          text: `Rendering Slide ${i + 1} of ${targetSlides.length} (${targetSlides[i].title})...` 
        });
        await new Promise(r => setTimeout(r, 50));

        const canvas = createSlideCanvas(
          targetSlides[i], 
          scope === 'current' ? currentSlideIndex : i, 
          slides.length, 
          deckTitle, 
          width, 
          height, 
          options?.includeSlideNumbers ?? true
        );
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          doc.addPage([width, height], 'landscape');
        }
        doc.addImage(imgData, 'JPEG', 0, 0, width, height, undefined, 'FAST');
      }

      const cleanTitle = deckTitle.replace(/\.[^/.]+$/, "") || 'Presentation';
      const filename = scope === 'current' 
        ? `${cleanTitle} - Slide ${currentSlideIndex + 1}.pdf`
        : `${cleanTitle}.pdf`;

      doc.save(filename);
      notify('PDF Export Complete', `Successfully exported "${filename}" (${targetSlides.length} slides)`, 'info');
      setShowExportModal(false);
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      notify('PDF Export Failed', err?.message || 'Could not generate PDF presentation.', 'warning');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export Current Slide or Specified Slide as PNG or JPEG
  const handleExportImage = (format: 'png' | 'jpeg', slideIdx: number = currentSlideIndex, resolution: '1080p' | '4k' = '1080p') => {
    const targetSlide = slides[slideIdx];
    if (!targetSlide) return;
    const is4k = resolution === '4k';
    const width = is4k ? 3840 : 1920;
    const height = is4k ? 2160 : 1080;
    
    const canvas = createSlideCanvas(targetSlide, slideIdx, slides.length, deckTitle, width, height, true);
    const cleanTitle = deckTitle.replace(/\.[^/.]+$/, "") || 'Presentation';
    const ext = format === 'png' ? 'png' : 'jpg';
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? 0.95 : 1);
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${cleanTitle} - Slide ${slideIdx + 1} (${targetSlide.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24)}).${ext}`;
    a.click();
    notify('Slide Image Exported', `Downloaded high-res ${format.toUpperCase()} (${width}×${height})`, 'info');
    setShowExportMenu(false);
    setShowExportModal(false);
  };

  // Export All Slides as Batch PNG Images
  const handleExportAllImages = async (format: 'png' | 'jpeg' = 'png', resolution: '1080p' | '4k' = '1080p') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      for (let i = 0; i < slides.length; i++) {
        setExportProgress({ current: i + 1, total: slides.length, text: `Exporting Slide ${i + 1} of ${slides.length}...` });
        handleExportImage(format, i, resolution);
        await new Promise(r => setTimeout(r, 220));
      }
      notify('Batch Export Complete', `Exported all ${slides.length} slides as ${format.toUpperCase()} images`, 'info');
      setShowExportModal(false);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
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

  const isMorphActive = currentSlide.transition === 'morph' || switchAnimMode === 'morph';

  const getSlideTransitionStyle = (
    transition: TransitionType, 
    speed: Slide['transitionSpeed'],
    dir: 'next' | 'prev' | 'none' = switchDirection
  ): React.CSSProperties => {
    const duration = getTransitionDuration(speed);

    // Dynamic directional animated slide switch
    if (switchAnimMode === 'slide' && dir !== 'none') {
      const animName = dir === 'next' ? 'keynote-switch-next' : 'keynote-switch-prev';
      return {
        animation: `${animName} ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`,
      };
    }
    
    // Magic Morph on switch
    if ((switchAnimMode === 'morph' || transition === 'morph') && dir !== 'none') {
      return {
        animation: `keynote-switch-morph ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`,
      };
    }

    if (transition === 'none') return {};
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

  // Smooth Morph Keyframes Interpolation for Slide Elements (Positions & Sizes)
  const getTitleStyle = (): React.CSSProperties => {
    if (!isMorphActive) return getElementAnimationStyle(currentSlide.titleAnimation, 0.1);
    const duration = getTransitionDuration(currentSlide.transitionSpeed);
    const prevLayout = prevSlide?.layout || 'title';
    const currLayout = currentSlide.layout;

    let anim = switchDirection === 'prev' ? 'morph-elem-title-shift-prev' : 'morph-elem-title-shift-next';
    if (prevLayout === 'title' && currLayout !== 'title') {
      anim = 'morph-elem-title-to-top';
    } else if (prevLayout !== 'title' && currLayout === 'title') {
      anim = 'morph-elem-title-to-center';
    }
    return {
      animation: `${anim} ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`,
      transformOrigin: 'top left'
    };
  };

  const getSubtitleStyle = (): React.CSSProperties => {
    if (!isMorphActive) return getElementAnimationStyle(currentSlide.subtitleAnimation, 0.25);
    const duration = getTransitionDuration(currentSlide.transitionSpeed);
    const prevLayout = prevSlide?.layout || 'title';
    const currLayout = currentSlide.layout;

    let anim = switchDirection === 'prev' ? 'morph-elem-subtitle-shift-prev' : 'morph-elem-subtitle-shift-next';
    if (prevLayout === 'title' && currLayout !== 'title') {
      anim = 'morph-elem-subtitle-to-top';
    } else if (prevLayout !== 'title' && currLayout === 'title') {
      anim = 'morph-elem-subtitle-to-center';
    }
    return {
      animation: `${anim} ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`,
      transformOrigin: 'top left'
    };
  };

  const getBodyStyle = (delaySec: number = 0.05): React.CSSProperties => {
    if (!isMorphActive) return getElementAnimationStyle(currentSlide.bodyAnimation, 0.35 + delaySec);
    const duration = getTransitionDuration(currentSlide.transitionSpeed);
    return {
      animation: `morph-elem-body-expand ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delaySec}s both`
    };
  };

  const getBulletStyle = (idx: number): React.CSSProperties => {
    if (!isMorphActive) return getElementAnimationStyle(currentSlide.bodyAnimation, 0.3 + idx * 0.12);
    const duration = getTransitionDuration(currentSlide.transitionSpeed);
    return {
      animation: `morph-elem-bullet-stagger ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${0.05 + idx * 0.06}s both`
    };
  };

  const getColumnStyle = (col: 'left' | 'right'): React.CSSProperties => {
    if (!isMorphActive) return getElementAnimationStyle(currentSlide.bodyAnimation, col === 'left' ? 0.3 : 0.45);
    const duration = getTransitionDuration(currentSlide.transitionSpeed);
    return {
      animation: `${col === 'left' ? 'morph-elem-col-left' : 'morph-elem-col-right'} ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`
    };
  };

  const getStatStyle = (): React.CSSProperties => {
    if (!isMorphActive) return getElementAnimationStyle(currentSlide.bodyAnimation || 'bounce', 0.3);
    const duration = getTransitionDuration(currentSlide.transitionSpeed);
    return {
      animation: `morph-elem-stat-grow ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`
    };
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs relative ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Dynamic Keyframes Injection */}
      <style>{`
        /* Smooth Keynote Morph Transition Keyframes for Elements (Positions & Sizes) */
        @keyframes morph-elem-title-to-top {
          0% {
            transform: translate3d(0, 48px, 0) scale(1.26);
            opacity: 0.85;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-title-to-center {
          0% {
            transform: translate3d(0, -42px, 0) scale(0.80);
            opacity: 0.85;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-title-shift-next {
          0% {
            transform: translate3d(55px, 0, 0) scale(0.96);
            opacity: 0.65;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-title-shift-prev {
          0% {
            transform: translate3d(-55px, 0, 0) scale(0.96);
            opacity: 0.65;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-subtitle-to-top {
          0% {
            transform: translate3d(0, 36px, 0) scale(1.15);
            opacity: 0.55;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.75;
          }
        }
        @keyframes morph-elem-subtitle-to-center {
          0% {
            transform: translate3d(0, -32px, 0) scale(0.86);
            opacity: 0.55;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.75;
          }
        }
        @keyframes morph-elem-subtitle-shift-next {
          0% {
            transform: translate3d(45px, 0, 0) scale(0.96);
            opacity: 0.5;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.75;
          }
        }
        @keyframes morph-elem-subtitle-shift-prev {
          0% {
            transform: translate3d(-45px, 0, 0) scale(0.96);
            opacity: 0.5;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.75;
          }
        }
        @keyframes morph-elem-body-expand {
          0% {
            transform: translate3d(0, 32px, 0) scale(0.93);
            opacity: 0.35;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-bullet-stagger {
          0% {
            transform: translate3d(32px, 14px, 0) scale(0.94);
            opacity: 0.3;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-col-left {
          0% {
            transform: translate3d(-35px, 20px, 0) scale(0.90);
            opacity: 0.4;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-col-right {
          0% {
            transform: translate3d(35px, 20px, 0) scale(0.90);
            opacity: 0.4;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes morph-elem-stat-grow {
          0% {
            transform: scale(0.35) translate3d(0, -25px, 0);
            opacity: 0.25;
          }
          65% {
            transform: scale(1.06) translate3d(0, 0, 0);
            opacity: 0.95;
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
            opacity: 1;
          }
        }
        @keyframes keynote-morph {
          0% {
            opacity: 0;
            transform: scale3d(0.92, 0.92, 1) perspective(1000px) rotateX(2deg) translate3d(0, 14px, 0);
            filter: blur(8px) brightness(1.15);
            border-radius: 36px;
          }
          40% {
            opacity: 0.92;
            filter: blur(3px) brightness(1.08);
          }
          100% {
            opacity: 1;
            transform: scale3d(1, 1, 1) perspective(1000px) rotateX(0deg) translate3d(0, 0, 0);
            filter: blur(0px) brightness(1);
            border-radius: 16px;
          }
        }
        @keyframes keynote-switch-next {
          0% {
            opacity: 0;
            transform: translate3d(70px, 0, 0) scale(0.96);
            filter: blur(5px);
          }
          50% {
            opacity: 0.9;
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes keynote-switch-prev {
          0% {
            opacity: 0;
            transform: translate3d(-70px, 0, 0) scale(0.96);
            filter: blur(5px);
          }
          50% {
            opacity: 0.9;
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes keynote-switch-morph {
          0% {
            opacity: 0.3;
            transform: scale3d(0.94, 0.94, 1) perspective(1000px);
            filter: blur(6px) brightness(1.1);
          }
          100% {
            opacity: 1;
            transform: scale3d(1, 1, 1) perspective(1000px);
            filter: blur(0px) brightness(1);
          }
        }
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

            {/* Add Image from Laptop */}
            <button
              onClick={() => imageUploadRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-semibold"
              title="Upload image from computer to this slide"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Add Image</span>
            </button>
            <input
              type="file"
              ref={imageUploadRef}
              accept="image/*"
              className="hidden"
              onChange={handleAddImageFromLaptop}
            />
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

          {/* Export to your device Button */}
          <button
            onClick={() => handleExportPDF({ resolution: '1080p', includeSlideNumbers: true, scope: 'all' })}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
            title="Export presentation document directly to your device (PDF)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to your device</span>
          </button>

          {/* Export Menu Dropdown (PDF, PNG, JPEG, Deck) */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all font-semibold text-xs shadow-sm"
              title="Export presentation options"
            >
              <span>Formats</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Export Dropdown Menu Card */}
            {showExportMenu && (
              <div className={`absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl border p-2 z-50 backdrop-blur-2xl text-xs animate-in fade-in zoom-in-95 duration-150 ${
                settings.theme === 'dark' ? 'bg-neutral-900/95 border-white/15 text-neutral-200' : 'bg-white/95 border-black/15 text-neutral-800'
              }`}>
                <div className="px-2.5 py-1.5 border-b border-white/10 font-bold text-[10px] text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Export to Your Device</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>

                <div className="py-1 space-y-1">
                  {/* Export as PDF Document */}
                  <button
                    onClick={() => handleExportPDF({ resolution: '1080p', includeSlideNumbers: true, scope: 'all' })}
                    disabled={isExporting}
                    className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <span>Export to your device (.pdf)</span>
                        <span className="text-[9px] px-1.5 rounded bg-rose-500/20 text-rose-300 font-mono">All Slides</span>
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5">
                        High-res multi-page vector presentation document
                      </div>
                    </div>
                  </button>

                  {/* Export Current Slide as PNG */}
                  <button
                    onClick={() => handleExportImage('png')}
                    disabled={isExporting}
                    className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <span>Export to your device (.png)</span>
                        <span className="text-[9px] px-1.5 rounded bg-sky-500/20 text-sky-300 font-mono">1080p HD</span>
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5">
                        Lossless slide graphic for your computer
                      </div>
                    </div>
                  </button>

                  {/* Export Current Slide as JPEG */}
                  <button
                    onClick={() => handleExportImage('jpeg')}
                    disabled={isExporting}
                    className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <span>Export to your device (.jpeg)</span>
                        <span className="text-[9px] px-1.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Photo</span>
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5">
                        Optimized format for social &amp; email sharing
                      </div>
                    </div>
                  </button>

                  {/* Export All Slides as Batch Images */}
                  <button
                    onClick={() => handleExportAllImages('png')}
                    disabled={isExporting}
                    className="w-full text-left p-2 rounded-xl hover:bg-white/10 transition-colors flex items-start space-x-2.5 group"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-1.5">
                        <span>All Slides as Images</span>
                        <span className="text-[9px] px-1.5 rounded bg-purple-500/20 text-purple-300 font-mono">{slides.length} PNGs</span>
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5">
                        Batch exports each slide as separate image file
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-white/10"></div>

                  {/* Export Deck File (.key) */}
                  <button
                    onClick={handleDownloadDeck}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 opacity-70" />
                      <span>Download Deck File (.key)</span>
                    </div>
                    <span className="text-[10px] opacity-50 font-mono">JSON</span>
                  </button>

                  {/* Advanced Export Studio Modal Trigger */}
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      setShowExportModal(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors flex items-center justify-between text-xs font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Advanced Export Studio (4K)...</span>
                    </div>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

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

          {/* Slides List Thumbnail Navigation */}
          {slides.map((s, idx) => {
            const isActive = currentSlideIndex === idx;
            return (
              <div
                key={s.id}
                onClick={() => switchSlide(idx)}
                className={`p-2 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col space-y-1 relative group ${
                  isActive
                    ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20 scale-[1.03] bg-amber-500/15'
                    : 'border-white/10 hover:border-white/30 bg-black/10 dark:bg-white/5 opacity-80 hover:opacity-100 hover:scale-[1.01]'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] opacity-60 mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold">#{idx + 1}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    )}
                  </div>
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
            );
          })}
        </div>

        {/* Center: Interactive Slide Stage with Dynamic Preview */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-black/20 dark:bg-black/60 overflow-y-auto relative">
          
          {/* Dynamic Preview & Slide Switch Engine Floating Control Pill */}
          <div className="mb-4 flex items-center space-x-3 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-white/15 shadow-xl text-white backdrop-blur z-10 flex-wrap gap-y-1.5">
            <span className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Slide Switch Animation</span>
            </span>
            <div className="w-[1px] h-3.5 bg-white/20"></div>

            {/* Switch Animation Mode Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] opacity-70">Switch Effect:</span>
              <select
                value={switchAnimMode}
                onChange={(e) => setSwitchAnimMode(e.target.value as any)}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-[11px] outline-none text-white"
                title="Animation style when switching between slides"
              >
                <option value="slide">Directional Push (3D)</option>
                <option value="morph">Magic Morph ✨</option>
                <option value="transition">Custom Slide Transition</option>
              </select>
            </div>

            <div className="w-[1px] h-3.5 bg-white/20"></div>

            {/* Slide Transition Config */}
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
                <option value="morph">Magic Morph ✨</option>
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

            {/* Prev / Next Quick Switch Buttons */}
            <div className="flex items-center space-x-1 pl-1">
              <button
                onClick={() => switchSlide(currentSlideIndex - 1)}
                disabled={currentSlideIndex === 0}
                className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
                title="Switch to previous slide (←)"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>
              <span className="text-[10px] font-mono opacity-80 px-1">
                {currentSlideIndex + 1}/{slides.length}
              </span>
              <button
                onClick={() => switchSlide(currentSlideIndex + 1)}
                disabled={currentSlideIndex === slides.length - 1}
                className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
                title="Switch to next slide (→)"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>
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
            style={getSlideTransitionStyle(currentSlide.transition, currentSlide.transitionSpeed, switchDirection)}
            className={`w-full max-w-3xl aspect-[16/9] rounded-2xl shadow-2xl border p-12 flex flex-col justify-between overflow-hidden relative ${getSlideThemeStyles(currentSlide.theme)}`}
          >
            {/* Top Area: Title & Subtitle with Element Animations */}
            <div className="space-y-3">
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => handleUpdateSlide('title', e.target.value)}
                placeholder="Click to add slide title..."
                style={getTitleStyle()}
                className="w-full bg-transparent font-black text-2xl md:text-3xl tracking-tight outline-none border-b border-transparent hover:border-white/20 focus:border-amber-400 pb-1"
              />

              <input
                type="text"
                value={currentSlide.subtitle}
                onChange={(e) => handleUpdateSlide('subtitle', e.target.value)}
                placeholder="Click to add subtitle or description..."
                style={getSubtitleStyle()}
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
                  style={getBodyStyle(0.1)}
                  className="w-full bg-transparent text-sm leading-relaxed opacity-85 outline-none resize-none"
                />
              )}

              {currentSlide.layout === 'bullets' && (
                <div className="space-y-2.5">
                  {(currentSlide.bulletPoints || []).map((bp, bpIdx) => (
                    <div 
                      key={bpIdx} 
                      style={getBulletStyle(bpIdx)}
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
                    style={getColumnStyle('left')}
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
                    style={getColumnStyle('right')}
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
                    style={getStatStyle()}
                    className="font-black text-5xl md:text-6xl text-amber-400 bg-transparent text-center outline-none"
                  />
                  <input
                    type="text"
                    value={currentSlide.statLabel || 'Speed metric multiplier'}
                    onChange={(e) => handleUpdateSlide('statLabel', e.target.value)}
                    style={getSubtitleStyle()}
                    className="font-semibold text-sm opacity-80 bg-transparent text-center outline-none w-full"
                  />
                </div>
              )}

              {/* Render Slide Image Elements & Interactive Image Editor */}
              {(currentSlide.elements || []).filter(el => el.type === 'image').length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-4 my-2">
                  {(currentSlide.elements || []).filter(el => el.type === 'image').map((imgElem) => {
                    const isSelected = selectedImageElementId === imgElem.id;
                    const filterStyle = 
                      imgElem.filter === 'grayscale' ? 'grayscale(100%)' :
                      imgElem.filter === 'sepia' ? 'sepia(100%)' :
                      imgElem.filter === 'invert' ? 'invert(100%)' :
                      imgElem.filter === 'blur' ? 'blur(2px)' :
                      imgElem.filter === 'warm' ? 'sepia(30%) saturate(140%)' :
                      imgElem.filter === 'cool' ? 'hue-rotate(180deg)' : 'none';

                    const radiusClass = 
                      imgElem.borderRadius === 'circle' ? 'rounded-full' :
                      imgElem.borderRadius === 'square' ? 'rounded-none' : 'rounded-2xl';

                    const sizeClass =
                      imgElem.size === 'sm' ? 'w-32 h-24' :
                      imgElem.size === 'lg' ? 'w-96 h-56' :
                      imgElem.size === 'full' ? 'w-full h-64' : 'w-56 h-36';

                    return (
                      <div key={imgElem.id} className="relative group flex flex-col items-center">
                        <div 
                          onClick={(e) => { e.stopPropagation(); setSelectedImageElementId(isSelected ? null : imgElem.id); }}
                          className={`relative cursor-pointer transition-all duration-200 border-2 overflow-hidden shadow-xl ${radiusClass} ${sizeClass} ${
                            isSelected ? 'border-amber-400 ring-4 ring-amber-400/40' : 'border-white/20 hover:border-white/50'
                          }`}
                          style={{
                            transform: `rotate(${imgElem.rotation || 0}deg)`,
                            filter: `${filterStyle} brightness(${imgElem.brightness || 100}%) contrast(${imgElem.contrast || 100}%)`
                          }}
                        >
                          <img 
                            src={imgElem.content} 
                            alt="Slide asset" 
                            className="w-full h-full object-cover select-none pointer-events-none" 
                          />
                          {!isSelected && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">
                              Click to Edit
                            </div>
                          )}
                        </div>

                        {/* Interactive Image Editor Control Toolbar */}
                        {isSelected && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 p-2 rounded-xl bg-neutral-900/95 border border-amber-500/40 text-white shadow-2xl backdrop-blur-xl flex flex-wrap items-center gap-2 text-[10px] z-40 animate-in fade-in zoom-in-95"
                          >
                            <span className="font-bold text-amber-400 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              <span>Edit:</span>
                            </span>

                            {/* Size buttons */}
                            <div className="flex items-center bg-black/40 rounded p-0.5">
                              {(['sm', 'md', 'lg', 'full'] as const).map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleUpdateImageElement(imgElem.id, { size: s })}
                                  className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${
                                    (imgElem.size || 'md') === s ? 'bg-amber-500 text-white' : 'opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>

                            {/* Filter preset */}
                            <select
                              value={imgElem.filter || 'none'}
                              onChange={(e) => handleUpdateImageElement(imgElem.id, { filter: e.target.value as any })}
                              className="bg-black/50 border border-white/20 rounded px-1.5 py-0.5 text-[9px] outline-none text-white"
                            >
                              <option value="none">Normal</option>
                              <option value="grayscale">B&amp;W</option>
                              <option value="sepia">Sepia</option>
                              <option value="warm">Warm</option>
                              <option value="cool">Cool</option>
                              <option value="invert">Invert</option>
                              <option value="blur">Blur</option>
                            </select>

                            {/* Brightness */}
                            <div className="flex items-center gap-1" title="Brightness">
                              <Sun className="w-2.5 h-2.5 text-amber-400" />
                              <input
                                type="range"
                                min="50"
                                max="150"
                                value={imgElem.brightness || 100}
                                onChange={(e) => handleUpdateImageElement(imgElem.id, { brightness: Number(e.target.value) })}
                                className="w-12 accent-amber-400 h-1 rounded cursor-pointer"
                              />
                            </div>

                            {/* Rotate */}
                            <button
                              onClick={() => handleUpdateImageElement(imgElem.id, { rotation: ((imgElem.rotation || 0) + 90) % 360 })}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white"
                              title="Rotate 90 degrees"
                            >
                              <RotateCw className="w-2.5 h-2.5" />
                            </button>

                            {/* Shape */}
                            <button
                              onClick={() => {
                                const next = imgElem.borderRadius === 'rounded' ? 'circle' : imgElem.borderRadius === 'circle' ? 'square' : 'rounded';
                                handleUpdateImageElement(imgElem.id, { borderRadius: next });
                              }}
                              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[9px]"
                              title="Toggle Shape"
                            >
                              {imgElem.borderRadius === 'circle' ? 'Circle' : imgElem.borderRadius === 'square' ? 'Square' : 'Round'}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteImageElement(imgElem.id)}
                              className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 ml-1"
                              title="Delete Image"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

          {/* Quick Stage Pagination Bar with Animated Slide Switch */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={() => switchSlide(currentSlideIndex - 1)}
              disabled={currentSlideIndex === 0}
              className={`p-2 rounded-xl border transition-all ${
                currentSlideIndex > 0 ? 'hover:bg-white/10 bg-black/20 border-white/10 active:scale-95' : 'opacity-30 cursor-not-allowed border-transparent'
              }`}
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/20 border border-white/10 font-mono text-xs">
              <span className="text-amber-400 font-bold">{currentSlideIndex + 1}</span>
              <span className="opacity-40">/</span>
              <span>{slides.length}</span>
            </div>
            <button
              onClick={() => switchSlide(currentSlideIndex + 1)}
              disabled={currentSlideIndex === slides.length - 1}
              className={`p-2 rounded-xl border transition-all ${
                currentSlideIndex < slides.length - 1 ? 'hover:bg-white/10 bg-black/20 border-white/10 active:scale-95' : 'opacity-30 cursor-not-allowed border-transparent'
              }`}
              title="Next slide (Right Arrow)"
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
                  { id: 'morph', label: 'Magic Morph ✨' },
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
              style={getSlideTransitionStyle(currentSlide.transition, currentSlide.transitionSpeed, switchDirection)}
              className={`w-full max-w-5xl aspect-[16/9] rounded-3xl shadow-2xl p-16 flex flex-col justify-between border ${getSlideThemeStyles(currentSlide.theme)}`}
            >
              <div className="space-y-3">
                <h1 
                  style={getTitleStyle()}
                  className="text-4xl md:text-5xl font-black tracking-tight"
                >
                  {currentSlide.title}
                </h1>
                <p 
                  style={getSubtitleStyle()}
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
                        style={getBulletStyle(i)}
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
                      style={getColumnStyle('left')}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 whitespace-pre-wrap leading-relaxed"
                    >
                      {currentSlide.leftColumn}
                    </div>
                    <div 
                      style={getColumnStyle('right')}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 whitespace-pre-wrap leading-relaxed"
                    >
                      {currentSlide.rightColumn}
                    </div>
                  </div>
                )}

                {currentSlide.layout === 'stat' && (
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div 
                      style={getStatStyle()}
                      className="text-7xl md:text-8xl font-black text-amber-400 drop-shadow-lg"
                    >
                      {currentSlide.statNumber}
                    </div>
                    <div 
                      style={getSubtitleStyle()}
                      className="text-xl font-medium opacity-80"
                    >
                      {currentSlide.statLabel}
                    </div>
                  </div>
                )}

                {currentSlide.layout === 'title' && (
                  <p 
                    style={getBodyStyle(0.1)}
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

          {/* Bottom Slideshow Navigation Controller with Animated Slide Switch */}
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex justify-center items-center space-x-6 py-2 cursor-default">
            <button
              onClick={() => switchSlide(currentSlideIndex - 1)}
              disabled={currentSlideIndex === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 active:scale-95 transition-transform"
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-white font-mono text-sm font-bold bg-black/40 px-3 py-1 rounded-full border border-white/10">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => switchSlide(currentSlideIndex + 1)}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 active:scale-95 transition-transform"
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

      {/* Advanced Export Studio Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15 text-neutral-100' : 'bg-white border-black/15 text-neutral-800'
          }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-black/10 dark:bg-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Export Presentation Studio</h3>
                  <p className="text-[11px] opacity-60">Export deck to PDF document or high-resolution images</p>
                </div>
              </div>
              <button 
                onClick={() => !isExporting && setShowExportModal(false)}
                disabled={isExporting}
                className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Format Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-semibold opacity-70 block">Select Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'pdf', title: 'PDF Document', ext: '.pdf', icon: FileText, desc: 'Multi-page 16:9 presentation document' },
                    { id: 'png', title: 'PNG Image', ext: '.png', icon: ImageIcon, desc: 'Lossless graphic at native resolution' },
                    { id: 'jpeg', title: 'JPEG Image', ext: '.jpg', icon: ImageIcon, desc: 'Compressed photo format for sharing' }
                  ].map((fmt) => {
                    const isSelected = exportOptions.format === fmt.id;
                    const IconComp = fmt.icon;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => !isExporting && setExportOptions(prev => ({ ...prev, format: fmt.id as any }))}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                            : 'border-white/10 hover:border-white/25 bg-black/10 dark:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <IconComp className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'opacity-60'}`} />
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 font-bold">{fmt.ext}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-xs">{fmt.title}</div>
                          <div className="text-[10px] opacity-60 mt-0.5 leading-snug">{fmt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scope & Resolution Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Export Scope */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold opacity-70 block">Slides to Export</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setExportOptions(prev => ({ ...prev, scope: 'all' }))}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        exportOptions.scope === 'all'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                          : 'border-white/10 hover:bg-white/5 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>All Slides ({slides.length})</span>
                      </div>
                      {exportOptions.scope === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportOptions(prev => ({ ...prev, scope: 'current' }))}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        exportOptions.scope === 'current'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                          : 'border-white/10 hover:bg-white/5 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4" />
                        <span>Current Slide (#{currentSlideIndex + 1})</span>
                      </div>
                      {exportOptions.scope === 'current' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Resolution Quality */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold opacity-70 block">Render Resolution</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setExportOptions(prev => ({ ...prev, resolution: '1080p' }))}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        exportOptions.resolution === '1080p'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                          : 'border-white/10 hover:bg-white/5 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">1080p Full HD</div>
                        <div className="text-[10px] opacity-60">1920 × 1080 (Fastest)</div>
                      </div>
                      {exportOptions.resolution === '1080p' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportOptions(prev => ({ ...prev, resolution: '4k' }))}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        exportOptions.resolution === '4k'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                          : 'border-white/10 hover:bg-white/5 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">4K Ultra HD ✨</div>
                        <div className="text-[10px] opacity-60">3840 × 2160 (Mastering)</div>
                      </div>
                      {exportOptions.resolution === '4k' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Extra Checkboxes */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSlideNumbers}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeSlideNumbers: e.target.checked }))}
                    className="rounded border-white/20 bg-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Include Slide Numbers &amp; Page Badges</span>
                </label>
                <span className="text-[11px] opacity-60 font-mono">16:9 Widescreen</span>
              </div>

              {/* Live Export Progress Indicator */}
              {isExporting && exportProgress && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{exportProgress.text}</span>
                    </span>
                    <span className="font-mono">{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                      style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between bg-black/10 dark:bg-white/5 text-xs">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl hover:bg-white/10 text-neutral-300 font-medium transition-colors disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => {
                  if (exportOptions.format === 'pdf') {
                    handleExportPDF({
                      resolution: exportOptions.resolution,
                      includeSlideNumbers: exportOptions.includeSlideNumbers,
                      scope: exportOptions.scope
                    });
                  } else {
                    if (exportOptions.scope === 'all') {
                      handleExportAllImages(exportOptions.format, exportOptions.resolution);
                    } else {
                      handleExportImage(exportOptions.format, currentSlideIndex, exportOptions.resolution);
                    }
                  }
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      Export {exportOptions.scope === 'all' ? `All (${slides.length})` : 'Slide'} as {exportOptions.format.toUpperCase()}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
