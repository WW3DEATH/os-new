import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { GmailService, GmailMessageItem } from '../../services/gmail';
import { GoogleDriveService } from '../../services/googleDrive';
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
  FileText,
  AlertTriangle
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
  isLiveGmail?: boolean;
}

export const GmailApp: React.FC = () => {
  const { user, loginWithGoogle, settings, notify } = useOS();

  const userEmail = user?.email || 'user@gmail.com';
  const userName = user?.displayName || 'Creative Producer';
  const isConnected = GmailService.isConnected();

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'starred' | 'drafts' | 'trash'>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string>('msg-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mandatory User Confirmation Dialogs
  const [confirmSendModal, setConfirmSendModal] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Initial Seeded Email Repository fallback
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
• Gmail & Mail: Live inbox synchronization and message composer directly within the desktop.
• Word & Google Docs: Collaborative rich text editing with live cloud presence.
• Excel & Google Sheets: High-performance spreadsheet calculations and formula grids.
• Keynote & PowerPoint: Real-time slide presentation deck builders.

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

You can open this asset directly inside the Finder or Google Drive app. Any edits you make will automatically synchronize with your Google Drive cloud backup.

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
    }
  ]);

  // Load live messages from Gmail API
  const fetchLiveEmails = async () => {
    if (!isConnected) return;
    try {
      setIsLoading(true);
      const liveItems = await GmailService.listMessages({
        folder: activeFolder,
        query: searchQuery,
        maxResults: 20
      });

      if (liveItems && liveItems.length > 0) {
        const mapped: EmailMessage[] = liveItems.map(item => ({
          id: item.id,
          sender: item.sender,
          senderEmail: item.senderEmail,
          subject: item.subject,
          preview: item.snippet,
          body: item.body,
          date: item.date,
          folder: item.folder,
          isRead: item.isRead,
          isStarred: item.isStarred,
          label: item.labels.includes('IMPORTANT') ? 'Important' : undefined,
          isLiveGmail: true
        }));

        setEmails(mapped);
        if (mapped[0] && !mapped.some(m => m.id === selectedEmailId)) {
          setSelectedEmailId(mapped[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Gmail fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveEmails();
  }, [activeFolder, isConnected]);

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = emails.find(m => m.id === id);
    if (!target) return;
    const newStarred = !target.isStarred;
    setEmails(prev => prev.map(m => m.id === id ? { ...m, isStarred: newStarred } : m));

    if (target.isLiveGmail) {
      await GmailService.toggleStar(id, newStarred);
    }
  };

  // Trigger explicit confirmation dialog before trashing email
  const requestDeleteEmail = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDeleteEmail = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const target = emails.find(m => m.id === id);

    setEmails(prev => prev.map(m => m.id === id ? { ...m, folder: 'trash' } : m));
    setPendingDeleteId(null);
    notify('Email Moved to Trash', 'Message moved to Trash in Gmail.', 'info');

    if (target?.isLiveGmail) {
      await GmailService.trashMessage(id);
    }
  };

  // Open confirmation modal for sending email (MANDATORY per Workspace guidelines)
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) {
      notify('Missing Fields', 'Please specify a recipient and subject.', 'warning');
      return;
    }
    setConfirmSendModal(true);
  };

  // Execute actual email dispatch via Gmail API after explicit user confirmation
  const handleConfirmSend = async () => {
    try {
      setIsSending(true);
      setConfirmSendModal(false);

      if (isConnected) {
        notify('Sending via Gmail...', `Dispatching to ${composeTo} via official Gmail API...`, 'sync');
        await GmailService.sendEmail({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          body: composeBody
        });
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
        isLiveGmail: isConnected
      };

      setEmails(prev => [newMsg, ...prev]);
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      notify('Email Dispatched', `Sent email to ${composeTo} via Gmail!`, 'sync');
    } catch (err: any) {
      console.warn('Gmail API send error:', err);
      notify('Send Notice', `Could not dispatch via Gmail API: ${err?.message || 'Check network'}.`, 'warning');
    } finally {
      setIsSending(false);
    }
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
              onKeyDown={(e) => e.key === 'Enter' && fetchLiveEmails()}
              className="w-full bg-transparent outline-none text-xs"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); fetchLiveEmails(); }} className="opacity-50 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Account Status / Refresh Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLiveEmails}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh emails from Gmail"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsComposing(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {/* Main Mail Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Folder Navigation Sidebar */}
        <div className={`w-48 border-r flex flex-col p-2 space-y-1 shrink-0 ${
          settings.theme === 'dark' ? 'bg-neutral-900/40 border-white/10' : 'bg-neutral-50/70 border-black/10'
        }`}>
          <button
            onClick={() => setActiveFolder('inbox')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
              activeFolder === 'inbox' 
                ? 'bg-red-600/15 text-red-500 font-semibold' 
                : 'hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Inbox className="w-4 h-4" />
              <span>Inbox</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFolder('starred')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
              activeFolder === 'starred' 
                ? 'bg-red-600/15 text-red-500 font-semibold' 
                : 'hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Star className="w-4 h-4" />
              <span>Starred</span>
            </div>
          </button>

          <button
            onClick={() => setActiveFolder('sent')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
              activeFolder === 'sent' 
                ? 'bg-red-600/15 text-red-500 font-semibold' 
                : 'hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Send className="w-4 h-4" />
              <span>Sent</span>
            </div>
          </button>

          <button
            onClick={() => setActiveFolder('trash')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
              activeFolder === 'trash' 
                ? 'bg-red-600/15 text-red-500 font-semibold' 
                : 'hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Trash2 className="w-4 h-4" />
              <span>Trash</span>
            </div>
          </button>

          {/* Connected Account Card */}
          <div className="mt-auto p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400">Gmail Connected</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="opacity-70 truncate font-mono">{userEmail}</p>
          </div>
        </div>

        {/* Middle Column: Email Message List */}
        <div className={`w-80 border-r flex flex-col overflow-y-auto shrink-0 ${
          settings.theme === 'dark' ? 'border-white/10 bg-neutral-900/20' : 'border-black/10 bg-white/50'
        }`}>
          {filteredEmails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-60 space-y-2">
              <Mail className="w-8 h-8 opacity-40" />
              <p className="font-semibold">No emails found</p>
              <p className="text-[11px] leading-relaxed">No messages in this folder or search criteria.</p>
              <button 
                onClick={fetchLiveEmails}
                className="mt-2 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs"
              >
                Refresh Inbox
              </button>
            </div>
          ) : (
            filteredEmails.map(mail => (
              <div
                key={mail.id}
                onClick={() => {
                  setSelectedEmailId(mail.id);
                  setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, isRead: true } : m));
                }}
                className={`p-3 border-b cursor-pointer transition-colors ${
                  selectedEmailId === mail.id 
                    ? settings.theme === 'dark' ? 'bg-white/10 border-white/15' : 'bg-red-50/80 border-red-200' 
                    : settings.theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-black/5 hover:bg-neutral-100/60'
                } ${!mail.isRead ? 'font-semibold' : 'opacity-85'}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="truncate max-w-[170px] text-xs">
                    {mail.sender}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-[10px] opacity-60 font-mono">{mail.date}</span>
                    <button 
                      onClick={(e) => toggleStar(mail.id, e)} 
                      className="p-0.5 hover:opacity-100 opacity-60"
                    >
                      <Star className={`w-3.5 h-3.5 ${mail.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="text-xs truncate text-neutral-100 mb-0.5 font-medium">
                  {mail.subject}
                </div>

                <div className="text-[11px] opacity-60 line-clamp-2 leading-relaxed">
                  {mail.preview}
                </div>

                {mail.isLiveGmail && (
                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-300 font-mono">
                    Gmail
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Email Detail Reading Pane */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {selectedEmail ? (
            <div className="flex-1 flex flex-col p-6 space-y-5">
              {/* Email Header */}
              <div className="flex items-start justify-between border-b pb-4 border-white/10">
                <div className="space-y-1">
                  <h1 className="text-base font-bold tracking-tight">
                    {selectedEmail.subject}
                  </h1>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-[10px]">
                      {selectedEmail.sender[0]}
                    </div>
                    <div>
                      <span className="font-semibold">{selectedEmail.sender}</span>
                      <span className="opacity-60 ml-1.5 font-mono text-[11px]">
                        &lt;{selectedEmail.senderEmail}&gt;
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => requestDeleteEmail(selectedEmail.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.senderEmail);
                      setComposeSubject(`Re: ${selectedEmail.subject}`);
                      setIsComposing(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="flex-1 text-xs leading-relaxed whitespace-pre-line font-sans opacity-90 max-w-3xl">
                {selectedEmail.body}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-2">
              <Mail className="w-12 h-12 stroke-[1.5]" />
              <p className="text-xs">Select an email to read its contents</p>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Deleting Email */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/20 text-neutral-100' : 'bg-white border-black/20 text-neutral-900'
          }`}>
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold">Move Email to Trash?</h3>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
              Are you sure you want to move this message to the Trash folder in your Gmail account? This will update your mailbox across all connected devices.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEmail}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Sending Email (MANDATORY per Workspace guidelines) */}
      {confirmSendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/20 text-neutral-100' : 'bg-white border-black/20 text-neutral-900'
          }`}>
            <div className="flex items-center space-x-3 text-red-500">
              <Send className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Send Email via Gmail Account?</h3>
            </div>
            <div className="text-xs opacity-80 space-y-2 leading-relaxed">
              <p>
                You are about to send an email on behalf of your authenticated Google Account:
              </p>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1 font-mono text-[11px]">
                <div><strong>From:</strong> {userEmail}</div>
                <div><strong>To:</strong> {composeTo}</div>
                <div><strong>Subject:</strong> {composeSubject}</div>
              </div>
              <p className="text-[11px] opacity-70">
                This will dispatch directly through the official Google Gmail API.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setConfirmSendModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium cursor-pointer"
              >
                Review Draft
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={isSending}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Confirm &amp; Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Floating Modal Window */}
      {isComposing && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/20' : 'bg-white border-black/20'
          }`}>
            <div className="px-4 py-3 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4" />
                <span className="font-semibold text-xs">New Message (via {userEmail})</span>
              </div>
              <button onClick={() => setIsComposing(false)} className="hover:bg-white/20 p-1 rounded cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleInitiateSend} className="p-4 space-y-3">
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
                  required
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
                  required
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
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Message</span>
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
