import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Palette, 
  Layers, 
  Play, 
  Flame, 
  Sparkles, 
  RotateCw, 
  Square, 
  Circle, 
  Brush, 
  Sliders, 
  Cpu, 
  CheckCircle2, 
  Eye, 
  Download 
} from 'lucide-react';

export const CreativeStudioApp: React.FC = () => {
  const { addRenderTask, hardware, settings, notify } = useOS();
  const [resolution, setResolution] = useState<'1080p' | '4K' | '8K'>('4K');
  const [samples, setSamples] = useState<number>(256);
  const [denoiser, setDenoiser] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<'brush' | 'circle' | 'rect'>('brush');
  const [brushColor, setBrushColor] = useState<string>('#38bdf8');
  const [isRenderingScene, setIsRenderingScene] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 3D Shader Viewport Simulation
  const [animAngle, setAnimAngle] = useState(0);
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setAnimAngle(prev => (prev + 0.5) % 360);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Handle Canvas Drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.fillStyle = brushColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (selectedTool === 'brush') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Dispatch Heavy Render Pipeline
  const handleStartRender = () => {
    setIsRenderingScene(true);
    setRenderProgress(0);

    // Queue in OS Hardware Engine
    addRenderTask({
      name: `Creative Studio Scene (${resolution} / ${samples} Samples)`,
      app: 'Creative Studio GPU Renderer',
      cpuLoad: resolution === '8K' ? 98 : 88,
      gpuLoad: resolution === '8K' ? 100 : 95,
      estimatedSecs: resolution === '8K' ? 120 : 45,
    });

    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRenderingScene(false);
          notify('Raytracing Render Complete', `Finished rendering ${resolution} master image.`, 'render');
          return 100;
        }
        return prev + 5;
      });
    }, 400);
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Top Studio Toolbar */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/70 border-white/10' : 'bg-neutral-100/80 border-black/10'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-fuchsia-400" />
            <span className="font-semibold text-xs">Creative Studio Pro</span>
            <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono text-[10px]">
              Metal 3 GPU Acceleration
            </span>
          </div>

          <div className="w-[1px] h-5 bg-white/10"></div>

          {/* Tools */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSelectedTool('brush')}
              className={`p-1.5 rounded transition-colors ${selectedTool === 'brush' ? 'bg-sky-500 text-white' : 'hover:bg-white/10'}`}
              title="Brush Tool"
            >
              <Brush className="w-3.5 h-3.5" />
            </button>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              title="Color Picker"
            />
          </div>
        </div>

        {/* Render Engine Affordance */}
        <div className="flex items-center space-x-2">
          {/* Resolution */}
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as any)}
            className={`px-2 py-1 rounded border text-xs outline-none ${
              settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
            }`}
          >
            <option value="1080p">1080p FHD</option>
            <option value="4K">4K UHD Master</option>
            <option value="8K">8K Ultra Cinema</option>
          </select>

          {/* Samples */}
          <select
            value={samples}
            onChange={(e) => setSamples(Number(e.target.value))}
            className={`px-2 py-1 rounded border text-xs outline-none ${
              settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
            }`}
          >
            <option value={64}>64 Samples</option>
            <option value={256}>256 Samples</option>
            <option value={1024}>1024 Raytrace Passes</option>
          </select>

          {/* Render Button */}
          <button
            onClick={handleStartRender}
            disabled={isRenderingScene}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold text-white shadow transition-all ${
              isRenderingScene 
                ? 'bg-amber-600 opacity-80 cursor-wait' 
                : 'bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-95'
            }`}
          >
            {isRenderingScene ? (
              <>
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                <span>Rendering {renderProgress}%</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Raytrace Render</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: 3D Viewport on Left, Paint Canvas on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Raytrace Viewport Simulation */}
        <div className={`w-1/2 border-r p-4 flex flex-col justify-between relative overflow-hidden ${
          settings.theme === 'dark' ? 'bg-neutral-950/80 border-white/10' : 'bg-neutral-900 text-white border-black/10'
        }`}>
          <div className="flex justify-between items-center z-10">
            <span className="text-[11px] font-mono opacity-80 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE SHADER VIEWPORT (P3 WIDE COLOR)</span>
            </span>
            <span className="text-[10px] font-mono opacity-60">120 FPS PROMOTION</span>
          </div>

          {/* Animated 3D Wireframe / Raytraced Cube */}
          <div className="flex-1 flex items-center justify-center relative">
            <div 
              className="w-48 h-48 rounded-3xl border-2 border-fuchsia-500/60 shadow-2xl relative flex items-center justify-center transition-transform"
              style={{
                transform: `perspective(600px) rotateX(${Math.sin(animAngle * 0.05) * 25}deg) rotateY(${animAngle}deg)`,
                background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.2), rgba(59, 130, 246, 0.1))',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div className="w-28 h-28 rounded-2xl border border-sky-400/80 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-fuchsia-400 animate-pulse" />
              </div>
            </div>

            {/* Overlay render progress if active */}
            {isRenderingScene && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                <Flame className="w-10 h-10 text-amber-400 animate-bounce mb-2" />
                <h4 className="font-semibold text-sm text-white">GPU Thermal Throttling Guard Active</h4>
                <p className="text-xs text-neutral-300 mt-1">Raytracing Pass: {renderProgress}%</p>
                <div className="w-64 h-2.5 rounded-full bg-white/20 mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300"
                    style={{ width: `${renderProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="z-10 flex justify-between items-center text-[10px] font-mono opacity-60">
            <span>TDP: 140W Uncapped</span>
            <span>Fan RPM: {hardware.fanRPM}</span>
          </div>
        </div>

        {/* Paint & Asset Sketching Surface */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-xs">Concept Asset Canvas</span>
            <span className="opacity-60 text-[10px]">Draw concept overlays with mouse or stylus</span>
          </div>

          <div className="flex-1 rounded-xl border border-white/10 overflow-hidden relative bg-white/5 dark:bg-black/40">
            <canvas
              ref={canvasRef}
              width={540}
              height={400}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-crosshair"
            />
          </div>
        </div>
      </div>

      {/* Studio Footer */}
      <div className={`h-7 border-t px-4 flex items-center justify-between text-[11px] opacity-70 ${
        settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/80 border-black/10'
      }`}>
        <div className="flex items-center space-x-3">
          <span>Engine: Metal 3 &amp; Vulkan</span>
          <span>•</span>
          <span>Color Profile: P3 Display Calibrated</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Hardware Fan Boost: {hardware.thermalMode.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
