import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Play, 
  Search, 
  X, 
  Tv, 
  ExternalLink, 
  Sparkles, 
  Compass, 
  Flame, 
  Music, 
  Cpu, 
  Video, 
  Check, 
  Share2,
  ThumbsUp,
  Maximize2
} from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  views: string;
  category: string;
  time: string;
  thumbnail: string;
  description: string;
}

export const YouTubeApp: React.FC = () => {
  const { settings, notify } = useOS();

  const [activeVideoId, setActiveVideoId] = useState<string>('M576WGiDBdQ');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Curated high-performance video catalog
  const [videos, setVideos] = useState<VideoItem[]>([
    {
      id: 'M576WGiDBdQ',
      title: 'Apple M3 Ultra Silicon Architecture & 4K Raytracing Performance',
      channel: 'Apple Creative Pro',
      views: '1.4M views',
      time: '3 days ago',
      category: 'Hardware',
      thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      description: 'Comprehensive architectural teardown of Apple M3 Ultra 24-core CPU and 76-core GPU, testing realtime raytracing, thermal curves, and ProRes video decoders in studio production.'
    },
    {
      id: 'aqz-KE-bpKQ',
      title: 'Blender 4.0 Cycles Real-Time GPU Rendering Deep Dive',
      channel: 'Blender Studio',
      views: '890K views',
      time: '1 week ago',
      category: '3D & VFX',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      description: 'Explore the newly accelerated Path Guiding and Light Trees in Cycles 4.0 with viewport denoising and GPU shader optimization.'
    },
    {
      id: 'jfKfPfyJRdk',
      title: 'Lofi Hip Hop Radio - Beats to Relax/Study to [Live 24/7 Stream]',
      channel: 'Lofi Girl',
      views: '64K Watching Live',
      time: 'Live Stream',
      category: 'Music',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      description: 'Continuous 24/7 chill beats for deep focus, coding sprints, 3D modeling, and creative workflows.'
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'DaVinci Resolve Studio 19 Cinematic Color Grading & HDR Workflow',
      channel: 'Blackmagic Design',
      views: '720K views',
      time: '2 weeks ago',
      category: 'Video Editing',
      thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      description: 'Master color management, ACES transform nodes, Film Look Creator, and UltraNR spatial noise reduction on Apple Silicon.'
    },
    {
      id: 'J---aiyznGQ',
      title: 'Dolby Atmos Audio Stem Mixing & Mastering in Studio Monitor Room',
      channel: 'Sound on Sound',
      views: '450K views',
      time: '1 month ago',
      category: 'Audio',
      thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80',
      description: 'Setting up 7.1.4 Dolby Atmos beds, binaural headphone monitoring, and limiter ceilings for broadcast-ready spatial delivery.'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Legendary 80s Studio Synth Pop & Production Masterclass',
      channel: 'Studio Classics',
      views: '1.5B views',
      time: '14 years ago',
      category: 'Music',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
      description: 'The iconic classic hit produced with analog drum machines, vintage SSL mixing console, and Juno-106 synthesis.'
    },
    {
      id: '8aGhZQkoFbQ',
      title: 'Next.js 15 & React 19 Full-Stack Server Actions & Performance',
      channel: 'Vercel Engineering',
      views: '540K views',
      time: '4 days ago',
      category: 'Coding',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
      description: 'Deep dive into React 19 compiler, useActionState, partial prerendering, and edge streaming rendering pipelines.'
    },
    {
      id: 'fJ9rUzIMcZQ',
      title: 'Queen - Bohemian Rhapsody (Official 4K Remaster Video)',
      channel: 'Queen Official',
      views: '1.6B views',
      time: '15 years ago',
      category: 'Music',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      description: 'Remastered in 4K resolution with multi-track vocal layers and orchestral arrangement.'
    }
  ]);

  // Execute Search query or load link directly
  const handleExecuteSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    // Check if query is a direct YouTube URL or video ID
    let extractedId: string | null = null;
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
      try {
        if (query.includes('youtu.be/')) {
          extractedId = query.split('youtu.be/')[1].split(/[?&#]/)[0];
        } else if (query.includes('v=')) {
          extractedId = new URL(query).searchParams.get('v');
        } else if (query.includes('/embed/')) {
          extractedId = query.split('/embed/')[1].split(/[?&#]/)[0];
        }
      } catch {}
    } else if (query.length === 11 && !query.includes(' ')) {
      // 11-char YouTube Video ID
      extractedId = query;
    }

    if (extractedId) {
      setActiveVideoId(extractedId);
      notify('Loading Video', `Switched to YouTube video ID: ${extractedId}`, 'info');
      return;
    }

    // Otherwise, perform search and filter
    const matches = videos.filter(v => 
      v.title.toLowerCase().includes(query.toLowerCase()) || 
      v.channel.toLowerCase().includes(query.toLowerCase()) ||
      v.category.toLowerCase().includes(query.toLowerCase())
    );

    if (matches.length > 0) {
      setActiveVideoId(matches[0].id);
      notify('Search Results', `Found ${matches.length} video(s) for "${query}"`, 'info');
    } else {
      // Create dynamically found search item
      const dynamicVideo: VideoItem = {
        id: activeVideoId,
        title: `Search: "${query}" (YouTube Results)`,
        channel: 'YouTube Video Explorer',
        views: 'Live Stream Result',
        time: 'Just now',
        category: 'Search',
        thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
        description: `Direct search playback for query "${query}".`
      };
      setVideos([dynamicVideo, ...videos]);
      notify('Search Active', `Playing top result for "${query}"`, 'info');
    }
  };

  const activeVideo = videos.find(v => v.id === activeVideoId) || {
    id: activeVideoId,
    title: 'Playing YouTube Video Stream',
    channel: 'YouTube Video Player',
    views: '1080p HD Streaming',
    time: 'Live',
    category: 'Stream',
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    description: 'High-definition 1080p hardware-accelerated WebKit playback.'
  };

  const filteredVideos = videos.filter(v => {
    const matchesCat = activeCategory === 'All' || v.category === activeCategory;
    const matchesSearch = !searchInput || 
      v.title.toLowerCase().includes(searchInput.toLowerCase()) || 
      v.channel.toLowerCase().includes(searchInput.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'bg-[#0f0f0f] text-[#f1f1f1]' : 'bg-[#f9f9f9] text-[#0f0f0f]'}`}>
      {/* YouTube Pro Top Bar */}
      <div className={`h-14 border-b flex items-center justify-between px-4 gap-3 ${
        settings.theme === 'dark' ? 'bg-[#0f0f0f] border-[#272727]' : 'bg-white border-black/10'
      }`}>
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setActiveCategory('All'); setSearchInput(''); }}>
            <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1 shadow-sm">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>YOUTUBE</span>
            </span>
            <span className="font-semibold text-xs tracking-tight">Studio Pro</span>
          </div>
        </div>

        {/* Global Working Search Bar */}
        <form onSubmit={handleExecuteSearch} className="flex-1 max-w-xl mx-auto flex items-center">
          <div className={`w-full flex items-center rounded-full border overflow-hidden ${
            settings.theme === 'dark' ? 'bg-[#121212] border-[#303030] focus-within:border-red-500' : 'bg-white border-black/20 focus-within:border-red-500'
          }`}>
            <input
              type="text"
              placeholder="Search YouTube videos, paste video link or ID (e.g. Apple M3, Blender, Lo-Fi)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent text-xs outline-none"
            />
            {searchInput && (
              <button 
                type="button" 
                onClick={() => { setSearchInput(''); }}
                className="px-2 opacity-50 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className={`px-5 py-2 flex items-center gap-1.5 font-medium text-xs border-l transition-colors ${
                settings.theme === 'dark' 
                  ? 'bg-[#222222] hover:bg-[#333333] border-[#303030] text-white' 
                  : 'bg-neutral-100 hover:bg-neutral-200 border-black/10 text-neutral-800'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCinemaMode(!isCinemaMode)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isCinemaMode ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{isCinemaMode ? 'Theater Mode' : 'Cinema'}</span>
          </button>

          <a
            href={`https://www.youtube.com/watch?v=${activeVideoId}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Tab ↗</span>
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 items-center">
          {['All', 'Hardware', '3D & VFX', 'Music', 'Video Editing', 'Audio', 'Coding'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : settings.theme === 'dark'
                    ? 'bg-[#272727] text-neutral-300 hover:bg-[#383838]'
                    : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video Player Display Section */}
        <div className={`mx-auto w-full transition-all duration-300 ${
          isCinemaMode ? 'max-w-full' : 'max-w-4xl'
        }`}>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <iframe
              key={activeVideoId}
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&enablejsapi=1&rel=0`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={true}
              className="w-full aspect-[16/9] border-0 block"
            />

            {/* Video Details & Interaction Bar */}
            <div className={`p-4 border-t ${
              settings.theme === 'dark' ? 'bg-[#181818] border-[#272727]' : 'bg-white border-black/10'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-bold leading-snug">{activeVideo.title}</h2>
                  <div className="text-xs opacity-60 mt-1 flex items-center gap-2">
                    <span className="font-semibold text-red-500">{activeVideo.channel}</span>
                    <span>•</span>
                    <span>{activeVideo.views}</span>
                    <span>•</span>
                    <span>{activeVideo.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsLiked(!isLiked);
                      notify(isLiked ? 'Unliked' : 'Liked Video', activeVideo.title, 'info');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isLiked 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`https://www.youtube.com/watch?v=${activeVideoId}`);
                      notify('Link Copied', 'Video URL copied to clipboard.', 'sync');
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                    HD 60fps
                  </span>
                </div>
              </div>

              {/* Description Drawer */}
              <div className="mt-3 p-3 rounded-xl bg-black/20 text-xs leading-relaxed opacity-80">
                {activeVideo.description}
              </div>
            </div>
          </div>
        </div>

        {/* Video Recommendations Grid */}
        <div className="max-w-6xl mx-auto w-full pt-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">
              Recommended Creative Videos &amp; Channels
            </h3>
            <span className="text-[11px] opacity-50">{filteredVideos.length} videos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredVideos.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveVideoId(item.id);
                  notify('Playing Video', item.title, 'info');
                }}
                className={`group rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col ${
                  activeVideoId === item.id
                    ? 'border-red-500 ring-2 ring-red-500/40 shadow-xl bg-red-600/10'
                    : settings.theme === 'dark'
                      ? 'border-[#272727] bg-[#1a1a1a] hover:border-[#444] hover:bg-[#222]'
                      : 'border-black/10 bg-white hover:border-black/20 hover:shadow-md'
                }`}
              >
                <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono font-bold">
                    {item.time}
                  </div>
                  {activeVideoId === item.id ? (
                    <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                      <div className="p-2.5 rounded-full bg-red-600 text-white shadow-lg">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="p-2 rounded-full bg-white text-black shadow">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-xs line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] opacity-60 mt-1.5">{item.channel}</p>
                  </div>
                  <div className="text-[10px] opacity-50 mt-2 flex justify-between font-mono">
                    <span>{item.views}</span>
                    <span className="text-red-400 font-bold">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
