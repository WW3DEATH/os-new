import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { FileItem } from '../../types/os';
import { 
  HardDrive, 
  FileText, 
  Table, 
  Folder, 
  Upload, 
  Plus, 
  Search, 
  CloudCheck, 
  RefreshCw, 
  Users, 
  Download, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Presentation
} from 'lucide-react';

export const GoogleDriveApp: React.FC = () => {
  const { files, createFile, openApp, user, syncStatus, triggerManualBackup, teamPresence, settings } = useOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [offlineCacheActive, setOfflineCacheActive] = useState(true);

  // Files in Google Drive
  const driveFiles = files.filter(f => f.path.startsWith('/Google Drive') && 
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     f.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleCreateDoc = () => {
    createFile({
      name: `Untitled Document ${files.length + 1}.doc`,
      path: `/Google Drive/Untitled Document ${files.length + 1}.doc`,
      type: 'document',
      size: '4.8 KB',
      content: '# Untitled Document\nStart typing with your team...',
      tags: ['drive', 'docs'],
      isCloudSynced: true,
      isOfflineAvailable: true,
    });
  };

  const handleCreateSheet = () => {
    createFile({
      name: `Studio Financials & Renders ${files.length + 1}.sheet`,
      path: `/Google Drive/Studio Financials & Renders ${files.length + 1}.sheet`,
      type: 'spreadsheet',
      size: '8.2 KB',
      tags: ['drive', 'sheets'],
      isCloudSynced: true,
      isOfflineAvailable: true,
      content: JSON.stringify({
        title: 'Studio Financials & Renders',
        headers: ['Asset Pipeline', 'Department', 'Render Hours', 'Cost Rate ($)', 'Total ($)'],
        rows: [
          ['VFX Volumetrics', '3D Scene 01', '40', '3.50', '140.00'],
          ['Color Conform 4K', 'Post-Production', '18', '5.00', '90.00'],
          ['Dolby Atmos Mastering', 'Audio', '12', '8.00', '96.00']
        ]
      })
    });
  };

  const handleCreateDeck = () => {
    createFile({
      name: `Studio Keynote Deck ${files.length + 1}.key`,
      path: `/Google Drive/Studio Keynote Deck ${files.length + 1}.key`,
      type: 'presentation',
      size: '3.4 KB',
      tags: ['drive', 'presentation', 'keynote'],
      isCloudSynced: true,
      isOfflineAvailable: true,
      content: JSON.stringify([
        {
          id: 's1',
          layout: 'title',
          title: 'New Presentation Deck',
          subtitle: 'Created in Google Drive Explorer',
          body: 'Double click to edit slides, transitions, and animations.',
          theme: 'neon',
          transition: 'zoom',
          transitionSpeed: 'normal'
        }
      ])
    });
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Drive Header */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="font-semibold text-xs flex items-center space-x-1.5">
              <span>Google Drive Connected Storage</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
                Direct User Account
              </span>
            </div>
            <div className="text-[10px] opacity-60">
              Account: {user?.email || 'guest@studio.local'} • Zero server storage overhead
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {user?.email && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{user.email}</span>
            </div>
          )}

          <button
            onClick={handleCreateDoc}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Doc</span>
          </button>

          <button
            onClick={handleCreateSheet}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors"
          >
            <Table className="w-3.5 h-3.5" />
            <span>New Sheet</span>
          </button>

          <button
            onClick={handleCreateDeck}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm transition-colors"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>New Deck</span>
          </button>

          <button
            onClick={triggerManualBackup}
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            title="Sync Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collaboration banner & storage stats */}
      <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 ${
        settings.theme === 'dark' ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/70 border-emerald-500/20'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-1.5">
            {teamPresence.map((m, idx) => (
              <div 
                key={m.id || idx}
                className={`w-6 h-6 rounded-full border-2 border-neutral-900 text-[10px] font-bold text-white flex items-center justify-center shadow ${m.avatarColor}`}
                title={`${m.name} is editing documents live`}
              >
                {m.name[0]}
              </div>
            ))}
          </div>
          <div>
            <div className="font-semibold text-xs text-emerald-400 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5" />
              <span>Real-Time Team Collaboration Active</span>
            </div>
            <div className="text-[10px] opacity-70">
              Changes sync instantly across team devices with offline persistence.
            </div>
          </div>
        </div>

        {/* Offline Cache Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] opacity-70">Offline Synchronization:</span>
          <button
            onClick={() => setOfflineCacheActive(!offlineCacheActive)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              offlineCacheActive ? 'bg-emerald-500 text-white' : 'bg-neutral-700 text-neutral-300'
            }`}
          >
            {offlineCacheActive ? 'Enabled (IndexedDB / Local)' : 'Cloud Only'}
          </button>
        </div>
      </div>

      {/* Files Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-xs opacity-70 uppercase tracking-wider">Synced Google Workspace Files</h4>
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 opacity-50" />
            <input
              type="text"
              placeholder="Search Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-7 pr-2 py-1 rounded-md text-xs outline-none border transition-colors ${
                settings.theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/15'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {driveFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => {
                if (file.type === 'document') openApp('gdocs', { fileId: file.id, fileName: file.name, content: file.content });
                if (file.type === 'spreadsheet') openApp('gsheets', { fileId: file.id, fileName: file.name, content: file.content });
                if (file.type === 'presentation' || file.name.endsWith('.key') || file.name.endsWith('.pptx')) openApp('keynote', { fileId: file.id, fileName: file.name, content: file.content });
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                settings.theme === 'dark' 
                  ? 'bg-neutral-800/40 border-white/10 hover:border-emerald-500/50 hover:bg-neutral-800/80' 
                  : 'bg-white/70 border-black/10 hover:border-emerald-500/50 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-black/10 dark:bg-white/10">
                  {file.type === 'spreadsheet' ? (
                    <Table className="w-5 h-5 text-emerald-400" />
                  ) : file.type === 'presentation' || file.name.endsWith('.key') || file.name.endsWith('.pptx') ? (
                    <Presentation className="w-5 h-5 text-amber-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Synced</span>
                </span>
              </div>

              <h4 className="font-semibold text-xs truncate mb-1">{file.name}</h4>
              <p className="text-[10px] opacity-60">Modified: {file.updatedAt} • {file.size}</p>

              <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                <span className="text-sky-400 flex items-center space-x-1 hover:underline">
                  <span>Direct Edit in {file.type === 'spreadsheet' ? 'Sheets' : 'Docs'}</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
                <span className="opacity-50">Offline Cached</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
