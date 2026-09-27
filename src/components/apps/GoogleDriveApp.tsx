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
  Globe
} from 'lucide-react';

export const GoogleDriveApp: React.FC = () => {
  const { files, createFile, updateFile, deleteFile, openApp, user, syncStatus, triggerManualBackup, settings, notify, uploadFilesFromComputer } = useOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [remoteFiles, setRemoteFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [privateFolder, setPrivateFolder] = useState<GoogleDriveFolder | null>(() => GoogleDriveService.getPrivateFolder());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load private folder & remote files
  const refreshDriveData = async () => {
    if (!GoogleDriveService.isConnected()) return;
    try {
      setIsLoadingRemote(true);
      const folder = await GoogleDriveService.getOrCreatePrivateFolder();
      setPrivateFolder(folder);
      const liveFiles = await GoogleDriveService.listDriveFiles({ onlyPrivateFolder: true, maxResults: 50 });
      setRemoteFiles(liveFiles);
    } catch (e: any) {
      console.warn('Error refreshing Google Drive live files:', e);
    } finally {
      setIsLoadingRemote(false);
    }
  };

  useEffect(() => {
    refreshDriveData();
  }, []);

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
    const payload = JSON.stringify({
      title: sheetName,
      sheets: [{ id: 'sheet-1', name: 'Sheet 1', headers: ['A', 'B', 'C', 'D', 'E'], rows: [ ['', '', '', '', ''] ] }]
    });
    createFile({
      name: sheetName,
      path: `/Google Drive/${sheetName}`,
      type: 'spreadsheet',
      size: '1.4 KB',
      tags: ['drive', 'sheets', 'excel'],
      isCloudSynced: true,
      isOfflineAvailable: true,
      content: payload
    });
    if (GoogleDriveService.isConnected()) {
      try {
        await GoogleDriveService.saveFileToDrive({
          name: sheetName,
          content: payload,
          mimeType: 'application/json',
        });
        refreshDriveData();
      } catch (e) {
        console.warn('Direct drive save err:', e);
      }
    }
    openApp('gsheets', { fileName: sheetName });
  };

  const handleCreateDeck = async () => {
    const deckName = `Untitled Presentation ${files.length + 1}.pptx`;
    const payload = JSON.stringify([
      {
        id: 's1',
        layout: 'title',
        title: 'Untitled Presentation',
        subtitle: 'Click to edit subtitle',
        body: 'Start creating slides and customize transitions.',
        theme: 'neon',
        transition: 'morph',
        transitionSpeed: 'normal'
      }
    ]);
    createFile({
      name: deckName,
      path: `/Google Drive/${deckName}`,
      type: 'presentation',
      size: '2.1 KB',
      tags: ['drive', 'presentation', 'keynote', 'powerpoint'],
      isCloudSynced: true,
      isOfflineAvailable: true,
      content: payload
    });
    if (GoogleDriveService.isConnected()) {
      try {
        await GoogleDriveService.saveFileToDrive({
          name: deckName,
          content: payload,
          mimeType: 'application/json',
        });
        refreshDriveData();
      } catch (e) {
        console.warn('Direct drive save err:', e);
      }
    }
    openApp('keynote', { fileName: deckName });
  };

  const folderLink = privateFolder?.webViewLink || (privateFolder?.id ? `https://drive.google.com/drive/folders/${privateFolder.id}` : 'https://drive.google.com');

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
      onDrop={handleDrop}
      className={`h-full flex flex-col select-none text-xs relative ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}
    >
      {/* Hidden file input for uploading from computer */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={handleUploadFromLaptop}
      />

      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-emerald-950/85 backdrop-blur-md border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center p-6 text-center">
          <Upload className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
          <h3 className="text-base font-bold text-white mb-1">Drop files to upload to Private Google Drive</h3>
          <p className="text-xs text-emerald-200">Files will be stored in your private '{DEDICATED_DRIVE_FOLDER_NAME}' folder via your personal OAuth token.</p>
        </div>
      )}

      {/* Drive Header */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/60 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs flex items-center space-x-1.5">
              <span>Google Drive Private Storage</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                {DEDICATED_DRIVE_FOLDER_NAME}
              </span>
            </div>
            <div className="text-[10px] opacity-65 flex items-center space-x-2">
              <span>User: {user?.email || 'Authenticated User'}</span>
              <span>•</span>
              <span className="text-emerald-400">OAuth Token Active</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors text-xs cursor-pointer"
            title="Upload files, documents, or images to your private Google Drive folder"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload from Laptop</span>
          </button>

          <button
            onClick={handleCreateDoc}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors cursor-pointer"
            title="Create fresh new Word & Docs file in private Google Drive"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Doc</span>
          </button>

          <button
            onClick={handleCreateSheet}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors cursor-pointer"
            title="Create fresh new Excel & Sheets file in private Google Drive"
          >
            <Table className="w-3.5 h-3.5" />
            <span>New Sheet</span>
          </button>

          <button
            onClick={handleCreateDeck}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm transition-colors cursor-pointer"
            title="Create fresh new PowerPoint & Keynote deck in private Google Drive"
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

      {/* Account Verification & Private Folder Banner */}
      <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 ${
        settings.theme === 'dark' ? 'bg-emerald-950/25 border-emerald-500/20' : 'bg-emerald-50/80 border-emerald-500/20'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <FolderLock className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-xs text-emerald-400 flex items-center space-x-2">
              <span>Private Dedicated Folder: {DEDICATED_DRIVE_FOLDER_NAME}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                {privateFolder?.id ? `ID: ${privateFolder.id.substring(0, 8)}...` : 'Connected'}
              </span>
            </div>
            <div className="text-[10px] opacity-75">
              Configured with user's specific OAuth token. Files reside exclusively in your personal Google Drive account.
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {folderLink && (
            <a
              href={folderLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors flex items-center gap-1.5"
            >
              <span>Open in Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Files Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-xs opacity-75 uppercase tracking-wider flex items-center space-x-2">
            <span>Files in '{DEDICATED_DRIVE_FOLDER_NAME}' ({localDriveFiles.length + remoteFiles.length})</span>
            {isLoadingRemote && <span className="text-[10px] text-sky-400 normal-case">(fetching live...)</span>}
          </h4>
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 opacity-50" />
            <input
              type="text"
              placeholder="Search Drive files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-7 pr-2 py-1 rounded-md text-xs outline-none border transition-colors ${
                settings.theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/15'
              }`}
            />
          </div>
        </div>

        {localDriveFiles.length === 0 && remoteFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FolderLock className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">Your Private Google Drive Folder is Ready</h4>
              <p className="text-xs opacity-65 max-w-sm">
                Create new Word documents, Excel spreadsheets, PowerPoint decks, or upload existing files and images directly from your computer into '{DEDICATED_DRIVE_FOLDER_NAME}'.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md cursor-pointer"
            >
              Upload from Laptop Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Workstation Local Drive Files */}
            {localDriveFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => {
                  if (file.type === 'document') openApp('gdocs', { fileId: file.id, fileName: file.name, content: file.content });
                  else if (file.type === 'spreadsheet') openApp('gsheets', { fileId: file.id, fileName: file.name, content: file.content });
                  else if (file.type === 'presentation' || file.name.endsWith('.key') || file.name.endsWith('.pptx')) openApp('keynote', { fileId: file.id, fileName: file.name, content: file.content });
                  else if (file.type === 'image') notify('Image File', `${file.name} is stored in Google Drive. You can insert it into Word, Excel, or PowerPoint.`, 'info');
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
                      deleteFile(file.id);
                      notify('Removed', `Deleted ${file.name}`, 'info');
                    }}
                    className="opacity-40 hover:opacity-100 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Live Google Drive API Files in Private Folder */}
            {remoteFiles.filter(rf => !localDriveFiles.some(lf => lf.name === rf.name)).map((file) => (
              <div
                key={file.id}
                onClick={() => {
                  if (file.webViewLink) {
                    window.open(file.webViewLink, '_blank');
                  }
                }}
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
                    <span>Cloud Synced</span>
                  </span>
                </div>

                <h4 className="font-semibold text-xs truncate mb-1">{file.name}</h4>
                <p className="text-[10px] opacity-60">Modified: {file.modifiedTime || 'On Google Drive'} • {file.size || 'Synced'}</p>

                <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                  {file.webViewLink && (
                    <a 
                      href={file.webViewLink} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-400 flex items-center space-x-1 hover:underline"
                    >
                      <span>View in Google Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await GoogleDriveService.deleteDriveFile(file.id);
                      setRemoteFiles(prev => prev.filter(f => f.id !== file.id));
                      notify('Removed from Drive', `Deleted ${file.name} from Google Drive`, 'info');
                    }}
                    className="opacity-40 hover:opacity-100 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                    title="Delete from Google Drive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
