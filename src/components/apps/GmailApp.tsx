import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Mail, 
  Inbox, 
  Send, 
  Star, 
  Trash2, 
  Archive, 
  Edit3, 
  Search, 
  RefreshCw, 
  Paperclip, 
  Tag, 
  User, 
  ShieldCheck, 
  Check, 
  X, 
  CornerUpLeft, 
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  FileText
} from 'lucide-react';

interface EmailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  folder: 'inbox' | 'sent' | 'starred' | 'drafts' | 'trash';
  isRead: boolean;
  isStarred: boolean;
  hasAttachment?: boolean;
  attachmentName?: string;
  label?: string;
}

export const GmailApp: React.FC = () => {
  const { user, loginWithGoogle, settings, notify } = useOS();

  const userEmail = user?.email || 'mnmjaasim@gmail.com';
  const userName = user?.displayName || 'Creative Producer';

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'starred' | 'drafts' | 'trash'>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string>('msg-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  // New compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Initial Seeded Email Repository
  const [emails, setEmails] = useState<EmailMessage[]>([
    {
      id: 'msg-1',
      sender: 'Google Workspace Team',
      senderEmail: 'workspace-noreply@google.com',
      subject: 'Welcome to Google Workspace on NebulaOS',
      preview: 'Your Google Account is now connected for seamless Google Drive and Gmail synchronization...',
      body: `Hello ${userName},

Your Google Account (${userEmail}) has been successfully authenticated in NebulaOS Desktop Pro.

Here is what is now synchronized to your personal Google workspace:
• Google Drive: Direct zero-server-overhead cloud storage for your creative assets.
• Word & Google Docs: Collaborative rich text editing with live presence.
• Excel & Google Sheets: High-performance spreadsheet calculations and formula grids.
• Keynote & PowerPoint: Real-time slide presentation deck builders.
• Gmail & Mail: Integrated inbox and message composer directly within the desktop.

Your files and emails remain strictly tied to your authenticated credentials (${userEmail}).

Best regards,
The Google Workspace Team`,
      date: '10:42 AM',
      folder: 'inbox',
      isRead: false,
      isStarred: true,
      label: 'Workspace'
    },
    {
      id: 'msg-2',
      sender: 'Google Drive Notifications',
      senderEmail: 'drive-shares-noreply@google.com',
      subject: 'Sarah Chen shared "Project Nebula 3D Asset Master" with you',
      preview: 'Sarah Chen has invited you to collaborate on the high-resolution texture map pipeline...',
      body: `Hi ${userName},

Sarah Chen (sarah.chen@studio.internal) has shared a new document with your account:

"Project Nebula 3D Asset Master.blend"

You can open this asset directly inside the Finder or Creative Studio app. Any edits you make will automatically synchronize with your Google Drive cloud backup.

Permission level: Can Edit`,
      date: 'Yesterday',
      folder: 'inbox',
      isRead: true,
      isStarred: false,
      hasAttachment: true,
      attachmentName: 'Asset_Pipeline_Specs.doc',
      label: 'Drive'
    },
    {
      id: 'msg-3',
      sender: 'YouTube Studio Insights',
      senderEmail: 'creator-insights@youtube.com',
      subject: 'Your video "Apple M3 Ultra 4K Raytracing" reached 1.4M views!',
      preview: 'Great news! Your video is trending in Hardware & Creative Computing...',
      body: `Creator Update:

Your latest upload "Apple M3 Ultra Silicon Architecture & 4K Raytracing" has surged past 1,400,000 views on YouTube Pro with an audience retention rate of 78%.

Top traffic sources:
• Safari Pro Browser Search (46%)
• Suggested Video Channels (38%)
• Embedded Keynote Decks (16%)

Keep up the stellar creative production!
The YouTube Creators Team`,
      date: 'Sep 24',
      folder: 'inbox',
      isRead: true,
      isStarred: true,
      label: 'YouTube'
    },
    {
      id: 'msg-4',
      sender: 'NebulaOS Render Queue',
      senderEmail: 'render-daemon@nebula.local',
      subject: 'Cycles 4K Batch Render Finished (120/120 frames)',
      preview: 'All 120 volumetric frames rendered with zero thermal throttling under Turbo Fan curve...',
      body: `Task ID: render-job-884
App: Creative Studio / Cycles Engine
Frames: 120 / 120 (100% Complete)
Average Temperature: 68°C (Peak: 74°C)
Fan Speed: 5,600 RPM
Status: Successfully cached to /Creative Projects/Scene_01_Final.exr`,
      date: 'Sep 23',
      folder: 'inbox',
      isRead: true,
      isStarred: false,
      label: 'System'
    }
  ]);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  const deleteEmail = (id: string) => {
    setEmails(prev => prev.map(m => m.id === id ? { ...m, folder: 'trash' } : m));
    notify('Email Moved to Trash', 'Message deleted from inbox.', 'info');
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) {
      notify('Missing Fields', 'Please specify a recipient and subject.', 'warning');
      return;
    }

    const newMsg: EmailMessage = {
      id: `msg-${Date.now()}`,
      sender: userName,
      senderEmail: userEmail,
      subject: composeSubject.trim(),
      preview: composeBody.slice(0, 80),
      body: composeBody,
      date: 'Just now',
      folder: 'sent',
      isRead: true,
      isStarred: false,
    };

    setEmails([newMsg, ...emails]);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    notify('Email Dispatched', `Sent email to ${composeTo}`, 'sync');
  };

  // Filtered emails based on folder and search query
  const filteredEmails = emails.filter(m => {
    const matchesFolder = activeFolder === 'starred' ? m.isStarred : m.folder === activeFolder;
    const matchesSearch = !searchQuery || 
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const selectedEmail = emails.find(m => m.id === selectedEmailId) || filteredEmails[0] || null;

  const unreadCount = emails.filter(m => m.folder === 'inbox' && !m.isRead).length;

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Top Gmail Navigation & Search Toolbar */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-3 ${
        settings.theme === 'dark' ? 'bg-neutral-800/80 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-red-600 text-white shadow-sm flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-red-500">Gmail</span>
              <span className="text-[11px] font-medium opacity-70">Workspace Mail</span>
            </div>
            <div className="text-[10px] opacity-60 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{userEmail}</span>
            </div>
          </div>
        </div>

        {/* Global Email Search Bar */}
        <div className="flex-1 max-w-md mx-auto">
          <div className={`flex items-center px-3 py-1.5 rounded-lg border text-xs transition-all ${
            settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/15 focus-within:border-red-500' : 'bg-white border-black/15 focus-within:border-red-500'
          }`}>
            <Search className="w-3.5 h-3.5 opacity-50 mr-2" />
            <input
              type="text"
              placeholder="Search in mail, sender, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-xs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="opacity-50 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Account Status / Connect Button */}
        <div className="flex items-center space-x-2">
          {user ? (
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
              {user.photoURL ? (
                <img src={user.photoURL} alt={userName} className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {userName[0]}
                </div>
              )}
              <span className="text-[11px] font-medium truncate max-w-[120px]">{userName}</span>
            </div>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Connect Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Mail Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={`w-48 border-r p-3 flex flex-col justify-between ${
          settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
        }`}>
          <div className="space-y-3">
            {/* Compose Button */}
            <button
              onClick={() => setIsComposing(true)}
              className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Compose</span>
            </button>

            {/* Navigation Folders */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveFolder('inbox')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFolder === 'inbox' 
                    ? 'bg-red-600/15 text-red-500 font-semibold' 
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Inbox</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveFolder('starred')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFolder === 'starred' 
                    ? 'bg-amber-500/15 text-amber-500 font-semibold' 
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Star className="w-3.5 h-3.5" />
                  <span>Starred</span>
                </div>
              </button>

              <button
                onClick={() => setActiveFolder('sent')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFolder === 'sent' 
                    ? 'bg-sky-500/15 text-sky-400 font-semibold' 
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Sent</span>
                </div>
              </button>

              <button
                onClick={() => setActiveFolder('trash')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFolder === 'trash' 
                    ? 'bg-rose-500/15 text-rose-400 font-semibold' 
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Trash</span>
                </div>
              </button>
            </nav>

            {/* Labels Section */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <span className="text-[10px] font-semibold opacity-50 uppercase tracking-wider block px-2">Labels</span>
              <div className="flex items-center space-x-2 px-2 py-1 text-[11px] opacity-70">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Workspace</span>
              </div>
              <div className="flex items-center space-x-2 px-2 py-1 text-[11px] opacity-70">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Google Drive</span>
              </div>
              <div className="flex items-center space-x-2 px-2 py-1 text-[11px] opacity-70">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>YouTube</span>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-white/5 text-[10px] opacity-60">
            <div>Storage: 2.4 GB / 15 GB</div>
            <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-red-500 h-full w-[16%]"></div>
            </div>
          </div>
        </div>

        {/* Center: Email Thread List */}
        <div className={`w-80 border-r flex flex-col ${
          settings.theme === 'dark' ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-black/10'
        }`}>
          <div className="p-2.5 border-b border-white/10 flex items-center justify-between text-[11px] font-semibold opacity-70">
            <span className="capitalize">{activeFolder} ({filteredEmails.length})</span>
            <button onClick={() => notify('Mail Refreshed', 'Inbox synchronized with Google.', 'sync')} className="hover:opacity-100">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center opacity-50 text-xs">
                No messages found in this folder.
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmailId(email.id);
                      setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isRead: true } : m));
                    }}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? settings.theme === 'dark'
                          ? 'bg-neutral-800 text-white'
                          : 'bg-red-50 text-neutral-900'
                        : !email.isRead
                          ? 'bg-white/5 font-semibold'
                          : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs truncate font-medium">{email.sender}</span>
                      <span className="text-[10px] opacity-60 flex-shrink-0">{email.date}</span>
                    </div>

                    <div className="text-xs font-medium truncate mb-1 text-red-400 dark:text-red-300">
                      {email.subject}
                    </div>

                    <div className="text-[11px] opacity-60 truncate">
                      {email.preview}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <div className="flex items-center space-x-1">
                        {email.label && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 font-mono">
                            {email.label}
                          </span>
                        )}
                        {email.hasAttachment && (
                          <Paperclip className="w-3 h-3 opacity-60" />
                        )}
                      </div>

                      <button
                        onClick={(e) => toggleStar(email.id, e)}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          email.isStarred ? 'text-amber-400' : 'opacity-40 hover:opacity-100'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Details Pane */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-neutral-950 p-6">
          {selectedEmail ? (
            <div className="max-w-3xl w-full mx-auto space-y-6">
              {/* Header */}
              <div className="border-b pb-4 flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold leading-tight mb-2">{selectedEmail.subject}</h2>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                      {selectedEmail.sender[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-xs flex items-center gap-2">
                        <span>{selectedEmail.sender}</span>
                        <span className="text-[11px] opacity-50 font-normal">&lt;{selectedEmail.senderEmail}&gt;</span>
                      </div>
                      <div className="text-[11px] opacity-60">To: {userEmail} • {selectedEmail.date}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      setIsComposing(true);
                      setComposeTo(selectedEmail.senderEmail);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      setComposeBody(`\n\n--- On ${selectedEmail.date}, ${selectedEmail.sender} wrote:\n${selectedEmail.body}`);
                    }}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px]"
                    title="Reply"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                  <button
                    onClick={() => deleteEmail(selectedEmail.id)}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Attachment card if any */}
              {selectedEmail.hasAttachment && (
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  settings.theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-neutral-50 border-black/10'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">{selectedEmail.attachmentName}</div>
                      <div className="text-[10px] opacity-60">Google Docs Format • 24 KB</div>
                    </div>
                  </div>
                  <button
                    onClick={() => notify('Attachment Saved', 'File downloaded to Google Drive.', 'sync')}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-medium"
                  >
                    Save to Drive
                  </button>
                </div>
              )}

              {/* Message Body */}
              <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans opacity-90">
                {selectedEmail.body}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-2">
              <Mail className="w-12 h-12" />
              <span>Select an email thread to view</span>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal Window */}
      {isComposing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/20 text-neutral-200' : 'bg-white border-black/20 text-neutral-800'
          }`}>
            <div className="px-4 py-3 border-b flex items-center justify-between bg-red-600 text-white font-semibold text-xs">
              <div className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5" />
                <span>New Message ({userEmail})</span>
              </div>
              <button onClick={() => setIsComposing(false)} className="hover:bg-white/20 p-1 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-4 space-y-3">
              <div>
                <input
                  type="email"
                  placeholder="To: (recipient email)"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                    settings.theme === 'dark' ? 'bg-neutral-800 border-white/15 focus:border-red-500' : 'bg-neutral-100 border-black/15 focus:border-red-500'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                    settings.theme === 'dark' ? 'bg-neutral-800 border-white/15 focus:border-red-500' : 'bg-neutral-100 border-black/15 focus:border-red-500'
                  }`}
                />
              </div>

              <div>
                <textarea
                  rows={8}
                  placeholder="Compose email..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none font-sans ${
                    settings.theme === 'dark' ? 'bg-neutral-800 border-white/15 focus:border-red-500' : 'bg-neutral-100 border-black/15 focus:border-red-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => notify('Attachment Added', 'Attached workspace brief to email draft.', 'info')}
                  className="p-1.5 rounded hover:bg-white/10 text-xs flex items-center gap-1 opacity-70 hover:opacity-100"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
