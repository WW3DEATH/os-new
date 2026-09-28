import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { GoogleDriveService, GoogleDriveFile, DEDICATED_DRIVE_FOLDER_NAME, GoogleDriveFolder } from '../../services/googleDrive';
import { 
  HardDrive, 
  FileText, 
  Table, 
  Folder, 
  Upload, 
  Plus, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Presentation, 
  Check, 
  Download, 
  Trash2, 
  FileUp, 
  Image as ImageIcon, 
  FolderLock, 
  Globe,
  AlertTriangle,
  FolderTree,
  FileBox
} from 'lucide-react';

export const GoogleDriveApp: React.FC = () => {
  const { files, createFile, updateFile, deleteFile, openApp, user, syncStatus, triggerManualBackup, settings, notify, uploadFilesFromComputer } = useOS();
  
  const [activeTab, setActiveTab] = useState<'privateFolder' | 'allDrive'>('privateFolder');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [remoteFiles, setRemoteFiles] = useState<GoogleDriveFile[]>([]);
  const [allDriveFiles, setAllDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [privateFolder, setPrivateFolder] = useState<GoogleDriveFolder | null>(() => GoogleDriveService.getPrivateFolder());
  const [pendingDeleteFile, setPendingDeleteFile] = useState<{ id: string; name: string; isRemote: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load private folder & remote files
  const refreshDriveData = async () => {
    if (!GoogleDriveService.isConnected()) return;
    try {
      setIsLoadingRemote(true);
      const folder = await GoogleDriveService.getOrCreatePrivateFolder();
      setPrivateFolder(folder);
      
      const [livePrivateFiles, liveAllFiles] = await Promise.all([
        GoogleDriveService.listDriveFiles({ onlyPrivateFolder: true, maxResults: 50 }),
        GoogleDriveService.listAllUserFiles({ search: searchQuery, maxResults: 50 })
      ]);

      setRemoteFiles(livePrivateFiles);
      setAllDriveFiles(liveAllFiles);
    } catch (e: any) {
      console.warn('Error refreshing Google Drive live files:', e);
    } finally {
      setIsLoadingRemote(false);
    }
  };

  useEffect(() => {
    refreshDriveData();
  }, [activeTab]);

  // Local files mapped in /Google Drive
  const localDriveFiles = files.filter(f => f.path.startsWith('/Google Drive') && 
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     f.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleUploadFromLaptop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploaded = await uploadFilesFromComputer(e.target.files, '/Google Drive');
      
      // Also push each to user's private Google Drive folder
      if (GoogleDriveService.isConnected()) {
        notify('Syncing to Google Drive', `Uploading ${uploaded.length} file(s) into private folder '${DEDICATED_DRIVE_FOLDER_NAME}'...`, 'sync');
        for (const item of uploaded) {
          try {
            await GoogleDriveService.saveFileToDrive({
              name: item.name,
              content: item.content || '',
              mimeType: item.type === 'image' ? 'image/png' : 'text/plain',
              description: `Uploaded from laptop into NebulaOS private folder`
            });
          } catch (err) {
            console.warn('Live drive sync err:', err);
          }
        }
        await refreshDriveData();
      }

      notify('Uploaded to Private Drive', `Imported ${e.target.files.length} file(s) to personal Google Drive folder.`, 'sync');
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const uploaded = await uploadFilesFromComputer(e.dataTransfer.files, '/Google Drive');
      if (GoogleDriveService.isConnected()) {
        for (const item of uploaded) {
          try {
            await GoogleDriveService.saveFileToDrive({
              name: item.name,
              content: item.content || '',
              mimeType: item.type === 'image' ? 'image/png' : 'text/plain',
            });
          } catch (err) {
            console.warn('Live drive sync err:', err);
          }
        }
        await refreshDriveData();
      }
      notify('Uploaded to Private Drive', `Imported ${e.dataTransfer.files.length} file(s) to personal Google Drive folder.`, 'sync');
    }
  };

  const handleCreateDoc = async () => {
    const docName = `Untitled Document ${files.length + 1}.docx`;
    createFile({
      name: docName,
      path: `/Google Drive/${docName}`,
      type: 'document',
      size: '1.2 KB',
      content: '',
      tags: ['drive', 'docs', 'word'],
      isCloudSynced: true,
      isOfflineAvailable: true,
    });
    if (GoogleDriveService.isConnected()) {
      try {
        await GoogleDriveService.saveFileToDrive({
          name: docName,
          content: '',
          mimeType: 'text/plain',
        });
        refreshDriveData();
      } catch (e) {
        console.warn('Direct drive save err:', e);
      }
    }
    openApp('gdocs', { fileName: docName });
  };

  const handleCreateSheet = async () => {
    const sheetName = `Untitled Spreadsheet ${files.length + 1}.xlsx`;
    createFile({
      name: sheetName,
      path: `/Google Drive/${sheetName}`,
      type: 'spreadsheet',
      size: '2.4 KB',
      content: JSON.stringify({
        sheets: [{ name: 'Sheet1', data: [["Product", "Q1", "Q2", "Total"], ["Pro Plan", 120, 180, 300]] }]
      }),
      tags: ['drive', 'sheets', 'excel'],
      isCloudSynced: true,
      isOfflineAvailable: true,
    });
    if (GoogleDriveService.isConnected()) {
      try {
        await GoogleDriveService.saveFileToDrive({
          name: sheetName,
          content: 'Product,Q1,Q2,Total\nPro Plan,120,180,300',
          mimeType: 'text/csv',
        });
        refreshDriveData();
      } catch (e) {
        console.warn('Direct drive save err:', e);
      }
    }
    openApp('gsheets', { fileName: sheetName });
  };

  const handleCreateDeck = async () => {
    const deckName = `Untitled Deck ${files.length + 1}.pptx`;
    createFile({
      name: deckName,
      path: `/Google Drive/${deckName}`,
      type: 'presentation',
      size: '5.6 KB',
      content: JSON.stringify({ slides: [{ title: 'New Keynote Deck', subtitle: 'Created in Google Drive' }] }),
      tags: ['drive', 'keynote', 'powerpoint'],
      isCloudSynced: true,
      isOfflineAvailable: true,
    });
    if (GoogleDriveService.isConnected()) {
      try {
        await GoogleDriveService.saveFileToDrive({
          name: deckName,
          content: 'New Keynote Deck\nCreated in Google Drive',
          mimeType: 'text/plain',
        });
        refreshDriveData();
      } catch (e) {
        console.warn('Direct drive save err:', e);
      }
    }
    openApp('keynote', { fileName: deckName });
  };

  // Open an item in its respective workstation app or new browser tab
  const handleOpenRemoteFile = async (file: GoogleDriveFile) => {
    if (file.mimeType.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.txt')) {
      try {
        const text = await GoogleDriveService.exportOrDownloadFile(file.id, file.mimeType);
        openApp('gdocs', { initialFileName: file.name, initialContent: text });
      } catch {
        if (file.webViewLink) window.open(file.webViewLink, '_blank');
      }
    } else if (file.mimeType.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
      try {
        const csv = await GoogleDriveService.exportOrDownloadFile(file.id, file.mimeType);
        openApp('gsheets', { initialFileName: file.name, initialContent: csv });
      } catch {
        if (file.webViewLink) window.open(file.webViewLink, '_blank');
      }
    } else if (file.mimeType.includes('presentation') || file.name.endsWith('.pptx') || file.name.endsWith('.key')) {
      openApp('keynote', { initialFileName: file.name });
    } else if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  // Mandatory Confirmation Dialog for Deleting Google Drive files
  const confirmDeleteAction = async () => {
    if (!pendingDeleteFile) return;
    const { id, name, isRemote } = pendingDeleteFile;

    try {
      if (isRemote) {
        await GoogleDriveService.deleteDriveFile(id);
        setRemoteFiles(prev => prev.filter(f => f.id !== id));
        setAllDriveFiles(prev => prev.filter(f => f.id !== id));
        notify('Removed from Drive', `Deleted "${name}" from your Google Drive.`, 'info');
      } else {
        deleteFile(id);
        notify('Removed', `Deleted "${name}".`, 'info');
      }
    } catch (err: any) {
      notify('Delete Notice', `Could not delete: ${err?.message || 'Error'}`, 'warning');
    } finally {
      setPendingDeleteFile(null);
    }
  };

  const folderLink = privateFolder?.webViewLink || 'https://drive.google.com/drive/my-drive';

  return (
    <div 
      className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUploadFromLaptop} 
        multiple 
        className="hidden" 
      />

      {/* Top Header & Navigation Bar */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/80 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs">Google Drive</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium">
                Workspace Storage
              </span>
            </div>
            <div className="text-[10px] opacity-65 flex items-center space-x-2">
              <span>User: {user?.email || 'Authenticated User'}</span>
              <span>•</span>
              <span className="text-emerald-400">OAuth Bearer Token Active</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors text-xs cursor-pointer"
            title="Upload files, documents, or images to your personal Google Drive"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            onClick={handleCreateDoc}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors cursor-pointer"
            title="Create fresh new Word & Docs file in Google Drive"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Doc</span>
          </button>

          <button
            onClick={handleCreateSheet}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors cursor-pointer"
            title="Create fresh new Excel & Sheets file in Google Drive"
          >
            <Table className="w-3.5 h-3.5" />
            <span>New Sheet</span>
          </button>

          <button
            onClick={handleCreateDeck}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm transition-colors cursor-pointer"
            title="Create fresh new PowerPoint & Keynote deck in Google Drive"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>New Deck</span>
          </button>

          <button
            onClick={refreshDriveData}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Refresh Live Google Drive Files"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRemote ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Dedicated Folder Navigation */}
      <div className={`px-4 py-2 border-b flex items-center justify-between gap-3 ${
        settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-50/80 border-black/10'
      }`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('privateFolder')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'privateFolder'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'hover:bg-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            <span>Workstation Folder ('{DEDICATED_DRIVE_FOLDER_NAME}')</span>
          </button>

          <button
            onClick={() => setActiveTab('allDrive')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-2 transition-colors cursor-pointer ${
              activeTab === 'allDrive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'hover:bg-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All My Google Drive (Docs, Sheets, Slides)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {folderLink && (
            <a
              href={folderLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Open in Google Drive ↗</span>
            </a>
          )}
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="p-3 border-b flex items-center justify-between gap-3 bg-white/5 border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50" />
          <input
            type="text"
            placeholder={activeTab === 'privateFolder' ? "Search workstation folder..." : "Search all Google Drive files..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && refreshDriveData()}
            className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border transition-colors ${
              settings.theme === 'dark' ? 'bg-neutral-900 border-white/15 focus:border-emerald-500' : 'bg-white border-black/15 focus:border-emerald-500'
            }`}
          />
        </div>

        <div className="text-[11px] opacity-70 flex items-center space-x-2">
          <span>{activeTab === 'privateFolder' ? `${localDriveFiles.length + remoteFiles.length} file(s) in folder` : `${allDriveFiles.length} item(s) found`}</span>
          {isLoadingRemote && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />}
        </div>
      </div>

      {/* Files Grid View */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'privateFolder' ? (
          // View 1: Dedicated Private Folder ('NebulaOS Workstation')
          localDriveFiles.length === 0 && remoteFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FolderLock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Your Private Folder is Active</h4>
                <p className="text-xs opacity-65 max-w-sm">
                  Create new Word documents, Excel spreadsheets, PowerPoint decks, or upload existing files and images directly from your computer into '{DEDICATED_DRIVE_FOLDER_NAME}'.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md cursor-pointer"
              >
                Upload File from Computer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Local files */}
              {localDriveFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => {
                    if (file.type === 'document') openApp('gdocs', { fileId: file.id, fileName: file.name, content: file.content });
                    else if (file.type === 'spreadsheet') openApp('gsheets', { fileId: file.id, fileName: file.name, content: file.content });
                    else if (file.type === 'presentation' || file.name.endsWith('.key') || file.name.endsWith('.pptx')) openApp('keynote', { fileId: file.id, fileName: file.name, content: file.content });
                    else if (file.type === 'image') notify('Image File', `${file.name} is stored in Google Drive.`, 'info');
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
                      ) : file.type === 'image' ? (
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium flex items-center space-x-1 border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>In Private Drive</span>
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs truncate mb-1">{file.name}</h4>
                  <p className="text-[10px] opacity-60">Modified: {file.updatedAt || 'Recently'} • {file.size}</p>

                  <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                    <span className="text-sky-400 flex items-center space-x-1 hover:underline">
                      <span>Open in {file.type === 'spreadsheet' ? 'Sheets' : file.type === 'presentation' ? 'PowerPoint' : 'Docs'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteFile({ id: file.id, name: file.name, isRemote: false });
                      }}
                      className="opacity-40 hover:opacity-100 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Remote live Drive files */}
              {remoteFiles.filter(rf => !localDriveFiles.some(lf => lf.name === rf.name)).map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleOpenRemoteFile(file)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                    settings.theme === 'dark' 
                      ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/60 hover:bg-emerald-950/40' 
                      : 'bg-emerald-50/50 border-emerald-500/20 hover:border-emerald-500/60 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-medium flex items-center space-x-1">
                      <Globe className="w-2.5 h-2.5" />
                      <span>Google Drive Synced</span>
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs truncate mb-1">{file.name}</h4>
                  <p className="text-[10px] opacity-60">Modified: {file.modifiedTime || 'On Google Drive'} • {file.size || 'Synced'}</p>

                  <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                    <span className="text-emerald-400 flex items-center space-x-1 hover:underline">
                      <span>Open File</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteFile({ id: file.id, name: file.name, isRemote: true });
                      }}
                      className="opacity-40 hover:opacity-100 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      title="Delete from Google Drive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // View 2: All My Google Drive (Docs, Sheets, Presentations)
          allDriveFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-70">
              <Globe className="w-12 h-12 opacity-50" />
              <h4 className="font-bold text-sm">No Google Drive Files Found</h4>
              <p className="text-xs max-w-sm">
                No matching Google Docs, Sheets, or Slides found for "{searchQuery}". Click Refresh to reload from Google Drive API.
              </p>
              <button
                onClick={refreshDriveData}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer"
              >
                Reload from Drive
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allDriveFiles.map((file) => {
                const isDoc = file.mimeType.includes('document') || file.name.endsWith('.docx');
                const isSheet = file.mimeType.includes('spreadsheet') || file.name.endsWith('.xlsx');
                const isPresentation = file.mimeType.includes('presentation') || file.name.endsWith('.pptx');

                return (
                  <div
                    key={file.id}
                    onClick={() => handleOpenRemoteFile(file)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                      settings.theme === 'dark' 
                        ? 'bg-neutral-800/40 border-white/10 hover:border-emerald-500/50 hover:bg-neutral-800/80' 
                        : 'bg-white/70 border-black/10 hover:border-emerald-500/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-black/10 dark:bg-white/10">
                        {isSheet ? (
                          <Table className="w-5 h-5 text-emerald-400" />
                        ) : isPresentation ? (
                          <Presentation className="w-5 h-5 text-amber-400" />
                        ) : isDoc ? (
                          <FileText className="w-5 h-5 text-blue-400" />
                        ) : (
                          <HardDrive className="w-5 h-5 text-sky-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium flex items-center space-x-1 border border-emerald-500/20">
                        <Globe className="w-2.5 h-2.5" />
                        <span>Google Drive</span>
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs truncate mb-1">{file.name}</h4>
                    <p className="text-[10px] opacity-60">Modified: {file.modifiedTime || 'On Drive'} • {file.size || 'Remote'}</p>

                    <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                      <span className="text-emerald-400 flex items-center space-x-1 hover:underline">
                        <span>Open in {isDoc ? 'Docs' : isSheet ? 'Sheets' : isPresentation ? 'Keynote' : 'Drive'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteFile({ id: file.id, name: file.name, isRemote: true });
                        }}
                        className="opacity-40 hover:opacity-100 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete from Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Mandatory User Confirmation Dialog for Deleting Files from Google Drive */}
      {pendingDeleteFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full p-5 rounded-2xl border shadow-2xl space-y-4 ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/20 text-neutral-100' : 'bg-white border-black/20 text-neutral-900'
          }`}>
            <div className="flex items-center space-x-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold">Delete File from Google Drive?</h3>
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
              Are you sure you want to permanently delete <strong>"{pendingDeleteFile.name}"</strong> from your Google Drive? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setPendingDeleteFile(null)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
