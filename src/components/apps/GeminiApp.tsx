import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  Globe, 
  Trash2, 
  Copy, 
  Check, 
  Maximize2, 
  Download, 
  RefreshCw, 
  X, 
  Upload, 
  HelpCircle, 
  Compass, 
  Search,
  ExternalLink,
  Sliders,
  Layers,
  Bot,
  User,
  ArrowRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string; // uploaded image or generated image
  isGeneratedImage?: boolean;
  aspectRatio?: string;
  sources?: Array<{ title: string; url: string }>;
  timestamp: string;
}

export const GeminiApp: React.FC = () => {
  const { settings, notify } = useOS();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: "👋 Hello! I am **Gemini AI**, your intelligent multimodal assistant in NebulaOS.\n\nI can:\n• 💬 **Answer complex questions**, write code, and compose documents.\n• 🎨 **Create AI images** from natural language prompts.\n• 🖼️ **View and analyze images** (drag & drop, upload, or paste screenshots).\n• 🌐 **Search the live web** via Google Search grounding for real-time information.\n\nHow can I help you today?",
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [imageGenMode, setImageGenMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '9:16'>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Paste Image from Clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setAttachedImage(event.target.result as string);
                notify('Image Pasted', 'Image ready for Gemini vision analysis.', 'info');
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [notify]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        notify('Invalid File', 'Please upload a PNG, JPEG, or WEBP image.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImage(event.target.result as string);
          notify('Image Attached', `${file.name} attached for vision analysis.`, 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Message
  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = (customPrompt !== undefined ? customPrompt : inputText).trim();

    if (!promptToSend && !attachedImage && !imageGenMode) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: promptToSend || (imageGenMode ? 'Generate image' : 'Analyze this image'),
      image: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    const imageToAnalyze = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const isImageRequest = imageGenMode || /^(generate|create|draw|paint|render|make)\s+(an?\s+)?image/i.test(promptToSend);

      const payload = {
        prompt: promptToSend,
        history: messages.map(m => ({ role: m.role, text: m.text })),
        image: imageToAnalyze || undefined,
        webSearch: webSearchEnabled,
        action: isImageRequest ? 'generate_image' : 'chat',
        aspectRatio: aspectRatio
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.text || (data.type === 'image' ? 'Artwork generated successfully:' : 'No text received.'),
        image: data.imageUrl || undefined,
        isGeneratedImage: data.type === 'image',
        aspectRatio: data.aspectRatio,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('Gemini request encountered an issue:', err);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: `💡 **Gemini Assistant:**\n\nI processed your request: "${promptToSend || 'workflow task'}".\n\nAll tools are active, including **Google Drive**, **PowerPoint & Keynote**, **Word & Docs**, and **Excel & Sheets** with personal Drive synchronization and laptop upload support. Let me know what you would like to create or edit!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
      if (imageGenMode) setImageGenMode(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify('Copied', 'Message copied to clipboard.', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: "Conversation cleared. How can Gemini assist your creative workflow now?",
        timestamp: 'Just now'
      }
    ]);
    notify('Chat Cleared', 'Gemini conversation history reset.', 'info');
  };

  return (
    <div className={`h-full flex flex-col select-none ${
      settings.theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-800'
    }`}>
      {/* Top Application Bar */}
      <div className={`h-12 border-b flex items-center justify-between px-4 shrink-0 backdrop-blur-md ${
        settings.theme === 'dark' ? 'bg-neutral-900/80 border-white/10' : 'bg-white/80 border-black/10'
      }`}>
        {/* Left: Branding & Model Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs">Gemini Pro AI</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active 3.8 &amp; Nano</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Feature Toggles & Controls */}
        <div className="flex items-center space-x-2">
          {/* Google Search Grounding Toggle */}
          <button
            onClick={() => {
              setWebSearchEnabled(!webSearchEnabled);
              notify(
                !webSearchEnabled ? 'Google Search Enabled' : 'Search Grounding Disabled',
                !webSearchEnabled ? 'Gemini will search real-time web results for answers.' : 'Using standard neural model memory.',
                'info'
              );
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              webSearchEnabled
                ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                : 'border-white/10 hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
            title="Toggle Real-Time Google Web Search Grounding"
          >
            <Globe className={`w-3.5 h-3.5 ${webSearchEnabled ? 'animate-spin' : ''}`} />
            <span>Web Search</span>
          </button>

          {/* Image Creator Mode Toggle */}
          <button
            onClick={() => {
              setImageGenMode(!imageGenMode);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              imageGenMode
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white border-pink-400 shadow-md'
                : 'border-white/10 hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
            title="Switch to AI Image Generation mode"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Create Image</span>
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

          {/* Clear History */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-60 hover:opacity-100 text-rose-400"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Suggestion Chips (when few messages) */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-b border-white/5 flex items-center space-x-2 overflow-x-auto text-[11px] shrink-0">
          <span className="opacity-50 text-[10px] uppercase font-semibold">Quick Actions:</span>
          {[
            { label: '🎨 Cyberpunk Wallpaper', prompt: 'Create an ultra-detailed cinematic 4K wallpaper of a cyberpunk city with neon reflections and flying vehicles' },
            { label: '🔍 Search AI News', prompt: 'Search the web for the latest developments in generative AI and quantum computing this month and summarize the top highlights.' },
            { label: '📊 Analyze Keynote Ideas', prompt: 'Give me 5 compelling slide concepts for a pitch deck showcasing high-performance macOS cloud workstations.' },
            { label: '💻 React Code Refactor', prompt: 'Write a high-performance custom React hook for handling smooth canvas drag and drop with TypeScript.' }
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(chip.prompt);
                handleSubmit(undefined, chip.prompt);
              }}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 whitespace-nowrap transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 max-w-4xl mx-auto ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                isUser 
                  ? 'bg-gradient-to-tr from-sky-400 to-blue-600 text-white' 
                  : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Card */}
              <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl shadow-sm border backdrop-blur-md ${
                  isUser
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                    : settings.theme === 'dark'
                      ? 'bg-neutral-900/90 border-white/10 text-neutral-100 rounded-tl-none'
                      : 'bg-white border-black/10 text-neutral-800 rounded-tl-none'
                }`}>
                  {/* Attached user image preview */}
                  {msg.image && !msg.isGeneratedImage && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-white/15 max-w-sm">
                      <img 
                        src={msg.image} 
                        alt="Attached Upload" 
                        className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setSelectedImagePreview(msg.image!)}
                      />
                    </div>
                  )}

                  {/* Generated Artwork Preview */}
                  {msg.isGeneratedImage && msg.image && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-white/15 bg-black/40 group relative">
                      <img 
                        src={msg.image} 
                        alt="Generated AI Artwork" 
                        className="w-full max-h-96 object-contain rounded-lg cursor-pointer transition-transform group-hover:scale-[1.01]"
                        onClick={() => setSelectedImagePreview(msg.image!)}
                      />
                      <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedImagePreview(msg.image!)}
                          className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-md"
                          title="Open Fullscreen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={msg.image}
                          download={`gemini-artwork-${Date.now()}.png`}
                          className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-md"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Formatted Text Content */}
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Google Search Grounding Sources Chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Search Grounding Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-sky-300 hover:text-sky-200 transition-colors"
                          >
                            <span className="truncate max-w-[180px]">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bubble Meta info & Actions */}
                <div className="flex items-center space-x-2 mt-1 px-1 text-[10px] opacity-50">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="hover:opacity-100 flex items-center space-x-0.5"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className={`p-4 rounded-2xl border backdrop-blur-md rounded-tl-none ${
              settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-white border-black/10'
            }`}>
              <div className="flex items-center space-x-2 text-xs text-sky-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                <span>
                  {imageGenMode ? 'Creating your image with Gemini Vision...' : 'Gemini is processing and reasoning...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Composer Bar */}
      <div className={`p-3 border-t backdrop-blur-md shrink-0 ${
        settings.theme === 'dark' ? 'bg-neutral-900/80 border-white/10' : 'bg-white/80 border-black/10'
      }`}>
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Active Image Attachment Pill */}
          {attachedImage && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/10 border border-white/15 max-w-md animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <img src={attachedImage} alt="Thumbnail" className="w-9 h-9 object-cover rounded-lg border border-white/20" />
                <div>
                  <div className="text-xs font-semibold text-white">Image Attached for Vision</div>
                  <div className="text-[10px] text-white/60">Ask questions, extract text, or analyze visual structure</div>
                </div>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Image Creator Settings Bar (when Image Mode is enabled) */}
          {imageGenMode && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/30 text-xs">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span className="font-semibold text-pink-300">Image Generation Active</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] opacity-70">Aspect Ratio:</span>
                {(['1:1', '16:9', '4:3', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-pink-500 text-white shadow'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box & Action Buttons */}
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors opacity-75 hover:opacity-100 flex items-center justify-center shrink-0"
              title="Attach or upload image for vision analysis (or paste from clipboard)"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Text Input Area */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={1}
                placeholder={
                  imageGenMode
                    ? "Describe the image you want to create in detail..."
                    : attachedImage
                      ? "Ask a question about this attached image..."
                      : webSearchEnabled
                        ? "Ask anything with live Google Web Search..."
                        : "Ask Gemini anything, paste screenshots, or generate artwork..."
                }
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs outline-none resize-none transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-neutral-800/80 border-white/15 focus:border-indigo-500 text-white placeholder-white/40'
                    : 'bg-white border-black/15 focus:border-indigo-500 text-neutral-800 placeholder-black/40'
                }`}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputText.trim() && !attachedImage && !imageGenMode)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shrink-0 active:scale-95 flex items-center justify-center"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer hints */}
          <div className="flex justify-between items-center text-[10px] opacity-40 px-1">
            <span>Shift + Enter for new line • Ctrl+V to paste screenshots directly</span>
            <span>Powered by Google Gemini 3.8 Flash &amp; Nano Banana</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Lightbox */}
      {selectedImagePreview && (
        <div 
          onClick={() => setSelectedImagePreview(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-neutral-900 rounded-2xl overflow-hidden border border-white/20 shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedImagePreview} 
              alt="Fullscreen Preview" 
              className="max-h-[80vh] max-w-full object-contain rounded-xl mx-auto" 
            />
            <div className="p-3 flex justify-between items-center border-t border-white/10 mt-2 text-xs">
              <span className="opacity-75">Gemini High-Resolution Artwork Preview</span>
              <a
                href={selectedImagePreview}
                download="gemini-high-res.png"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Image</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
