import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Crop, 
  Sliders, 
  Palette, 
  Paintbrush, 
  Type, 
  Square, 
  ArrowUpRight, 
  Undo, 
  Save, 
  Download, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Image as ImageIcon, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  RefreshCw,
  FolderOpen,
  Monitor,
  Eye,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { sounds } from '../../utils/sound';

interface ImageEditorAppProps {
  initialFileId?: string;
  initialFileName?: string;
  initialFileUrl?: string;
}

interface FilterAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // 0 to 200
  warmth: number;     // -50 to 50
  blur: number;       // 0 to 20
  grayscale: number;  // 0 to 100
  sepia: number;      // 0 to 100
  invert: number;     // 0 to 100
  hueRotate: number;  // 0 to 360
}

const DEFAULT_FILTERS: FilterAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 100,
  warmth: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  hueRotate: 0,
};

const PRESETS: Record<string, { label: string; icon: string; filters: Partial<FilterAdjustments> }> = {
  original: { label: 'Original', icon: '✨', filters: DEFAULT_FILTERS },
  vivid: { label: 'Vivid HDR', icon: '🌈', filters: { saturation: 140, contrast: 20, brightness: 5 } },
  noir: { label: 'Film Noir', icon: '🎬', filters: { grayscale: 100, contrast: 35, brightness: -5 } },
  cyberpunk: { label: 'Cyber Neon', icon: '🌆', filters: { saturation: 160, contrast: 30, hueRotate: 290, brightness: 5 } },
  golden: { label: 'Golden Hour', icon: '🌅', filters: { warmth: 30, saturation: 120, sepia: 25, brightness: 10 } },
  vintage: { label: 'Retro 35mm', icon: '🎞️', filters: { sepia: 40, contrast: 15, brightness: -5, saturation: 85 } },
  emerald: { label: 'Emerald Mist', icon: '🌲', filters: { hueRotate: 70, saturation: 110, contrast: 15 } },
  dramatic: { label: 'Dramatic B&W', icon: '⚡', filters: { grayscale: 100, contrast: 60, brightness: -10 } },
};

interface AnnotationItem {
  id: string;
  type: 'brush' | 'rect' | 'arrow' | 'text';
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
}

export const ImageEditorApp: React.FC<ImageEditorAppProps> = ({
  initialFileId,
  initialFileName,
  initialFileUrl
}) => {
  const { files, createFile, updateFile, uploadFilesFromComputer, settings, updateSettings, notify } = useOS();

  // Find all available images across NebulaOS files
  const workstationImages = files.filter(f => f.type === 'image' || f.name.match(/\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i));

  // Default initial image
  const defaultInitial = workstationImages[0]?.content || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2800&q=80';

  const [currentImageSrc, setCurrentImageSrc] = useState<string>(initialFileUrl || defaultInitial);
  const [imageName, setImageName] = useState<string>(initialFileName || 'Workstation_Image.jpg');
  const [currentFileId, setCurrentFileId] = useState<string | undefined>(initialFileId);

  // Inspector and adjustment state
  const [activeTab, setActiveTab] = useState<'adjust' | 'presets' | 'annotate' | 'crop'>('adjust');
  const [filters, setFilters] = useState<FilterAdjustments>(DEFAULT_FILTERS);
  const [activePreset, setActivePreset] = useState<string>('original');

  // Transformations
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Zoom & View
  const [zoom, setZoom] = useState<number>(100);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Annotations
  const [annotateTool, setAnnotateTool] = useState<'brush' | 'rect' | 'arrow' | 'text'>('brush');
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [textInput, setTextInput] = useState<string>('Sample Note');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  // Crop State
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '16:9' | '4:3' | '9:16'>('free');
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // UI Drawer
  const [showGallery, setShowGallery] = useState<boolean>(true);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('');

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update image when props change
  useEffect(() => {
    if (initialFileUrl) {
      setCurrentImageSrc(initialFileUrl);
      if (initialFileName) setImageName(initialFileName);
      if (initialFileId) setCurrentFileId(initialFileId);
    }
  }, [initialFileUrl, initialFileName, initialFileId]);

  // Load natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight });
  };

  // Build CSS filter string for live preview
  const getCssFilter = () => {
    return [
      `brightness(${100 + filters.brightness}%)`,
      `contrast(${100 + filters.contrast}%)`,
      `saturate(${filters.saturation}%)`,
      `blur(${filters.blur}px)`,
      `grayscale(${filters.grayscale}%)`,
      `sepia(${filters.sepia}%)`,
      `invert(${filters.invert}%)`,
      `hue-rotate(${filters.hueRotate}deg)`,
      filters.warmth > 0 ? `sepia(${filters.warmth * 0.5}%)` : ''
    ].filter(Boolean).join(' ');
  };

  // Apply Preset
  const handleApplyPreset = (key: string) => {
    setActivePreset(key);
    const p = PRESETS[key];
    if (p) {
      setFilters({ ...DEFAULT_FILTERS, ...p.filters });
      sounds.playPop();
    }
  };

  // Reset Adjustments
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setActivePreset('original');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAnnotations([]);
    setCropBox(null);
    sounds.playPop();
    notify('Reset Complete', 'Image returned to original state.', 'info');
  };

  // Interactive Drawing Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'annotate') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setIsDrawing(true);

    if (annotateTool === 'brush') {
      setCurrentStroke([{ x, y }]);
    } else if (annotateTool === 'text') {
      const newAnnotation: AnnotationItem = {
        id: `ann-${Date.now()}`,
        type: 'text',
        color: brushColor,
        size: brushSize * 4 + 14,
        start: { x, y },
        text: textInput || 'Text Note'
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setIsDrawing(false);
      sounds.playPop();
    } else {
      // rect or arrow
      setCurrentStroke([{ x, y }]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTab !== 'annotate') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (annotateTool === 'brush') {
      setCurrentStroke(prev => [...prev, { x, y }]);
    } else {
      // For shapes, hold start and update current
      setCurrentStroke(prev => [prev[0], { x, y }]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || activeTab !== 'annotate') return;
    setIsDrawing(false);

    if (annotateTool === 'brush' && currentStroke.length > 1) {
      setAnnotations(prev => [
        ...prev,
        {
          id: `ann-${Date.now()}`,
          type: 'brush',
          color: brushColor,
          size: brushSize,
          points: currentStroke
        }
      ]);
    } else if ((annotateTool === 'rect' || annotateTool === 'arrow') && currentStroke.length >= 2) {
      setAnnotations(prev => [
        ...prev,
        {
          id: `ann-${Date.now()}`,
          type: annotateTool,
          color: brushColor,
          size: brushSize,
          start: currentStroke[0],
          end: currentStroke[1]
        }
      ]);
    }
    setCurrentStroke([]);
    sounds.playPop();
  };

  // Render annotations onto canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved annotations
    annotations.forEach(ann => {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (ann.type === 'brush' && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      } else if (ann.type === 'rect' && ann.start && ann.end) {
        ctx.strokeRect(
          ann.start.x,
          ann.start.y,
          ann.end.x - ann.start.x,
          ann.end.y - ann.start.y
        );
      } else if (ann.type === 'arrow' && ann.start && ann.end) {
        ctx.beginPath();
        ctx.moveTo(ann.start.x, ann.start.y);
        ctx.lineTo(ann.end.x, ann.end.y);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(ann.end.y - ann.start.y, ann.end.x - ann.start.x);
        const headlen = ann.size * 3 + 10;
        ctx.beginPath();
        ctx.moveTo(ann.end.x, ann.end.y);
        ctx.lineTo(ann.end.x - headlen * Math.cos(angle - Math.PI / 6), ann.end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(ann.end.x, ann.end.y);
        ctx.lineTo(ann.end.x - headlen * Math.cos(angle + Math.PI / 6), ann.end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (ann.type === 'text' && ann.start && ann.text) {
        ctx.font = `bold ${ann.size}px Inter, sans-serif`;
        // background pill
        const metrics = ctx.measureText(ann.text);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(ann.start.x - 6, ann.start.y - ann.size, metrics.width + 12, ann.size + 10);
        ctx.fillStyle = ann.color;
        ctx.fillText(ann.text, ann.start.x, ann.start.y);
      }
    });

    // Draw active drawing in progress
    if (isDrawing && currentStroke.length > 1) {
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (annotateTool === 'brush') {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
          ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.stroke();
      } else if (annotateTool === 'rect' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (annotateTool === 'arrow' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }
  }, [annotations, isDrawing, currentStroke, brushColor, brushSize, annotateTool]);

  // Master Render Function: Bakes filters, rotation, flip, and annotations into a single high-res canvas
  const renderCompositeCanvas = (): HTMLCanvasElement | null => {
    const img = imageRef.current;
    if (!img) return null;

    const outCanvas = document.createElement('canvas');
    const isRotatedQuarter = rotation === 90 || rotation === 270;
    const w = isRotatedQuarter ? img.naturalHeight : img.naturalWidth;
    const h = isRotatedQuarter ? img.naturalWidth : img.naturalHeight;

    outCanvas.width = w;
    outCanvas.height = h;

    const ctx = outCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    // Center transformation
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Apply CSS filters directly to canvas context
    ctx.filter = getCssFilter();
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Render annotations on top in correct coordinate space
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, w, h);
    }

    return outCanvas;
  };

  // Save to NebulaOS File System
  const handleSaveToWorkstation = () => {
    const composite = renderCompositeCanvas();
    if (!composite) return;

    const dataUrl = composite.toDataURL('image/png');
    const newName = imageName.replace(/\.[^/.]+$/, '') + '_edited.png';

    if (currentFileId) {
      updateFile(currentFileId, {
        content: dataUrl,
        size: `${Math.round(dataUrl.length / 1024)} KB`,
        updatedAt: 'Just now'
      });
      notify('File Saved', `${imageName} updated with edits.`, 'sync');
    } else {
      createFile({
        name: newName,
        path: `/Pictures/${newName}`,
        type: 'image',
        size: `${Math.round(dataUrl.length / 1024)} KB`,
        content: dataUrl,
        tags: ['image', 'edited', 'photo_studio'],
        isCloudSynced: true,
        isOfflineAvailable: true
      });
      notify('Saved to Pictures', `${newName} saved to your workstation file system.`, 'sync');
    }
    sounds.playPop();
  };

  // Download directly to computer / laptop
  const handleDownload = () => {
    const composite = renderCompositeCanvas();
    if (!composite) return;

    const link = document.createElement('a');
    link.download = imageName.replace(/\.[^/.]+$/, '') + '_edited.png';
    link.href = composite.toDataURL('image/png');
    link.click();
    sounds.playPop();
    notify('Download Started', 'Image downloaded to your computer.', 'info');
  };

  // Set as Active Desktop Wallpaper
  const handleSetAsWallpaper = () => {
    const composite = renderCompositeCanvas();
    const dataUrl = composite ? composite.toDataURL('image/png') : currentImageSrc;
    updateSettings({ wallpaper: dataUrl });
    sounds.playChime();
    notify('Wallpaper Updated', 'Active desktop wallpaper has been updated.', 'info');
  };

  return (
    <div className={`h-full flex flex-col select-none font-sans text-xs ${settings.theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-900 text-white'}`}>
      {/* Top Application Toolbar */}
      <div className="h-12 border-b border-white/10 px-3 flex items-center justify-between gap-2 shrink-0 bg-neutral-900/90 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center shadow-md">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs tracking-tight truncate max-w-[160px] sm:max-w-[240px]">
              {imageName}
            </span>
            <span className="text-[10px] text-white/50 font-mono">
              {naturalSize.width > 0 ? `${naturalSize.width} × ${naturalSize.height} px` : 'Loading size...'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('adjust')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'adjust' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adjust</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={() => setActiveTab('annotate')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'annotate' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Annotate</span>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-1.5">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = () => {
                  setCurrentImageSrc(reader.result as string);
                  setImageName(file.name);
                  setCurrentFileId(undefined);
                  sounds.playPop();
                  notify('Image Loaded', `Opened ${file.name} from computer.`, 'info');
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open photo from your computer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Open File</span>
          </button>

          <button
            onClick={handleSetAsWallpaper}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Set this image as desktop wallpaper"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">Wallpaper</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download edited image to laptop"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleSaveToWorkstation}
            className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-sky-900/30 transition-all cursor-pointer active:scale-95"
            title="Save into NebulaOS Pictures folder"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Canvas Viewer + Tool Inspector Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Image Canvas Stage */}
        <div className="flex-1 relative flex items-center justify-center p-4 overflow-auto bg-neutral-950/80 pattern-grid">
          {/* Zoom & Quick Geometry Controls Bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-1 p-1 rounded-xl bg-black/70 backdrop-blur-xl border border-white/15 shadow-2xl text-xs">
            <button
              onClick={() => setZoom(prev => Math.max(25, prev - 15))}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-white/70 min-w-[42px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(300, prev + 15))}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-white/20 mx-0.5" />
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white cursor-pointer"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFlipH(prev => !prev)}
              className={`p-1.5 rounded-lg hover:bg-white/15 cursor-pointer ${flipH ? 'bg-white/20 text-sky-400' : 'text-white/80 hover:text-white'}`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFlipV(prev => !prev)}
              className={`p-1.5 rounded-lg hover:bg-white/15 cursor-pointer ${flipV ? 'bg-white/20 text-sky-400' : 'text-white/80 hover:text-white'}`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-white/20 mx-0.5" />
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-rose-400 cursor-pointer"
              title="Reset All Adjustments"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Render Stage Container with Scaled Dimensions */}
          <div 
            className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10 transition-transform duration-100 flex items-center justify-center"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Live Filtered Image */}
            <img
              ref={imageRef}
              src={currentImageSrc}
              alt={imageName}
              onLoad={handleImageLoad}
              className="max-h-[72vh] max-w-[70vw] object-contain transition-all duration-75 block select-none pointer-events-none"
              style={{
                filter: getCssFilter(),
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
              }}
            />

            {/* Interactive Drawing & Annotation Canvas Overlay */}
            {naturalSize.width > 0 && (
              <canvas
                ref={canvasRef}
                width={naturalSize.width}
                height={naturalSize.height}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className={`absolute inset-0 w-full h-full ${
                  activeTab === 'annotate' ? 'cursor-crosshair z-10' : 'pointer-events-none'
                }`}
              />
            )}
          </div>
        </div>

        {/* Right Inspector & Controls Sidebar */}
        <div className="w-72 border-l border-white/10 bg-neutral-900/95 backdrop-blur-2xl flex flex-col shrink-0 overflow-y-auto">
          {/* TAB 1: SLIDERS & ADJUSTMENTS */}
          {activeTab === 'adjust' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-semibold text-xs tracking-wide uppercase text-white/70">
                  Light & Color
                </span>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  Reset Sliders
                </button>
              </div>

              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Brightness</span>
                  <span className="font-mono text-white/50">{filters.brightness > 0 ? `+${filters.brightness}` : filters.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.brightness}
                  onChange={(e) => setFilters(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Contrast</span>
                  <span className="font-mono text-white/50">{filters.contrast > 0 ? `+${filters.contrast}` : filters.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.contrast}
                  onChange={(e) => setFilters(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Saturation</span>
                  <span className="font-mono text-white/50">{filters.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturation}
                  onChange={(e) => setFilters(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Warmth / Color Temp */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Warmth</span>
                  <span className="font-mono text-white/50">{filters.warmth > 0 ? `+${filters.warmth}` : filters.warmth}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={filters.warmth}
                  onChange={(e) => setFilters(prev => ({ ...prev, warmth: parseInt(e.target.value) }))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Blur</span>
                  <span className="font-mono text-white/50">{filters.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.blur}
                  onChange={(e) => setFilters(prev => ({ ...prev, blur: parseInt(e.target.value) }))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Sepia */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Sepia Tone</span>
                  <span className="font-mono text-white/50">{filters.sepia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.sepia}
                  onChange={(e) => setFilters(prev => ({ ...prev, sepia: parseInt(e.target.value) }))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Grayscale */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Black & White (Grayscale)</span>
                  <span className="font-mono text-white/50">{filters.grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.grayscale}
                  onChange={(e) => setFilters(prev => ({ ...prev, grayscale: parseInt(e.target.value) }))}
                  className="w-full accent-neutral-300 cursor-pointer"
                />
              </div>

              {/* Hue Rotate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/80">Color Shift (Hue)</span>
                  <span className="font-mono text-white/50">{filters.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={filters.hueRotate}
                  onChange={(e) => setFilters(prev => ({ ...prev, hueRotate: parseInt(e.target.value) }))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CREATIVE PRESET FILTERS */}
          {activeTab === 'presets' && (
            <div className="p-4 space-y-3">
              <span className="font-semibold text-xs tracking-wide uppercase text-white/70 block pb-1 border-b border-white/10">
                Studio Grading Presets
              </span>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, item]) => {
                  const isSelected = activePreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleApplyPreset(key)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        isSelected 
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-950/40 ring-1 ring-sky-400' 
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="font-semibold text-xs text-white">{item.label}</div>
                        <div className="text-[10px] text-white/40">{key === 'original' ? 'Neutral' : 'Graded'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ANNOTATION & DRAWING */}
          {activeTab === 'annotate' && (
            <div className="p-4 space-y-4">
              <span className="font-semibold text-xs tracking-wide uppercase text-white/70 block pb-1 border-b border-white/10">
                Markups & Drawing
              </span>

              {/* Tool Picker */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-xl border border-white/10">
                <button
                  onClick={() => setAnnotateTool('brush')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    annotateTool === 'brush' ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:text-white'
                  }`}
                  title="Freehand Brush"
                >
                  <Paintbrush className="w-4 h-4" />
                  <span className="text-[10px]">Brush</span>
                </button>
                <button
                  onClick={() => setAnnotateTool('rect')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    annotateTool === 'rect' ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:text-white'
                  }`}
                  title="Rectangle Box"
                >
                  <Square className="w-4 h-4" />
                  <span className="text-[10px]">Box</span>
                </button>
                <button
                  onClick={() => setAnnotateTool('arrow')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    annotateTool === 'arrow' ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:text-white'
                  }`}
                  title="Callout Arrow"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-[10px]">Arrow</span>
                </button>
                <button
                  onClick={() => setAnnotateTool('text')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    annotateTool === 'text' ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:text-white'
                  }`}
                  title="Text Caption"
                >
                  <Type className="w-4 h-4" />
                  <span className="text-[10px]">Text</span>
                </button>
              </div>

              {/* Text Input when Text Tool is active */}
              {annotateTool === 'text' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/70">Caption Text (Click image to place)</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text caption..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-400"
                  />
                </div>
              )}

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="text-[11px] text-white/70">Stroke Color</label>
                <div className="flex items-center space-x-2">
                  {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff', '#000000'].map(c => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        brushColor === c ? 'scale-125 border-white ring-2 ring-sky-400/50' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/70">Line Width</span>
                  <span className="font-mono text-white/50">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Clear / Undo Annotations */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-white/50">{annotations.length} annotation(s)</span>
                <button
                  onClick={() => {
                    setAnnotations(prev => prev.slice(0, -1));
                    sounds.playPop();
                  }}
                  disabled={annotations.length === 0}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs disabled:opacity-40 cursor-pointer"
                >
                  Undo Last
                </button>
                <button
                  onClick={() => {
                    setAnnotations([]);
                    sounds.playPop();
                  }}
                  disabled={annotations.length === 0}
                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs disabled:opacity-40 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Workstation Photo Gallery Carousel */}
      <div className="h-20 border-t border-white/10 bg-neutral-900/90 backdrop-blur-xl px-3 flex items-center gap-3 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0 text-white/60 pr-2 border-r border-white/10">
          <FolderOpen className="w-4 h-4 text-sky-400" />
          <span className="text-[11px] font-semibold">Workstation Images:</span>
        </div>

        {workstationImages.length === 0 ? (
          <div className="text-[11px] text-white/40 italic">
            No images in files yet. Click "Open File" to load any picture.
          </div>
        ) : (
          workstationImages.map((imgFile) => {
            const isCurrent = currentFileId === imgFile.id || currentImageSrc === imgFile.content;
            return (
              <button
                key={imgFile.id}
                onClick={() => {
                  if (imgFile.content) {
                    setCurrentImageSrc(imgFile.content);
                    setImageName(imgFile.name);
                    setCurrentFileId(imgFile.id);
                    sounds.playPop();
                  }
                }}
                className={`h-14 px-2 py-1 rounded-xl border flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isCurrent 
                    ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                title={imgFile.name}
              >
                <img
                  src={imgFile.content || defaultInitial}
                  alt={imgFile.name}
                  className="w-12 h-10 object-cover rounded-lg bg-black/40"
                />
                <div className="text-left max-w-[100px] truncate">
                  <div className="font-semibold text-xs text-white truncate">{imgFile.name}</div>
                  <div className="text-[10px] text-white/50">{imgFile.size}</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
