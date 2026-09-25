import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
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
  Share2, 
  Users, 
  Check,
  Printer,
  FolderOpen,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Search,
  Replace,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  Sparkles,
  Palette,
  X,
  FilePlus,
  Layout
} from 'lucide-react';

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
  const { files, updateFile, createFile, teamPresence, settings, notify } = useOS();

  // Find active file or default
  const docFile = files.find(f => f.id === initialFileId) || files.find(f => f.type === 'document');
  const [fileId, setFileId] = useState<string>(docFile?.id || 'new-doc');
  const [title, setTitle] = useState<string>(initialFileName || docFile?.name || 'Creative Production Architecture.docx');
  const [content, setContent] = useState<string>(initialContent || docFile?.content || `# Project NebulaOS: Creative Pipeline Architecture\n\nHigh-performance unified document workspace running directly in the browser with Google Drive cloud synchronization.\n\n## 1. Executive Summary\nNebulaOS optimizes multi-threaded render workflows, offering hardware-level thermal profiles and sub-second asset editing for digital producers.\n\n### Key Deliverables\n- [x] Zero-latency word processing with rich formatting\n- [x] High-precision spreadsheets with formula calculation\n- [x] Presentation decks with 3D transitions and animations\n- [ ] Final 4K ACES export signoff\n\n> "Simplicity is the ultimate sophistication." — Leonardo da Vinci\n\nContact the core engineering team for full pipeline specs.`);
  const [isSaved, setIsSaved] = useState<boolean>(true);

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

  // Switch or reload when initialFileId changes
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

  const handleSave = () => {
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
    setIsSaved(true);
    notify('Saved to Google Drive', `${title} updated with cloud backup.`, 'sync');
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

  // Create document from template
  const handleCreateFromTemplate = (templateName: string, tContent: string) => {
    const newTitle = `Untitled ${templateName} ${files.length + 1}.docx`;
    setTitle(newTitle);
    setContent(tContent);
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

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
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

        {/* Right actions: New, Open, Save, Team, Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 transition-colors font-medium text-xs"
            title="Create new document"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>

          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors text-xs"
            title="Open document from Google Drive"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          {/* Active Collaborators */}
          <div className="flex items-center -space-x-1.5 mx-1">
            {teamPresence.slice(0, 3).map((m, idx) => (
              <div 
                key={m.id || idx}
                className={`w-5 h-5 rounded-full border border-neutral-900 text-[9px] font-bold text-white flex items-center justify-center ${m.avatarColor}`}
                title={`${m.name} is editing`}
              >
                {m.name[0]}
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors text-xs"
            title="Save changes to Google Drive"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <div className="flex items-center border border-white/10 rounded-md overflow-hidden">
            <button
              onClick={() => handleDownload('docx')}
              className="px-2.5 py-1.5 hover:bg-white/10 text-xs font-medium"
              title="Download Microsoft Word format (.docx)"
            >
              .docx
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="px-2.5 py-1.5 hover:bg-white/10 text-xs font-medium border-l border-white/10"
              title="Export PDF format (.pdf)"
            >
              PDF
            </button>
          </div>
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

        {/* Insert Elements: Table, Image, Divider */}
        <button
          onClick={() => insertText('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Data A | Data B | Data C |\n')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Insert Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('![Image Asset](https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80)')}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Insert Image"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => insertText('\n---\n')}
          className="px-2 py-1 rounded hover:bg-white/10 transition-colors text-[11px]"
          title="Horizontal Page Divider"
        >
          Divider
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
          title="Toggle A4 Paper View vs Continuous"
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

      {/* Document Workspace Canvas */}
      <div className="flex-1 overflow-y-auto bg-black/5 dark:bg-black/40 p-4 md:p-8 flex justify-center">
        <div className={`w-full max-w-4xl transition-all ${
          isPaginatedView 
            ? 'min-h-[900px] shadow-2xl rounded-2xl p-10 md:p-14 border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-900' 
            : 'h-full p-4 bg-transparent'
        }`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing your Word document..."
            style={{ fontSize: `${fontSize}px`, textAlign }}
            className={`w-full h-full min-h-[750px] bg-transparent outline-none resize-none leading-relaxed border-none font-sans ${getFontFamilyClass()} ${
              settings.theme === 'dark' ? 'text-neutral-100 placeholder:text-neutral-600' : 'text-neutral-900 placeholder:text-neutral-400'
            }`}
          />
        </div>
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
          <span>Paragraphs: {paragraphCount}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Read time: ~{readingTime} min</span>
          <span>•</span>
          <span>Cloud Autosave: Active</span>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-blue-500" />
                <span>Create New Word Document</span>
              </h3>
              <button onClick={() => setShowTemplatesModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  name: 'Blank Document', 
                  desc: 'Clean page ready for writing.', 
                  content: '# Untitled Document\n\nStart typing your content here...' 
                },
                { 
                  name: 'Creative Project Brief', 
                  desc: 'Objective, deliverables, timeline & roles.', 
                  content: '# Project Creative Brief\n\n## 1. Project Goal & Purpose\nDefine target creative deliverables.\n\n## 2. Target Audience\nHigh-performance 3D visual artists.\n\n## 3. Scope of Work\n- Key visual keyframes\n- Motion graphics styling\n- 4K delivery format' 
                },
                { 
                  name: 'Technical Specification', 
                  desc: 'Architecture, APIs, hardware constraints.', 
                  content: '# System Architecture Specification\n\n## 1. Modules\n- Zsh Unix Shell Core\n- GPU Thermal Throttle Guard\n- Web Audio Synthesizer Engine\n\n## 2. API Endpoints\n`GET /api/browser/proxy`' 
                },
                { 
                  name: 'Meeting Minutes', 
                  desc: 'Attendees, agenda, decisions & action items.', 
                  content: '# Team Sprint Sync\n\n**Date:** Today\n**Attendees:** Creative Director, Lead Engineer, Sound Producer\n\n## Agenda\n1. Review M3 Ultra Raytracing benchmarks\n2. Approve Keynote presentation deck\n\n## Action Items\n- [ ] Export final deck to .key format\n- [ ] Verify Google Drive delta sync' 
                }
              ].map((t) => (
                <div
                  key={t.name}
                  onClick={() => handleCreateFromTemplate(t.name, t.content)}
                  className="p-3.5 rounded-xl border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 cursor-pointer transition-all"
                >
                  <div className="font-semibold text-xs text-blue-400">{t.name}</div>
                  <div className="text-[10px] opacity-60 mt-1">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Open File Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <span>Open Document from Google Drive</span>
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
              {files.filter(f => f.type === 'document' || f.name.endsWith('.doc') || f.name.endsWith('.docx') || f.name.endsWith('.txt') || f.name.endsWith('.md')).map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleOpenFile(f)}
                  className="p-3 hover:bg-white/5 cursor-pointer rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-xs">{f.name}</div>
                      <div className="text-[10px] opacity-60">{f.path} • {f.size}</div>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 text-xs font-semibold">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
