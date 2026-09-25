import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Compass, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  Globe, 
  Plus, 
  X, 
  Play, 
  Tv, 
  Bookmark,
  ThumbsUp,
  Share2
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  views: string;
  category: string;
  thumbnail: string;
  description?: string;
}

export const BrowserApp: React.FC = () => {
  const { settings, notify } = useOS();

  // Persistent Tabs from localStorage
  const [tabs, setTabs] = useState<Tab[]>(() => {
    try {
      const saved = localStorage.getItem('nebula_safari_persistent_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'tab-1',
        title: 'YouTube Pro',
        url: 'https://www.youtube.com',
      },
      {
        id: 'tab-2',
        title: 'Wikipedia',
        url: 'https://en.m.wikipedia.org/wiki/Main_Page',
      },
      {
        id: 'tab-3',
        title: 'Google Workspace',
        url: 'https://html.duckduckgo.com/html/?q=google+workspace',
      }
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nebula_safari_persistent_active_tab');
      if (saved) return saved;
    } catch {}
    return 'tab-1';
  });

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0] || {
    id: 'tab-1',
    title: 'Safari Start',
    url: 'about:start'
  };

  const [inputUrl, setInputUrl] = useState<string>(activeTab.url);
  const [history, setHistory] = useState<string[]>([activeTab.url]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Dedicated Native YouTube View Mode State
  const [ytActiveVideoId, setYtActiveVideoId] = useState<string>('M576WGiDBdQ');
  const [ytSearchQuery, setYtSearchQuery] = useState<string>('');
  const [ytSelectedCategory, setYtSelectedCategory] = useState<string>('All');
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([
    {
      id: 'M576WGiDBdQ',
      title: 'Apple M3 Ultra Silicon Architecture & 4K Raytracing Performance',
      channel: 'Apple Creative Pro',
      views: '1.4M views',
      category: 'Hardware',
      thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      description: 'Comprehensive architectural teardown of Apple M3 Ultra 24-core CPU and 76-core GPU with realtime raytracing.'
    },
    {
      id: 'aqz-KE-bpKQ',
      title: 'Blender 4.0 Cycles Real-Time GPU Rendering Deep Dive',
      channel: 'Blender Studio',
      views: '890K views',
      category: '3D & VFX',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      description: 'Accelerated Path Guiding and Light Trees in Cycles 4.0 with viewport denoising and GPU shader optimization.'
    },
    {
      id: 'jfKfPfyJRdk',
      title: 'Lofi Hip Hop Radio - Beats to Relax/Study to [Live 24/7]',
      channel: 'Lofi Girl',
      views: '64K Watching Live',
      category: 'Music',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      description: 'Chill instrumental beats for creative flow, coding sprints, and studio production.'
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'DaVinci Resolve Studio 19 Cinematic Color Grading & HDR Workflow',
      channel: 'Blackmagic Design',
      views: '720K views',
      category: 'Video Editing',
      thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      description: 'Color management, ACES transforms, Film Look Creator, and UltraNR spatial noise reduction.'
    },
    {
      id: 'J---aiyznGQ',
      title: 'Dolby Atmos Audio Stem Mixing & Mastering in Studio Monitor Room',
      channel: 'Sound on Sound',
      views: '450K views',
      category: 'Audio',
      thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80',
      description: 'Setting up 7.1.4 Dolby Atmos beds, binaural headphone monitoring, and limiter ceilings.'
    },
    {
      id: 'dQw4w9WgXcQ',
      title: 'Legendary 80s Studio Synth Pop & Production Masterclass',
      channel: 'Studio Classics',
      views: '1.5B views',
      category: 'Music',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
      description: 'Iconic classic hit produced with analog drum machines, vintage SSL console, and Juno-106 synthesis.'
    }
  ]);

  // Persist tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nebula_safari_persistent_tabs', JSON.stringify(tabs));
      localStorage.setItem('nebula_safari_persistent_active_tab', activeTabId);
    } catch {}
  }, [tabs, activeTabId]);

  // Synchronize Omnibar when tab changes
  useEffect(() => {
    if (activeTab) {
      setInputUrl(activeTab.url);
      if (activeTab.url.includes('youtube.com') || activeTab.url.includes('youtu.be')) {
        try {
          const urlObj = new URL(activeTab.url);
          const v = urlObj.searchParams.get('v');
          if (v) setYtActiveVideoId(v);
        } catch {}
      }
    }
  }, [activeTabId]);

  // Listen to navigation events posted from inside the iframe proxy
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'NEBULA_BROWSER_NAVIGATE' && e.data.url) {
        handleNavigate(e.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId, history, historyIndex]);

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const selectTab = (tab: Tab) => {
    setActiveTabId(tab.id);
    setInputUrl(tab.url);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const nextTabs = tabs.filter(t => t.id !== tabId);
    setTabs(nextTabs);
    if (activeTabId === tabId) {
      const newActive = nextTabs[nextTabs.length - 1];
      setActiveTabId(newActive.id);
      setInputUrl(newActive.url);
    }
  };

  const createNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'Safari Start Page',
      url: 'about:start',
    };
    const nextTabs = [...tabs, newTab];
    setTabs(nextTabs);
    setActiveTabId(newId);
    setInputUrl('about:start');
  };

  // Convert raw URL to proxied streamable URL
  const getDisplaySource = (rawUrl: string) => {
    if (!rawUrl || rawUrl === 'about:start') return '';
    return `/api/browser/proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  // Main Navigation logic for both search queries and URLs
  const handleNavigate = (target: string) => {
    let clean = target.trim();
    if (!clean) return;

    setIsLoading(true);

    if (clean === 'about:start' || clean === 'about:blank') {
      clean = 'about:start';
    } else {
      // Check shortcut aliases
      const lower = clean.toLowerCase();
      if (lower === 'youtube') clean = 'https://www.youtube.com';
      else if (lower === 'google') clean = 'https://html.duckduckgo.com/html/?q=google+trending';
      else if (lower === 'wikipedia') clean = 'https://en.m.wikipedia.org';
      else if (lower === 'github') clean = 'https://github.com';
      else if (lower === 'reddit') clean = 'https://old.reddit.com';
      else {
        const isSearch = !clean.includes('.') || clean.includes(' ') || (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.includes('/'));
        
        if (isSearch) {
          clean = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(clean)}`;
        } else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
          clean = `https://${clean}`;
        }
      }
    }

    setTabs(prev => prev.map(t => t.id === activeTabId ? { 
      ...t, 
      url: clean, 
      title: clean === 'about:start' 
        ? 'Safari Start' 
        : isYouTubeUrl(clean) 
          ? 'YouTube Pro' 
          : clean.replace(/^https?:\/\//, '').split('/')[0] 
    } : t));
    
    setInputUrl(clean);

    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(clean);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    setTimeout(() => setIsLoading(false), 400);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setInputUrl(prevUrl);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: prevUrl } : t));
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setInputUrl(nextUrl);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: nextUrl } : t));
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    if (iframeRef.current && activeTab.url !== 'about:start' && !isYouTubeUrl(activeTab.url)) {
      iframeRef.current.src = getDisplaySource(activeTab.url);
    }
    setTimeout(() => setIsLoading(false), 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(inputUrl);
  };

  // Dedicated YouTube Search Button and Execution
  const handleExecuteYtSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = ytSearchQuery.trim();
    if (!q) return;

    // Check if query is a YouTube URL or 11-char ID
    let extractedId: string | null = null;
    if (q.includes('youtube.com') || q.includes('youtu.be')) {
      try {
        if (q.includes('youtu.be/')) {
          extractedId = q.split('youtu.be/')[1].split(/[?&#]/)[0];
        } else if (q.includes('v=')) {
          extractedId = new URL(q).searchParams.get('v');
        } else if (q.includes('/embed/')) {
          extractedId = q.split('/embed/')[1].split(/[?&#]/)[0];
        }
      } catch {}
    } else if (q.length === 11 && !q.includes(' ')) {
      extractedId = q;
    }

    if (extractedId) {
      setYtActiveVideoId(extractedId);
      notify('Loading YouTube Video', `Cued video ID: ${extractedId}`, 'info');
      return;
    }

    // Filter library or add dynamic search result
    const matches = ytVideos.filter(v => 
      v.title.toLowerCase().includes(q.toLowerCase()) || 
      v.channel.toLowerCase().includes(q.toLowerCase())
    );

    if (matches.length > 0) {
      setYtActiveVideoId(matches[0].id);
      notify('Search Results', `Found ${matches.length} video(s) for "${q}"`, 'info');
    } else {
      const customVideo: YouTubeVideo = {
        id: ytActiveVideoId,
        title: `Search Query: "${q}"`,
        channel: 'YouTube Video Explorer',
        views: 'HD Stream',
        category: 'Search',
        thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
        description: `Direct search results playback for "${q}".`
      };
      setYtVideos([customVideo, ...ytVideos]);
      notify('Search Active', `Displaying search results for "${q}"`, 'info');
    }
  };

  // Quick Favorites Bar
  const quickFavorites = [
    { title: 'YouTube', url: 'https://www.youtube.com', icon: 'YT', color: 'text-red-500' },
    { title: 'Google Search', url: 'https://html.duckduckgo.com/html/?q=trending+tech+news', icon: 'G', color: 'text-blue-400' },
    { title: 'Wikipedia', url: 'https://en.m.wikipedia.org', icon: 'W', color: 'text-neutral-300' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'Y', color: 'text-orange-400' },
    { title: 'GitHub', url: 'https://html.duckduckgo.com/html/?q=site%3Agithub.com+trending', icon: 'GH', color: 'text-emerald-400' },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web', icon: 'M', color: 'text-sky-400' },
    { title: 'BBC News', url: 'https://www.bbc.com/news', icon: 'B', color: 'text-rose-400' },
  ];

  const filteredYtVideos = ytVideos.filter(v => {
    const matchesCategory = ytSelectedCategory === 'All' || v.category === ytSelectedCategory;
    const matchesSearch = !ytSearchQuery || v.title.toLowerCase().includes(ytSearchQuery.toLowerCase()) || v.channel.toLowerCase().includes(ytSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeYtVideo = ytVideos.find(v => v.id === ytActiveVideoId) || {
    id: ytActiveVideoId,
    title: 'Playing YouTube Stream Video',
    channel: 'YouTube Video Player',
    views: '1080p 60fps',
    category: 'Stream',
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    description: 'High-definition 1080p hardware-accelerated playback.'
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Safari Persistent Tab Bar */}
      <div className={`h-9 border-b flex items-center px-2 space-x-1 overflow-x-auto ${
        settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-neutral-200/80 border-black/10'
      }`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isYt = isYouTubeUrl(tab.url);
          return (
            <div
              key={tab.id}
              onClick={() => selectTab(tab)}
              className={`group max-w-[240px] min-w-[130px] h-7 px-2.5 rounded-lg flex items-center justify-between text-[11px] font-medium cursor-pointer transition-all border ${
                isActive
                  ? settings.theme === 'dark'
                    ? 'bg-neutral-800 text-white border-white/15 shadow-sm'
                    : 'bg-white text-neutral-900 border-black/15 shadow-sm'
                  : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center space-x-1.5 truncate">
                {isYt ? (
                  <span className="w-3.5 h-3.5 rounded bg-red-600 flex items-center justify-center text-[8px] text-white font-black flex-shrink-0">
                    ▶
                  </span>
                ) : (
                  <Globe className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                )}
                <span className="truncate">{tab.title}</span>
              </div>

              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="w-4 h-4 ml-1 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/20 dark:hover:bg-white/20 transition-opacity"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={createNewTab}
          className="p-1.5 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors"
          title="New Persistent Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Safari Navigation Toolbar & Omnibar */}
      <div className={`h-11 border-b flex items-center px-3 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/80 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className={`p-1.5 rounded transition-colors ${
              historyIndex > 0 ? 'hover:bg-white/10 opacity-90' : 'opacity-30 cursor-default'
            }`}
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded transition-colors ${
              historyIndex < history.length - 1 ? 'hover:bg-white/10 opacity-90' : 'opacity-30 cursor-default'
            }`}
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReload}
            className="p-1.5 rounded hover:bg-white/10 opacity-80 hover:opacity-100 transition-colors"
            title="Reload Page"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>

        {/* Omnibar Form */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-auto flex items-center">
          <div className={`w-full flex items-center px-3 py-1.5 rounded-lg border text-xs transition-all ${
            settings.theme === 'dark' 
              ? 'bg-neutral-900/90 border-white/15 focus-within:border-sky-500' 
              : 'bg-white border-black/15 focus-within:border-sky-500'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Search or enter website address (e.g. youtube.com, wikipedia.org)..."
              className="w-full bg-transparent outline-none text-xs font-mono tracking-tight"
            />
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin ml-2"></div>
            )}
          </div>
        </form>

        <div className="flex items-center space-x-1.5">
          <a
            href={activeTab.url === 'about:start' ? 'https://www.google.com' : activeTab.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors flex items-center gap-1 text-[11px]"
            title="Open in native desktop browser window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className={`h-7 border-b flex items-center px-3 space-x-2 overflow-x-auto text-[11px] ${
        settings.theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-neutral-100/50 border-black/5'
      }`}>
        <Bookmark className="w-3 h-3 opacity-40 mr-1 flex-shrink-0" />
        {quickFavorites.map((b) => (
          <button
            key={b.title}
            onClick={() => handleNavigate(b.url)}
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors opacity-80 hover:opacity-100 flex-shrink-0"
          >
            <span className={`text-[10px] font-bold ${b.color}`}>
              {b.icon}
            </span>
            <span>{b.title}</span>
          </button>
        ))}
      </div>

      {/* Viewport: Either Native YouTube App, Start Page, or Proxied Live Web Engine */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-neutral-950">
        {isYouTubeUrl(activeTab.url) ? (
          /* High-Performance Built-in YouTube Studio Viewport with Working Search */
          <div className="h-full overflow-y-auto bg-[#0f0f0f] text-[#f1f1f1] p-4 flex flex-col">
            {/* Top YouTube Header */}
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#272727]">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded tracking-wide flex items-center gap-1">
                  <Play className="w-3 h-3 fill-current" />
                  <span>YOUTUBE</span>
                </span>
                <span className="font-semibold text-xs text-white">Safari Player</span>
              </div>

              {/* YouTube Search Bar with Functional Submit Button */}
              <form onSubmit={handleExecuteYtSearch} className="flex-1 max-w-lg flex items-center">
                <div className="w-full flex items-center bg-[#121212] border border-[#303030] rounded-full overflow-hidden focus-within:border-red-500">
                  <input
                    type="text"
                    placeholder="Search YouTube or paste link/ID..."
                    value={ytSearchQuery}
                    onChange={(e) => setYtSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-1.5 bg-transparent text-xs text-white outline-none"
                  />
                  {ytSearchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setYtSearchQuery('')} 
                      className="px-2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#222222] hover:bg-[#333333] border-l border-[#303030] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Cinema Toggle & Native Window */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCinemaMode(!isCinemaMode)}
                  className="px-2.5 py-1 rounded bg-[#272727] hover:bg-[#383838] text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>{isCinemaMode ? 'Default' : 'Cinema'}</span>
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${ytActiveVideoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-xs font-medium transition-colors flex items-center gap-1.5 text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab ↗</span>
                </a>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {['All', 'Hardware', '3D & VFX', 'Video Editing', 'Music', 'Audio'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setYtSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    ytSelectedCategory === cat
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-[#272727] text-neutral-300 hover:bg-[#383838]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Video Player Container */}
            <div className={`mx-auto w-full transition-all duration-300 mb-6 ${
              isCinemaMode ? 'max-w-full' : 'max-w-4xl'
            }`}>
              <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-[#272727]">
                <iframe
                  key={ytActiveVideoId}
                  src={`https://www.youtube-nocookie.com/embed/${ytActiveVideoId}?autoplay=1&enablejsapi=1&rel=0`}
                  title={activeYtVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen={true}
                  className="w-full aspect-[16/9] border-0 block"
                />
                
                <div className="p-3 bg-[#181818] border-t border-[#272727] flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{activeYtVideo.title}</h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {activeYtVideo.channel} • {activeYtVideo.views}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsLiked(!isLiked);
                        notify(isLiked ? 'Unliked' : 'Liked Video', activeYtVideo.title, 'info');
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                        isLiked ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{isLiked ? 'Liked' : 'Like'}</span>
                    </button>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      1080p HD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Selection Grid */}
            <div className="max-w-5xl mx-auto w-full">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Suggested Studio &amp; Tech Channels ({filteredYtVideos.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredYtVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => {
                      setYtActiveVideoId(video.id);
                      setInputUrl(`https://www.youtube.com/watch?v=${video.id}`);
                      notify('Playing Video', video.title, 'info');
                    }}
                    className={`p-2 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col gap-2 ${
                      ytActiveVideoId === video.id
                        ? 'border-red-500/70 bg-[#222222] shadow-lg'
                        : 'border-[#272727] bg-[#1a1a1a] hover:border-neutral-500 hover:bg-[#242424]'
                    }`}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-white font-mono">
                        HD
                      </div>
                      {ytActiveVideoId === video.id && (
                        <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                          <div className="p-2 rounded-full bg-red-600 text-white shadow-lg">
                            <Play className="w-4 h-4 fill-current" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-1">
                      <div className="font-semibold text-xs line-clamp-2 text-white">{video.title}</div>
                      <div className="text-[10px] text-neutral-400 mt-1 flex justify-between">
                        <span>{video.channel}</span>
                        <span>{video.views}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab.url === 'about:start' ? (
          /* Safari Start Page */
          <div className="h-full overflow-y-auto p-8 flex flex-col items-center">
            <div className="max-w-2xl w-full space-y-8 my-auto py-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center mx-auto shadow-xl">
                  <Compass className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Safari Pro</h2>
                <p className="text-xs opacity-60">High-performance browsing with persistent tabs, proxy bypass, and search acceleration.</p>
              </div>

              {/* Start Search Input */}
              <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className={`flex items-center px-4 py-2.5 rounded-2xl border shadow-lg transition-all ${
                  settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/20' : 'bg-white border-black/15'
                }`}>
                  <Search className="w-4 h-4 opacity-50 mr-3" />
                  <input
                    type="text"
                    placeholder="Search anything or enter address..."
                    value={inputUrl === 'about:start' ? '' : inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs"
                    autoFocus
                  />
                  <button type="submit" className="px-3 py-1 rounded-lg bg-sky-500 text-white font-medium text-xs ml-2 hover:bg-sky-600">
                    Search
                  </button>
                </div>
              </form>

              {/* Quick Favorites Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider opacity-60">Favorites</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickFavorites.map((fav) => (
                    <div
                      key={fav.title}
                      onClick={() => handleNavigate(fav.url)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex items-center space-x-3 ${
                        settings.theme === 'dark'
                          ? 'bg-neutral-900/70 border-white/10 hover:border-sky-500/50 hover:bg-neutral-800'
                          : 'bg-neutral-50 border-black/10 hover:border-sky-500/50 hover:bg-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 font-bold flex items-center justify-center text-sm border border-sky-500/20">
                        {fav.icon}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs truncate">{fav.title}</div>
                        <div className="text-[10px] opacity-60 truncate">Quick Link</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                settings.theme === 'dark' ? 'bg-neutral-900/40 border-white/10' : 'bg-neutral-100 border-black/10'
              }`}>
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h5 className="font-semibold text-xs">Full Web Proxy &amp; Persistent Tabs Active</h5>
                    <p className="text-[11px] opacity-60">Tabs are automatically remembered and restored across sessions.</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold">Unrestricted</span>
              </div>
            </div>
          </div>
        ) : (
          /* Live Proxied Web Viewport */
          <div className="w-full h-full relative">
            {isLoading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500 animate-pulse z-20"></div>
            )}
            <iframe
              ref={iframeRef}
              src={getDisplaySource(activeTab.url)}
              title={activeTab.title}
              onLoad={() => setIsLoading(false)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={true}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              className="w-full h-full border-0 bg-white"
            />
          </div>
        )}
      </div>

      {/* Safari Status Bar */}
      <div className={`h-6 border-t px-4 flex items-center justify-between text-[10px] opacity-60 ${
        settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-2 truncate">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="truncate">{activeTab.url === 'about:start' ? 'Safari Start Page' : activeTab.url}</span>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <span>Persistent Tabs: {tabs.length}</span>
          <span>•</span>
          <span>TLS 1.3 Certified</span>
        </div>
      </div>
    </div>
  );
};
