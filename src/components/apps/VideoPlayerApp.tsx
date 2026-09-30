import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  SkipBack, 
  SkipForward, 
  PictureInPicture, 
  Repeat, 
  Film, 
  Upload, 
  List, 
  Info, 
  Check, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sliders,
  Settings
} from 'lucide-react';
import { sounds } from '../../utils/sound';

interface VideoPlayerAppProps {
  initialFileId?: string;
  initialFileName?: string;
  initialVideoUrl?: string;
}

interface VideoTrack {
  id: string;
  title: string;
  url: string;
  source: 'sample' | 'workstation' | 'upload';
  duration?: string;
  resolution?: string;
}

const PRELOADED_VIDEOS: VideoTrack[] = [
  {
    id: 'sample-bunny',
    title: 'Big Buck Bunny (Blender Studio 4K Animation)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    source: 'sample',
    duration: '09:56',
    resolution: '1920 × 1080 (ProRes)'
  },
  {
    id: 'sample-tears',
    title: 'Tears of Steel (Blender Sci-Fi VFX Reel)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    source: 'sample',
    duration: '12:14',
    resolution: '1920 × 1080 (Cinema 2.39:1)'
  },
  {
    id: 'sample-sintel',
    title: 'Sintel (Fantasy CGI Animation Feature)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    source: 'sample',
    duration: '00:52',
    resolution: '1920 × 1080'
  },
  {
    id: 'sample-elephants',
    title: 'Elephants Dream (Open Movie Studio)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    source: 'sample',
    duration: '10:53',
    resolution: '1920 × 1080'
  }
];

export const VideoPlayerApp: React.FC<VideoPlayerAppProps> = ({
  initialFileId,
  initialFileName,
  initialVideoUrl
}) => {
  const { files, settings, notify } = useOS();

  // Find videos from workstation file system
  const workstationVideos: VideoTrack[] = files
    .filter(f => f.type === 'video' || f.name.match(/\.(mp4|webm|mov|mkv|avi)$/i))
    .map(f => ({
      id: f.id,
      title: f.name,
      url: f.content || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      source: 'workstation' as const,
      duration: '4K Master'
    }));

  const allTracks = [...workstationVideos, ...PRELOADED_VIDEOS];

  // Active Video State
  const [currentTrack, setCurrentTrack] = useState<VideoTrack>(() => {
    if (initialVideoUrl) {
      return {
        id: initialFileId || 'initial-video',
        title: initialFileName || 'Video Playback',
        url: initialVideoUrl,
        source: 'workstation'
      };
    }
    return allTracks[0] || PRELOADED_VIDEOS[0];
  });

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPos, setHoverSeekPos] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  // Update track when initial props change
  useEffect(() => {
    if (initialVideoUrl) {
      setCurrentTrack({
        id: initialFileId || 'initial-video',
        title: initialFileName || 'Video Playback',
        url: initialVideoUrl,
        source: 'workstation'
      });
      setIsPlaying(false);
    }
  }, [initialVideoUrl, initialFileName, initialFileId]);

  // Sync volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.loop = isLooping;
    }
  }, [volume, isMuted, playbackSpeed, isLooping]);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play / Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    sounds.playPop();
  };

  // Jump by seconds (-10s / +10s)
  const jumpSeconds = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
    sounds.playPop();
  };

  // Step Frame-by-Frame (1/30 second)
  const stepFrame = (deltaFrames: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + (deltaFrames / 30)));
    sounds.playPop();
  };

  // Scrubber Seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * duration;
    setCurrentTime(video.currentTime);
  };

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekPos(e.clientX - rect.left);
    setHoverSeekTime(pos * duration);
  };

  // Toggle Picture-in-Picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Auto-hide controls during mouse inactivity
  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3500);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`h-full flex select-none font-sans text-xs overflow-hidden ${settings.theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-950 text-white'}`}
    >
      {/* Hidden file input to open local videos from laptop */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            const newTrack: VideoTrack = {
              id: `upload-${Date.now()}`,
              title: file.name,
              url,
              source: 'upload',
              resolution: 'Local Laptop File'
            };
            setCurrentTrack(newTrack);
            setIsPlaying(false);
            sounds.playPop();
            notify('Video Loaded', `Opened ${file.name} from your computer.`, 'info');
          }
        }}
      />

      {/* Main Video Viewport & Floating Control Bar */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-black overflow-hidden group">
        {/* Top Header Bar (Overlaid on Hover) */}
        <div className={`absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight truncate max-w-sm sm:max-w-md">
                {currentTrack.title}
              </span>
              <span className="text-[10px] text-white/60 font-mono">
                {videoDimensions.width > 0 ? `${videoDimensions.width} × ${videoDimensions.height}` : 'ProRes 4K Ready'} • {playbackSpeed}x Speed
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open video from laptop"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Open File</span>
            </button>

            <button
              onClick={() => setShowPlaylist(prev => !prev)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showPlaylist ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-white/10 border-white/10 hover:bg-white/20 text-white/80'
              }`}
              title="Toggle Playlist Sidebar"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Element */}
        <video
          ref={videoRef}
          src={currentTrack.url}
          onClick={togglePlay}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              if (videoRef.current.buffered.length > 0) {
                setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
              }
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              setVideoDimensions({
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight
              });
            }
          }}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Big Center Play Indicator on Pause */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110 cursor-pointer z-10"
          >
            <Play className="w-7 h-7 fill-current ml-1" />
          </button>
        )}

        {/* Bottom Floating Glassmorphic Player Timeline & Controls Bar */}
        <div className={`absolute bottom-3 left-4 right-4 z-30 rounded-2xl bg-neutral-900/90 backdrop-blur-2xl border border-white/15 p-3 shadow-2xl flex flex-col space-y-2 transition-all duration-300 ${
          isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}>
          {/* Timeline Scrubber */}
          <div 
            onClick={handleSeek}
            onMouseMove={handleSeekMouseMove}
            onMouseLeave={() => setHoverSeekTime(null)}
            className="relative w-full h-2 rounded-full bg-white/20 hover:h-3 transition-all cursor-pointer group/scrub"
          >
            {/* Buffered Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 rounded-full bg-white/30"
              style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
            />

            {/* Current Progress Bar */}
            <div 
              className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />

            {/* Playhead Scrubber Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg border border-neutral-800 opacity-0 group-hover/scrub:opacity-100 transition-opacity"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />

            {/* Hover Timestamp Badge */}
            {hoverSeekTime !== null && (
              <div 
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 border border-white/20 text-[10px] font-mono text-white pointer-events-none shadow"
                style={{ left: `${hoverSeekPos}px` }}
              >
                {formatTime(hoverSeekTime)}
              </div>
            )}
          </div>

          {/* Lower Controls Row */}
          <div className="flex items-center justify-between pt-0.5 text-xs">
            {/* Left Controls: Play, Step, Jump, Volume */}
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => jumpSeconds(-10)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                title="Rewind 10 Seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => jumpSeconds(10)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                title="Forward 10 Seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Step Frame by Frame buttons */}
              <div className="hidden sm:flex items-center border-l border-white/10 pl-2 space-x-1">
                <button
                  onClick={() => stepFrame(-1)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/15 text-white/70 hover:text-white cursor-pointer"
                  title="Step Backward 1 Frame"
                >
                  -1f
                </button>
                <button
                  onClick={() => stepFrame(1)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/15 text-white/70 hover:text-white cursor-pointer"
                  title="Step Forward 1 Frame"
                >
                  +1f
                </button>
              </div>

              {/* Time Display */}
              <div className="font-mono text-[11px] text-white/80 pl-2">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/40 mx-1">/</span>
                <span className="text-white/50">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Volume, Speed, Loop, PiP, Fullscreen */}
            <div className="flex items-center space-x-2">
              {/* Volume Slider */}
              <div className="flex items-center space-x-1.5 group/vol">
                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-16 h-1 accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Playback Speed Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(prev => !prev)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-9 right-0 w-24 rounded-xl bg-neutral-900 border border-white/15 shadow-2xl p-1 z-50 flex flex-col space-y-0.5">
                    {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          setPlaybackSpeed(s);
                          setShowSpeedMenu(false);
                          sounds.playPop();
                        }}
                        className={`px-2 py-1 text-left rounded-lg text-[11px] font-mono transition-colors cursor-pointer flex items-center justify-between ${
                          playbackSpeed === s ? 'bg-sky-500 text-white font-bold' : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{s}x</span>
                        {playbackSpeed === s && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Loop Toggle */}
              <button
                onClick={() => {
                  setIsLooping(prev => !prev);
                  sounds.playPop();
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isLooping ? 'bg-sky-500/20 border-sky-400 text-sky-400' : 'border-transparent hover:bg-white/10 text-white/70 hover:text-white'
                }`}
                title="Loop Video"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* PiP */}
              <button
                onClick={togglePiP}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                title="Picture in Picture"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Video Playlist & Library Drawer */}
      {showPlaylist && (
        <div className="w-72 border-l border-white/10 bg-neutral-900/95 backdrop-blur-2xl flex flex-col shrink-0">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Film className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-xs text-white">Video Library</span>
            </div>
            <span className="text-[10px] text-white/50">{allTracks.length} Videos</span>
          </div>

          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
            {allTracks.map((track) => {
              const isSelected = currentTrack.url === track.url;
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrack(track);
                    setIsPlaying(true);
                    sounds.playPop();
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-2.5 ${
                    isSelected 
                      ? 'bg-sky-500/20 border-sky-400 ring-1 ring-sky-400/50 shadow-md' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center shrink-0 text-white/80 mt-0.5">
                    {isSelected && isPlaying ? (
                      <div className="flex items-end space-x-0.5 h-3">
                        <div className="w-1 bg-sky-400 animate-pulse h-full" />
                        <div className="w-1 bg-sky-400 animate-pulse h-2/3" />
                        <div className="w-1 bg-sky-400 animate-pulse h-4/5" />
                      </div>
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-white truncate leading-tight">
                      {track.title}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-white/50 mt-1">
                      <span className="capitalize">{track.source}</span>
                      {track.duration && (
                        <>
                          <span>•</span>
                          <span>{track.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Upload Action at Bottom of Drawer */}
          <div className="p-3 border-t border-white/10 bg-black/30">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load Video from Laptop</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
