import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { FileItem } from '../../types/os';
import { 
  Folder, 
  FileText, 
  Table, 
  Image, 
  Film, 
  Box, 
  Music, 
  Code, 
  Grid, 
  List, 
  Search, 
  Plus, 
  Upload, 
  Trash2, 
  Cloud, 
  CloudCheck, 
  HardDrive, 
  Sparkles,
  ExternalLink,
  Tag,
  Clock,
  Info,
  Presentation
} from 'lucide-react';

export const FinderApp: React.FC = () => {
  const { files, createFile, deleteFile, openApp, settings } = useOS();
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(files[0]?.id || null);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<FileItem['type']>('document');

  // Filter files
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (f.tags && f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    if (!matchesSearch) return false;

    if (selectedFolder === 'all') return true;
    if (selectedFolder === 'gdrive') return f.path.startsWith('/Google Drive');
    if (selectedFolder === '3d') return f.type === '3d_model';
    if (selectedFolder === 'textures') return f.type === 'image';
    if (selectedFolder === 'audio') return f.type === 'audio';
    if (selectedFolder === 'code') return f.type === 'code';
    if (selectedFolder === 'docs') return f.type === 'document' || f.type === 'spreadsheet';
    return true;
  });

  const selectedFile = files.find(f => f.id === selectedFileId);

  // File icon helper
  const getFileIcon = (type: FileItem['type']) => {
    switch (type) {
      case 'folder': return <Folder className="w-8 h-8 text-sky-400" />;
      case 'document': return <FileText className="w-8 h-8 text-blue-500" />;
      case 'spreadsheet': return <Table className="w-8 h-8 text-emerald-500" />;
      case 'presentation': return <Presentation className="w-8 h-8 text-amber-500" />;
      case 'image': return <Image className="w-8 h-8 text-purple-400" />;
      case 'video': return <Film className="w-8 h-8 text-rose-500" />;
      case '3d_model': return <Box className="w-8 h-8 text-amber-500" />;
      case 'audio': return <Music className="w-8 h-8 text-pink-400" />;
      case 'code': return <Code className="w-8 h-8 text-cyan-400" />;
    }
  };

  const handleOpenFile = (file: FileItem) => {
    if (file.name.endsWith('.key') || file.name.endsWith('.pptx') || file.type === 'presentation' || file.tags?.includes('presentation')) {
      openApp('keynote', { fileId: file.id, fileName: file.name, content: file.content });
    } else if (file.type === 'document') {
      openApp('gdocs', { fileId: file.id, fileName: file.name, content: file.content });
    } else if (file.type === 'spreadsheet') {
      openApp('gsheets', { fileId: file.id, fileName: file.name, content: file.content });
    } else if (file.type === '3d_model' || file.type === 'image') {
      openApp('creative_studio', { assetName: file.name, fileId: file.id });
    } else if (file.type === 'code') {
      openApp('terminal', { command: `cat "${file.path}"` });
    }
  };

  const handleCreateNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    createFile({
      name: newFileName.trim(),
      path: selectedFolder === 'gdrive' ? `/Google Drive/${newFileName.trim()}` : `/Creative Projects/${newFileName.trim()}`,
      type: newFileType,
      size: '1.2 KB',
      content: newFileType === 'document' ? '# New Document\nStart typing...' : '',
      tags: ['custom', selectedFolder],
      isCloudSynced: true,
      isOfflineAvailable: true
    });
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Finder Toolbar */}
      <div className={`h-11 border-b flex items-center justify-between px-3 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/50 border-white/10' : 'bg-neutral-100/70 border-black/10'
      }`}>
        {/* Navigation & View buttons */}
        <div className="flex items-center space-x-1">
          <div className="flex rounded-md p-0.5 bg-black/10 dark:bg-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white/20 shadow-sm text-sky-400' : 'opacity-60 hover:opacity-100'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-white/20 shadow-sm text-sky-400' : 'opacity-60 hover:opacity-100'}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

          {/* New Item */}
          <button
            onClick={() => setShowNewFileDialog(true)}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Asset</span>
          </button>
        </div>

        {/* Current Folder Breadcrumb */}
        <div className="opacity-60 text-[11px] truncate hidden md:block">
          Macintosh HD &gt; Creative Workflows &gt; {selectedFolder.toUpperCase()} ({filteredFiles.length} items)
        </div>

        {/* Search */}
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 opacity-50" />
          <input
            type="text"
            placeholder="Search Assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-7 pr-2 py-1 rounded-md text-xs outline-none border transition-colors ${
              settings.theme === 'dark' 
                ? 'bg-neutral-900/60 border-white/10 focus:border-sky-500' 
                : 'bg-white/80 border-black/15 focus:border-sky-500'
            }`}
          />
        </div>
      </div>

      {/* Main Body: Sidebar + File Grid/List + Detail Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-48 border-r p-2 flex flex-col space-y-3 overflow-y-auto ${
          settings.theme === 'dark' ? 'bg-neutral-900/40 border-white/10' : 'bg-neutral-50/70 border-black/10'
        }`}>
          <div>
            <div className="text-[10px] font-semibold opacity-50 px-2 py-1 uppercase tracking-wider">Favorites</div>
            <div className="space-y-0.5">
              <button 
                onClick={() => setSelectedFolder('all')} 
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  selectedFolder === 'all' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>All Project Assets</span>
              </button>
              <button 
                onClick={() => setSelectedFolder('gdrive')} 
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  selectedFolder === 'gdrive' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Drive</span>
              </button>
              <button 
                onClick={() => setSelectedFolder('docs')} 
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  selectedFolder === 'docs' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Docs &amp; Sheets</span>
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold opacity-50 px-2 py-1 uppercase tracking-wider">Creative Assets</div>
            <div className="space-y-0.5">
              <button 
                onClick={() => setSelectedFolder('3d')} 
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  selectedFolder === '3d' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-amber-400" />
                <span>3D Models (.blend)</span>
              </button>
              <button 
                onClick={() => setSelectedFolder('textures')} 
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  selectedFolder === 'textures' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <Image className="w-3.5 h-3.5 text-purple-400" />
                <span>4K Textures (.exr)</span>
              </button>
              <button 
                onClick={() => setSelectedFolder('audio')} 
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  selectedFolder === 'audio' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>Audio Stems (.wav)</span>
              </button>
              <button 
                onClick={() => setSelectedFolder('code')} 
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  selectedFolder === 'code' ? 'bg-sky-500 text-white font-medium' : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span>GLSL Shaders</span>
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold opacity-50 px-2 py-1 uppercase tracking-wider">Cloud Storage</div>
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px]">
              <div className="flex items-center space-x-1 text-sky-400 font-semibold mb-1">
                <Cloud className="w-3.5 h-3.5" />
                <span>Auto Backup On</span>
              </div>
              <p className="opacity-70 text-[10px]">Changes mirrored to Firebase &amp; Google Drive seamlessly.</p>
            </div>
          </div>
        </div>

        {/* File Content Area */}
        <div className="flex-1 p-3 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-2">
              <Folder className="w-12 h-12" />
              <p>No matching files found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredFiles.map((file) => {
                const isSelected = selectedFileId === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    onDoubleClick={() => handleOpenFile(file)}
                    className={`p-3 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm' 
                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="mb-2 relative">
                      {getFileIcon(file.type)}
                      {file.isCloudSynced && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white" title="Cloud Synced">
                          <Cloud className="w-2 h-2" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium truncate max-w-full text-xs">{file.name}</span>
                    <span className="text-[10px] opacity-50 mt-0.5">{file.size}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-12 py-1.5 px-3 font-semibold text-[11px] opacity-60 border-b border-white/10">
                <div className="col-span-6">Name</div>
                <div className="col-span-3">Date Modified</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-1 text-right">Sync</div>
              </div>
              {filteredFiles.map((file) => {
                const isSelected = selectedFileId === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    onDoubleClick={() => handleOpenFile(file)}
                    className={`grid grid-cols-12 py-2 px-3 items-center rounded-lg cursor-pointer transition-colors border ${
                      isSelected 
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300' 
                        : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="col-span-6 flex items-center space-x-2 truncate">
                      {getFileIcon(file.type)}
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="col-span-3 opacity-60 text-[11px]">{file.updatedAt}</div>
                    <div className="col-span-2 opacity-60 text-[11px]">{file.size}</div>
                    <div className="col-span-1 flex justify-end">
                      {file.isCloudSynced && <Cloud className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* File Detail Inspector Pane */}
        {selectedFile && (
          <div className={`w-64 border-l p-4 flex flex-col space-y-4 overflow-y-auto ${
            settings.theme === 'dark' ? 'bg-neutral-900/60 border-white/10' : 'bg-neutral-100/60 border-black/10'
          }`}>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-black/10 dark:bg-white/5 border border-white/10">
              <div className="mb-2">{getFileIcon(selectedFile.type)}</div>
              <h3 className="font-semibold text-sm break-all">{selectedFile.name}</h3>
              <p className="text-[11px] opacity-60 mt-1">{selectedFile.type.toUpperCase()} • {selectedFile.size}</p>
            </div>

            {/* Quick Open Action */}
            <button
              onClick={() => handleOpenFile(selectedFile)}
              className="w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
            >
              <span>Open in App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Metadata list */}
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="opacity-50 block">File Path:</span>
                <span className="font-mono break-all opacity-80">{selectedFile.path}</span>
              </div>
              <div>
                <span className="opacity-50 block">Last Modified:</span>
                <span className="opacity-80">{selectedFile.updatedAt}</span>
              </div>
              <div>
                <span className="opacity-50 block">Cloud Status:</span>
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Firebase &amp; Drive Synced</span>
                </span>
              </div>
              {selectedFile.tags && (
                <div>
                  <span className="opacity-50 block mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedFile.tags.map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 mt-auto">
              <button
                onClick={() => deleteFile(selectedFile.id)}
                className="w-full py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Asset Modal Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateNewFile} 
            className={`w-96 rounded-2xl p-5 shadow-2xl border ${
              settings.theme === 'dark' ? 'bg-neutral-800 text-neutral-200 border-white/15' : 'bg-white text-neutral-800 border-black/15'
            }`}
          >
            <h3 className="text-sm font-semibold mb-3">Create New Creative Asset</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] opacity-70 block mb-1">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concept_Master_Scene.doc"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-md border text-xs outline-none ${
                    settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-neutral-100 border-black/15'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] opacity-70 block mb-1">Asset Category</label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as FileItem['type'])}
                  className={`w-full px-3 py-1.5 rounded-md border text-xs outline-none ${
                    settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-neutral-100 border-black/15'
                  }`}
                >
                  <option value="document">Microsoft Word / Google Doc (.docx)</option>
                  <option value="spreadsheet">Microsoft Excel / Google Sheet (.xlsx)</option>
                  <option value="presentation">Microsoft PowerPoint / Keynote (.pptx)</option>
                  <option value="3d_model">3D Model Scene (.blend)</option>
                  <option value="image">Texture / Image Asset (.png)</option>
                  <option value="audio">Audio Stem (.wav)</option>
                  <option value="code">Code / Script (.ts / .py)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-5">
              <button
                type="button"
                onClick={() => setShowNewFileDialog(false)}
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
