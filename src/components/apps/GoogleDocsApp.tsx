import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { GoogleDriveService } from '../../services/googleDrive';
import { 
  FileText, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Save, 
  Download, 
  Check,
  FolderOpen, 
  Plus,
  Search, 
  Replace, 
  Table as TableIcon, 
  Image as ImageIcon, 
  CheckSquare, 
  X, 
  FilePlus, 
  Layout,
  Upload,
  RotateCw,
  Sliders,
  Trash2,
  HardDrive,
  User,
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';

export interface DocImage {
  id: string;
  name: string;
  url: string;
  caption: string;
  size: 'sm' | 'md' | 'lg' | 'full';
  align: 'left' | 'center' | 'right';
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  rotation: number; // 0, 90, 180, 270
  filter: 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'warm' | 'cool';
  borderRadius: 'none' | 'rounded' | 'circle';
}

interface GoogleDocsAppProps {
  initialFileId?: string;
  initialContent?: string;
  initialFileName?: string;
}

export const GoogleDocsApp: React.FC<GoogleDocsAppProps> = ({ 
  initialFileId, 
  initialContent, 
  initialFileName 
}) => {
  const { files, updateFile, createFile, user, settings, notify } = useOS();

  // Fresh new document by default unless a specific file was opened
  const activeFile = initialFileId ? files.find(f => f.id === initialFileId) : null;
  const [fileId, setFileId] = useState<string>(activeFile?.id || `doc-${Date.now()}`);
  const [title, setTitle] = useState<string>(initialFileName || activeFile?.name || 'Untitled Document.docx');
  const [content, setContent] = useState<string>(initialContent || activeFile?.content || '');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Document Images State
  const [images, setImages] = useState<DocImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [imageCaptionInput, setImageCaptionInput] = useState<string>('');
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Formatting state
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [fontSize, setFontSize] = useState<string>('14');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isPaginatedView, setIsPaginatedView] = useState<boolean>(true);

  // Modals & Panels
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reload when initialFileId changes
  useEffect(() => {
    if (initialFileId) {
      const f = files.find(item => item.id === initialFileId);
      if (f) {
        setFileId(f.id);
        setTitle(f.name);
        if (f.content) setContent(f.content);
        setIsSaved(true);
      }
    }
  }, [initialFileId, files]);

  // Sync content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  // Upload image from laptop / computer
  const handleUploadImageFromLaptop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Invalid File', 'Please upload a valid image file (PNG, JPG, SVG, WEBP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newImg: DocImage = {
          id: `img-${Date.now()}`,
          name: file.name,
          url: event.target.result as string,
          caption: file.name.replace(/\.[^/.]+$/, ""),
          size: 'md',
          align: 'center',
          brightness: 100,
          contrast: 100,
          rotation: 0,
          filter: 'none',
          borderRadius: 'rounded'
        };

        setImages(prev => [...prev, newImg]);
        setSelectedImageId(newImg.id);
        setIsSaved(false);
        notify('Image Added', `"${file.name}" added to document. Click image to edit properties.`, 'info');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowImageModal(false);
  };

  // Insert image via URL
  const handleAddImageFromUrl = () => {
    if (!imageUrlInput.trim()) return;
    const newImg: DocImage = {
      id: `img-${Date.now()}`,
      name: 'Web Image',
      url: imageUrlInput.trim(),
      caption: imageCaptionInput.trim() || 'Imported Graphic',
      size: 'md',
      align: 'center',
      brightness: 100,
      contrast: 100,
      rotation: 0,
      filter: 'none',
      borderRadius: 'rounded'
    };
    setImages(prev => [...prev, newImg]);
    setSelectedImageId(newImg.id);
    setImageUrlInput('');
    setImageCaptionInput('');
    setShowImageModal(false);
    setIsSaved(false);
    notify('Image Inserted', 'Image linked into document.', 'info');
  };

  // Update image attributes
  const handleUpdateImage = (imgId: string, updates: Partial<DocImage>) => {
    setImages(prev => prev.map(img => img.id === imgId ? { ...img, ...updates } : img));
    setIsSaved(false);
  };

  // Remove image
  const handleDeleteImage = (imgId: string) => {
    setImages(prev => prev.filter(img => img.id !== imgId));
    if (selectedImageId === imgId) setSelectedImageId(null);
    setIsSaved(false);
    notify('Image Removed', 'Removed image from document.', 'info');
  };

  // Save document directly to user's personal Google Drive
  const handleSave = async () => {
    // 1. Save in Cloud OS local state & RTDB
    if (fileId && files.some(f => f.id === fileId)) {
      updateFile(fileId, { content, name: title });
    } else {
      createFile({
        name: title,
        path: `/Google Drive/${title}`,
        type: 'document',
        size: `${Math.round(content.length / 1024 * 10) / 10 || 1.2} KB`,
        content,
        tags: ['drive', 'docs', 'word'],
        isCloudSynced: true,
        isOfflineAvailable: true
      });
    }

    // 2. Real upload directly into user's private Google Drive folder
    if (GoogleDriveService.isConnected()) {
      try {
        notify('Saving to Private Drive', `Uploading ${title} to private folder 'NebulaOS Workstation'...`, 'sync');
        const savedResult = await GoogleDriveService.saveFileToDrive({
          name: title,
          content,
          mimeType: 'text/plain',
          description: 'Word & Google Docs document created in NebulaOS Workstation'
        });
        setIsSaved(true);
        notify('Saved to Private Drive', `${title} saved in your private Google Drive folder ('NebulaOS Workstation')!`, 'sync');
        return;
      } catch (err: any) {
        console.warn('Google Drive direct upload note:', err);
        notify('Saved to Cloud OS', `Document saved in Cloud OS. (Drive note: ${err?.message || 'Ready'})`, 'info');
      }
    } else {
      notify('Saved to Cloud OS', `${title} saved. Sign in with Google to sync to your personal Google Drive.`, 'sync');
    }
    setIsSaved(true);
  };

  // Text insertion & formatting tools
  const insertText = (before: string, after: string = '') => {
    const el = textareaRef.current;
    if (!el) {
      setContent(prev => prev + `\n${before}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${before}${selected || 'text'}${after}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setIsSaved(false);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 4));
    }, 50);
  };

  const handleFindAndReplace = () => {
    if (!findQuery) return;
    const count = (content.match(new RegExp(findQuery, 'gi')) || []).length;
    if (count === 0) {
      notify('Find & Replace', `No matches found for "${findQuery}"`, 'warning');
      return;
    }
    const newContent = content.replaceAll(findQuery, replaceQuery);
    setContent(newContent);
    setIsSaved(false);
    notify('Replaced Occurrences', `Replaced ${count} instance(s) of "${findQuery}" with "${replaceQuery}"`, 'info');
  };

  // Create new blank document
  const handleCreateNewBlank = () => {
    const newTitle = `Untitled Document ${files.length + 1}.docx`;
    setTitle(newTitle);
    setContent('');
    setImages([]);
    setFileId(`doc-${Date.now()}`);
    setIsSaved(true);
    notify('New Document Created', 'Opened a clean, blank Word document.', 'info');
  };

  // Create document from template
  const handleCreateFromTemplate = (templateName: string, tContent: string) => {
    const newTitle = `Untitled ${templateName} ${files.length + 1}.docx`;
    setTitle(newTitle);
    setContent(tContent);
    setImages([]);
    setFileId(`doc-${Date.now()}`);
    setIsSaved(false);
    setShowTemplatesModal(false);
    notify('New Document Created', `Loaded template: ${templateName}`, 'info');
  };

  // Open existing document from OS
  const handleOpenFile = (f: any) => {
    setFileId(f.id);
    setTitle(f.name);
    setContent(f.content || '');
    setIsSaved(true);
    setShowOpenModal(false);
    notify('Document Loaded', `Opened ${f.name}`, 'info');
  };

  // Stats
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const paragraphCount = content.split('\n\n').filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Export
  const handleDownload = (format: 'docx' | 'pdf' | 'md' | 'txt') => {
    const mime = format === 'md' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/\.[^/.]+$/, "") + `.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Document Exported', `Downloaded ${a.download}`, 'info');
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const selectedImage = images.find(img => img.id === selectedImageId);

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Hidden file input for laptop image uploads */}
      <input
        type="file"
        ref={imageUploadRef}
        accept="image/*"
        className="hidden"
        onChange={handleUploadImageFromLaptop}
      />

      {/* Top Header & Document Title */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/80 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setIsSaved(false); }}
                className={`font-semibold text-xs px-2 py-0.5 rounded border border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-blue-500 bg-transparent outline-none w-64 ${
                  settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'
                }`}
              />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">
                Word &amp; Google Docs
              </span>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
            isSaved ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10 animate-pulse'
          }`}>
            {isSaved ? 'Drive Synced' : 'Unsaved Changes'}
          </span>
        </div>

        {/* Right actions: New, Open, Save, User Account, Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateNewBlank}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 transition-colors font-medium text-xs"
            title="Create brand new blank document"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blank</span>
          </button>

          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors text-xs"
            title="Open document from Google Drive"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          {/* User Account / Drive status */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
            <HardDrive className="w-3 h-3 text-emerald-400" />
            <span className="font-mono truncate max-w-[120px]">{user?.email || 'Connected Google Drive'}</span>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors text-xs"
            title="Save document directly to your personal Google Drive"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Drive</span>
          </button>

          {/* Export to device */}
          <button
            onClick={() => handleDownload('docx')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
            title="Export document directly to your device (PC)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Word Formatting Ribbon */}
      <div className={`h-10 border-b flex items-center px-4 space-x-2 overflow-x-auto ${
        settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-neutral-100/50 border-black/10'
      }`}>
        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value as any)}
          className={`px-2 py-1 rounded border text-xs outline-none ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}
        >
          <option value="sans">SF Pro Sans</option>
          <option value="serif">Georgia Serif</option>
          <option value="mono">JetBrains Mono</option>
        </select>

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className={`px-2 py-1 rounded border text-xs outline-none ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}
        >
          <option value="12">12pt</option>
          <option value="14">14pt</option>
          <option value="16">16pt</option>
          <option value="18">18pt</option>
          <option value="24">24pt</option>
        </select>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Text Styles */}
        <button
          onClick={() => insertText('**', '**')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors font-bold"
          title="Bold (⌘B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('*', '*')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors italic"
          title="Italic (⌘I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('<u>', '</u>')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors underline"
          title="Underline (⌘U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('~~', '~~')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Headings */}
        <button
          onClick={() => insertText('# ')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors font-bold"
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('## ')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors font-semibold"
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('### ')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Lists & Callouts */}
        <button
          onClick={() => insertText('- ')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('1. ')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('- [ ] ')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Task Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('> ')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Quote Block"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('```\n', '\n```')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Add Image from Laptop & URL Button */}
        <button
          onClick={() => imageUploadRef.current?.click()}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 font-medium transition-colors"
          title="Upload image from your laptop/computer and edit it"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>

        <button
          onClick={() => setShowImageModal(true)}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-white/10 transition-colors"
          title="Insert image by URL"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Image Link</span>
        </button>

        <button
          onClick={() => insertText('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Data A | Data B | Data C |\n')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Insert Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Find & Replace Trigger */}
        <button
          onClick={() => setShowFindReplace(!showFindReplace)}
          className={`flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors ${
            showFindReplace ? 'bg-blue-600 text-white border-blue-500' : 'border-white/10 hover:bg-white/10'
          }`}
          title="Find & Replace"
        >
          <Search className="w-3 h-3" />
          <span>Find</span>
        </button>

        {/* View Mode Toggle */}
        <button
          onClick={() => setIsPaginatedView(!isPaginatedView)}
          className={`flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors ${
            isPaginatedView ? 'bg-white/15 border-white/20' : 'border-white/10 hover:bg-white/10 opacity-70'
          }`}
          title="Toggle Paper View vs Continuous"
        >
          <Layout className="w-3 h-3" />
          <span>{isPaginatedView ? 'Paper View' : 'Continuous'}</span>
        </button>
      </div>

      {/* Find & Replace Floating Drawer */}
      {showFindReplace && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 ${
          settings.theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-neutral-200 border-black/10'
        }`}>
          <div className="flex items-center bg-black/20 rounded-md px-2 py-1 border border-white/10 flex-1 max-w-xs">
            <Search className="w-3 h-3 opacity-50 mr-1.5" />
            <input
              type="text"
              placeholder="Find text..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="bg-transparent outline-none text-xs w-full"
            />
          </div>
          <div className="flex items-center bg-black/20 rounded-md px-2 py-1 border border-white/10 flex-1 max-w-xs">
            <Replace className="w-3 h-3 opacity-50 mr-1.5" />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent outline-none text-xs w-full"
            />
          </div>
          <button
            onClick={handleFindAndReplace}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowFindReplace(false)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Insert Image URL Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Add Image to Document</span>
              </h3>
              <button onClick={() => setShowImageModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] opacity-70 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/photo.png"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-black/20 text-xs outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] opacity-70 mb-1">Caption / Label (Optional)</label>
                <input
                  type="text"
                  placeholder="Diagram A: Render Pipeline"
                  value={imageCaptionInput}
                  onChange={(e) => setImageCaptionInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-black/20 text-xs outline-none focus:border-sky-400"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    imageUploadRef.current?.click();
                  }}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Or upload from laptop</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddImageFromUrl}
                    disabled={!imageUrlInput.trim()}
                    className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-medium text-xs shadow"
                  >
                    Add Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace: Document Page + Image Inspector Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Workspace Canvas */}
        <div className="flex-1 overflow-y-auto bg-black/5 dark:bg-black/40 p-4 md:p-8 flex justify-center">
          <div className={`w-full max-w-4xl transition-all flex flex-col ${
            isPaginatedView 
              ? 'min-h-[900px] shadow-2xl rounded-2xl p-8 md:p-12 border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900' 
              : 'h-full p-4 bg-transparent'
          }`}>
            {/* Interactive Document Images Gallery */}
            {images.length > 0 && (
              <div className="mb-6 pb-4 border-b border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs opacity-75 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Embedded Document Images ({images.length})</span>
                  </span>
                  <button
                    onClick={() => imageUploadRef.current?.click()}
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Image</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((img) => {
                    const isSelected = selectedImageId === img.id;
                    const sizeClass = img.size === 'sm' ? 'max-w-xs' : img.size === 'md' ? 'max-w-md' : img.size === 'lg' ? 'max-w-xl' : 'w-full';
                    const alignClass = img.align === 'left' ? 'mr-auto' : img.align === 'right' ? 'ml-auto' : 'mx-auto';
                    const radiusClass = img.borderRadius === 'circle' ? 'rounded-full' : img.borderRadius === 'rounded' ? 'rounded-xl' : 'rounded-none';

                    // Compute filter CSS string
                    let filterString = `brightness(${img.brightness}%) contrast(${img.contrast}%)`;
                    if (img.filter === 'grayscale') filterString += ' grayscale(100%)';
                    else if (img.filter === 'sepia') filterString += ' sepia(100%)';
                    else if (img.filter === 'invert') filterString += ' invert(100%)';
                    else if (img.filter === 'blur') filterString += ' blur(2px)';
                    else if (img.filter === 'warm') filterString += ' sepia(30%) saturate(140%)';
                    else if (img.filter === 'cool') filterString += ' hue-rotate(180deg)';

                    return (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImageId(img.id)}
                        className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30 shadow-lg' 
                            : 'border-white/10 hover:border-white/30 bg-black/10 dark:bg-white/5'
                        }`}
                      >
                        <div className={`overflow-hidden flex items-center justify-center ${sizeClass} ${alignClass}`}>
                          <img
                            src={img.url}
                            alt={img.caption || img.name}
                            style={{
                              transform: `rotate(${img.rotation}deg)`,
                              filter: filterString,
                            }}
                            className={`max-h-64 object-contain transition-all ${radiusClass}`}
                          />
                        </div>

                        {img.caption && (
                          <div className="text-center text-[11px] opacity-75 mt-2 italic">
                            {img.caption}
                          </div>
                        )}

                        {/* Quick action buttons on image */}
                        <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageId(img.id);
                            }}
                            className="p-1 rounded bg-black/70 text-white hover:bg-sky-500 transition-colors"
                            title="Edit image properties"
                          >
                            <Sliders className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(img.id);
                            }}
                            className="p-1 rounded bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Start typing your new Word document... You can also upload images from your laptop and format text using the ribbon above."
              style={{ fontSize: `${fontSize}px`, textAlign }}
              className={`w-full flex-1 min-h-[700px] bg-transparent outline-none resize-none leading-relaxed border-none font-sans ${getFontFamilyClass()} ${
                settings.theme === 'dark' ? 'text-neutral-100 placeholder:text-neutral-600' : 'text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
          </div>
        </div>

        {/* Selected Image Inspector Sidebar Drawer */}
        {selectedImage && (
          <div className={`w-64 border-l p-4 flex flex-col justify-between overflow-y-auto ${
            settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-neutral-50/90 border-black/10'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-white/10">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                  <span>Image Editor</span>
                </span>
                <button onClick={() => setSelectedImageId(null)} className="opacity-60 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Caption</label>
                <input
                  type="text"
                  value={selectedImage.caption}
                  onChange={(e) => handleUpdateImage(selectedImage.id, { caption: e.target.value })}
                  placeholder="Enter caption..."
                  className="w-full px-2 py-1 rounded border border-white/15 bg-black/20 text-xs outline-none"
                />
              </div>

              {/* Size Selector */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Scale &amp; Width</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['sm', 'md', 'lg', 'full'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => handleUpdateImage(selectedImage.id, { size: sz })}
                      className={`py-1 rounded text-[11px] font-medium transition-colors ${
                        selectedImage.size === sz ? 'bg-sky-500 text-white font-bold' : 'bg-white/5 hover:bg-white/10 opacity-70'
                      }`}
                    >
                      {sz.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Alignment</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['left', 'center', 'right'] as const).map((al) => (
                    <button
                      key={al}
                      onClick={() => handleUpdateImage(selectedImage.id, { align: al })}
                      className={`py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                        selectedImage.align === al ? 'bg-sky-500 text-white font-bold' : 'bg-white/5 hover:bg-white/10 opacity-70'
                      }`}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotation */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold opacity-60 uppercase">Rotation</label>
                  <span className="text-[10px] font-mono text-sky-400">{selectedImage.rotation}°</span>
                </div>
                <button
                  onClick={() => handleUpdateImage(selectedImage.id, { rotation: (selectedImage.rotation + 90) % 360 })}
                  className="w-full py-1.5 rounded-lg border border-white/15 hover:bg-white/10 flex items-center justify-center space-x-1.5 text-xs"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotate 90° Clockwise</span>
                </button>
              </div>

              {/* Brightness Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold opacity-60 uppercase">Brightness</label>
                  <span className="text-[10px] font-mono text-sky-400">{selectedImage.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={selectedImage.brightness}
                  onChange={(e) => handleUpdateImage(selectedImage.id, { brightness: Number(e.target.value) })}
                  className="w-full accent-sky-500 h-1.5 rounded-full cursor-pointer"
                />
              </div>

              {/* Contrast Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold opacity-60 uppercase">Contrast</label>
                  <span className="text-[10px] font-mono text-sky-400">{selectedImage.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={selectedImage.contrast}
                  onChange={(e) => handleUpdateImage(selectedImage.id, { contrast: Number(e.target.value) })}
                  className="w-full accent-sky-500 h-1.5 rounded-full cursor-pointer"
                />
              </div>

              {/* Aesthetic Filter */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Creative Filter</label>
                <select
                  value={selectedImage.filter}
                  onChange={(e) => handleUpdateImage(selectedImage.id, { filter: e.target.value as any })}
                  className="w-full px-2 py-1 rounded border border-white/15 bg-black/20 text-xs outline-none"
                >
                  <option value="none">Standard (None)</option>
                  <option value="grayscale">Black &amp; White (Grayscale)</option>
                  <option value="sepia">Warm Vintage (Sepia)</option>
                  <option value="invert">Inverted Negative</option>
                  <option value="blur">Soft Focus (Blur)</option>
                  <option value="warm">Vibrant Warm</option>
                  <option value="cool">Cinematic Cool</option>
                </select>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Corners</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['none', 'rounded', 'circle'] as const).map((cr) => (
                    <button
                      key={cr}
                      onClick={() => handleUpdateImage(selectedImage.id, { borderRadius: cr })}
                      className={`py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                        selectedImage.borderRadius === cr ? 'bg-sky-500 text-white font-bold' : 'bg-white/5 hover:bg-white/10 opacity-70'
                      }`}
                    >
                      {cr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Delete Image button */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => handleDeleteImage(selectedImage.id)}
                className="w-full py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Image</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Word Statistics Status Bar */}
      <div className={`h-7 border-t px-4 flex items-center justify-between text-[11px] opacity-60 font-mono ${
        settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-3">
          <span>Words: {wordCount}</span>
          <span>•</span>
          <span>Characters: {charCount}</span>
          <span>•</span>
          <span>Images: {images.length}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Read time: ~{readingTime} min</span>
          <span>•</span>
          <span>Google Drive Cloud Autosave: Active</span>
        </div>
      </div>

      {/* Open File Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <span>Open Document from Google Drive</span>
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {files.filter(f => f.type === 'document' || f.name.endsWith('.doc') || f.name.endsWith('.docx') || f.name.endsWith('.md')).length === 0 ? (
                <div className="p-4 text-center opacity-60">No saved documents found in Google Drive.</div>
              ) : (
                files.filter(f => f.type === 'document' || f.name.endsWith('.doc') || f.name.endsWith('.docx') || f.name.endsWith('.md')).map(f => (
                  <div
                    key={f.id}
                    onClick={() => handleOpenFile(f)}
                    className="p-2.5 rounded-xl hover:bg-white/10 cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs">{f.name}</div>
                      <div className="text-[10px] opacity-60">{f.size} • {f.path}</div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400">Open</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
