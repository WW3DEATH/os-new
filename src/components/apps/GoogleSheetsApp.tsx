import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { GoogleDriveService } from '../../services/googleDrive';
import { 
  Table, 
  Plus, 
  Download, 
  Save, 
  Calculator, 
  DollarSign, 
  Percent, 
  Trash2, 
  FolderOpen, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X,
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ChevronRight,
  Upload,
  Image as ImageIcon,
  RotateCw,
  HardDrive,
  SlidersHorizontal,
  Maximize2,
  FilePlus,
  Move
} from 'lucide-react';

export interface SheetImage {
  id: string;
  name: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  brightness: number;
  contrast: number;
  filter: 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur';
  borderRadius: 'none' | 'rounded' | 'circle';
}

interface GoogleSheetsAppProps {
  initialFileId?: string;
  initialFileName?: string;
}

interface SheetTab {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
}

export const GoogleSheetsApp: React.FC<GoogleSheetsAppProps> = ({ 
  initialFileId, 
  initialFileName 
}) => {
  const { files, updateFile, createFile, user, notify, settings } = useOS();

  // Fresh new spreadsheet by default unless a specific file is opened
  const activeFile = initialFileId ? files.find(f => f.id === initialFileId) : null;
  const [fileId, setFileId] = useState<string>(activeFile?.id || `sheet-${Date.now()}`);
  const [title, setTitle] = useState(initialFileName || activeFile?.name || 'Untitled Spreadsheet.xlsx');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Active cell selection
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [formulaInput, setFormulaInput] = useState<string>('');

  // Modals & Sheets
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Formatting toggles
  const [cellFormatting, setCellFormatting] = useState<Record<string, { bold?: boolean; italic?: boolean; currency?: boolean; percent?: boolean }>>({});

  // Floating Images on Sheet
  const [sheetImages, setSheetImages] = useState<SheetImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Default clean headers & rows for a brand new sheet
  const defaultBlankHeaders = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const generateBlankRows = (count: number, cols: number) => {
    return Array.from({ length: count }, () => new Array(cols).fill(''));
  };

  const [sheets, setSheets] = useState<SheetTab[]>(() => {
    if (activeFile?.content) {
      try {
        const parsed = JSON.parse(activeFile.content);
        if (parsed.sheets && Array.isArray(parsed.sheets) && parsed.sheets.length > 0) return parsed.sheets;
        if (parsed.rows && parsed.headers) {
          return [{ id: 'sheet-1', name: 'Sheet 1', headers: parsed.headers, rows: parsed.rows }];
        }
      } catch {}
    }
    return [
      { id: 'sheet-1', name: 'Sheet 1', headers: defaultBlankHeaders, rows: generateBlankRows(15, 8) }
    ];
  });

  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const currentSheet = sheets[activeSheetIndex] || sheets[0];

  // Reload when initialFileId changes
  useEffect(() => {
    if (initialFileId) {
      const f = files.find(item => item.id === initialFileId);
      if (f) {
        setFileId(f.id);
        setTitle(f.name);
        if (f.content) {
          try {
            const parsed = JSON.parse(f.content);
            if (parsed.sheets) setSheets(parsed.sheets);
            else if (parsed.rows && parsed.headers) {
              setSheets([{ id: 'sheet-1', name: 'Sheet 1', headers: parsed.headers, rows: parsed.rows }]);
            }
            if (parsed.sheetImages && Array.isArray(parsed.sheetImages)) {
              setSheetImages(parsed.sheetImages);
            }
          } catch {}
        }
        setIsSaved(true);
      }
    }
  }, [initialFileId, files]);

  // Sync active cell to formula bar
  useEffect(() => {
    const row = currentSheet.rows[selectedCell.row];
    if (row && row[selectedCell.col] !== undefined) {
      setFormulaInput(row[selectedCell.col]);
    }
  }, [selectedCell, activeSheetIndex, currentSheet]);

  // Excel Column coordinate helper (A, B, C...)
  const getColLetter = (idx: number) => String.fromCharCode(65 + (idx % 26));

  // Evaluate Formulas
  const evaluateCellFormula = (val: string, allRows: string[][]): string => {
    if (!val || !val.startsWith('=')) return val;

    try {
      const expr = val.substring(1).trim().toUpperCase();

      // =SUM(C1:C5) or =SUM(...)
      if (expr.startsWith('SUM(') && expr.endsWith(')')) {
        const inner = expr.substring(4, expr.length - 1);
        if (inner.includes(':')) {
          const [start, end] = inner.split(':');
          const startCol = start.charCodeAt(0) - 65;
          const startRow = parseInt(start.substring(1)) - 1;
          const endRow = parseInt(end.substring(1)) - 1;

          let sum = 0;
          for (let r = Math.max(0, startRow); r <= Math.min(allRows.length - 1, endRow); r++) {
            sum += parseFloat(allRows[r][startCol]) || 0;
          }
          return sum.toFixed(2);
        }
      }

      // =AVERAGE(C1:C5)
      if (expr.startsWith('AVERAGE(') && expr.endsWith(')')) {
        const inner = expr.substring(8, expr.length - 1);
        if (inner.includes(':')) {
          const [start, end] = inner.split(':');
          const startCol = start.charCodeAt(0) - 65;
          const startRow = parseInt(start.substring(1)) - 1;
          const endRow = parseInt(end.substring(1)) - 1;

          let sum = 0;
          let count = 0;
          for (let r = Math.max(0, startRow); r <= Math.min(allRows.length - 1, endRow); r++) {
            sum += parseFloat(allRows[r][startCol]) || 0;
            count++;
          }
          return count > 0 ? (sum / count).toFixed(2) : '0.00';
        }
      }

      // Direct arithmetic like =A1*B1
      const sanitized = expr.replace(/[A-Z][0-9]+/g, (match) => {
        const c = match.charCodeAt(0) - 65;
        const r = parseInt(match.substring(1)) - 1;
        if (allRows[r] && allRows[r][c] !== undefined) {
          return String(parseFloat(allRows[r][c]) || 0);
        }
        return '0';
      });

      const result = Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return Number.isInteger(result) ? String(result) : result.toFixed(2);
      }
    } catch {}

    return val;
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setSheets(prev => prev.map((s, idx) => {
      if (idx !== activeSheetIndex) return s;
      const nextRows = s.rows.map((r, ri) => ri === rowIndex ? [...r] : r);
      nextRows[rowIndex][colIndex] = value;
      return { ...s, rows: nextRows };
    }));
    setIsSaved(false);
  };

  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCellChange(selectedCell.row, selectedCell.col, formulaInput);
  };

  // Row operations
  const addRow = () => {
    const emptyRow = new Array(currentSheet.headers.length).fill('');
    setSheets(prev => prev.map((s, idx) => idx === activeSheetIndex ? { ...s, rows: [...s.rows, emptyRow] } : s));
    setIsSaved(false);
    notify('Row Added', `Added row #${currentSheet.rows.length + 1}`, 'info');
  };

  const deleteRow = (rIdx: number) => {
    if (currentSheet.rows.length <= 1) return;
    setSheets(prev => prev.map((s, idx) => idx === activeSheetIndex ? {
      ...s,
      rows: s.rows.filter((_, ri) => ri !== rIdx)
    } : s));
    setIsSaved(false);
    notify('Row Deleted', `Removed row #${rIdx + 1}`, 'info');
  };

  // Column operations
  const addColumn = () => {
    const newColName = getColLetter(currentSheet.headers.length);
    setSheets(prev => prev.map((s, idx) => idx === activeSheetIndex ? {
      ...s,
      headers: [...s.headers, newColName],
      rows: s.rows.map(r => [...r, ''])
    } : s));
    setIsSaved(false);
    notify('Column Added', `Added Column ${newColName}`, 'info');
  };

  // Sort column
  const sortColumn = (colIdx: number, order: 'asc' | 'desc') => {
    setSheets(prev => prev.map((s, idx) => {
      if (idx !== activeSheetIndex) return s;
      const sorted = [...s.rows].sort((a, b) => {
        const valA = a[colIdx] || '';
        const valB = b[colIdx] || '';
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return order === 'asc' ? numA - numB : numB - numA;
        }
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
      return { ...s, rows: sorted };
    }));
    notify('Column Sorted', `Sorted by ${currentSheet.headers[colIdx]} (${order.toUpperCase()})`, 'info');
  };

  // New sheet tab
  const handleAddNewSheetTab = () => {
    const newTab: SheetTab = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${sheets.length + 1}`,
      headers: defaultBlankHeaders,
      rows: generateBlankRows(15, 8)
    };
    setSheets([...sheets, newTab]);
    setActiveSheetIndex(sheets.length);
    setIsSaved(false);
    notify('Sheet Tab Created', `Added ${newTab.name}`, 'info');
  };

  // Image Upload from laptop into Spreadsheet
  const handleUploadImageFromLaptop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Invalid File', 'Please upload a PNG, JPG, WEBP, or SVG image.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newImg: SheetImage = {
          id: `sheet-img-${Date.now()}`,
          name: file.name,
          url: event.target.result as string,
          x: 40 + sheetImages.length * 20,
          y: 40 + sheetImages.length * 20,
          width: 240,
          height: 160,
          rotation: 0,
          brightness: 100,
          contrast: 100,
          filter: 'none',
          borderRadius: 'rounded'
        };
        setSheetImages(prev => [...prev, newImg]);
        setSelectedImageId(newImg.id);
        setIsSaved(false);
        notify('Image Added', `"${file.name}" placed on spreadsheet. Click image to resize or edit.`, 'info');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowImageModal(false);
  };

  // Insert Image via URL
  const handleAddImageFromUrl = () => {
    if (!imageUrlInput.trim()) return;
    const newImg: SheetImage = {
      id: `sheet-img-${Date.now()}`,
      name: 'Web Graphic',
      url: imageUrlInput.trim(),
      x: 40 + sheetImages.length * 20,
      y: 40 + sheetImages.length * 20,
      width: 240,
      height: 160,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      filter: 'none',
      borderRadius: 'rounded'
    };
    setSheetImages(prev => [...prev, newImg]);
    setSelectedImageId(newImg.id);
    setImageUrlInput('');
    setShowImageModal(false);
    setIsSaved(false);
    notify('Image Added', 'Image placed on spreadsheet.', 'info');
  };

  const handleUpdateSheetImage = (imgId: string, updates: Partial<SheetImage>) => {
    setSheetImages(prev => prev.map(img => img.id === imgId ? { ...img, ...updates } : img));
    setIsSaved(false);
  };

  const handleDeleteSheetImage = (imgId: string) => {
    setSheetImages(prev => prev.filter(img => img.id !== imgId));
    if (selectedImageId === imgId) setSelectedImageId(null);
    setIsSaved(false);
    notify('Image Removed', 'Removed image from sheet.', 'info');
  };

  // Create brand new blank workbook
  const handleCreateNewBlank = () => {
    const newTitle = `Untitled Spreadsheet ${files.length + 1}.xlsx`;
    setTitle(newTitle);
    setSheets([{ id: 'sheet-1', name: 'Sheet 1', headers: defaultBlankHeaders, rows: generateBlankRows(15, 8) }]);
    setSheetImages([]);
    setActiveSheetIndex(0);
    setFileId(`sheet-${Date.now()}`);
    setIsSaved(true);
    notify('New Spreadsheet Created', 'Opened a clean, blank Excel workbook.', 'info');
  };

  // Save to Google Drive
  const handleSave = async () => {
    const payload = JSON.stringify({ title, sheets, sheetImages });
    if (fileId && files.some(f => f.id === fileId)) {
      updateFile(fileId, { content: payload, name: title });
    } else {
      createFile({
        name: title,
        path: `/Google Drive/${title}`,
        type: 'spreadsheet',
        size: `${Math.round(payload.length / 1024 * 10) / 10 || 1.8} KB`,
        content: payload,
        tags: ['drive', 'sheets', 'excel'],
        isCloudSynced: true,
        isOfflineAvailable: true
      });
    }

    if (GoogleDriveService.isConnected()) {
      try {
        notify('Saving to Private Drive', `Uploading ${title} to private folder 'NebulaOS Workstation'...`, 'sync');
        await GoogleDriveService.saveFileToDrive({
          name: title,
          content: payload,
          mimeType: 'application/json',
          description: 'Excel & Google Sheets workbook created in NebulaOS Workstation'
        });
        setIsSaved(true);
        notify('Saved to Private Drive', `${title} saved in your private Google Drive folder ('NebulaOS Workstation')!`, 'sync');
        return;
      } catch (err: any) {
        console.warn('Google Drive direct upload note:', err);
        notify('Saved to Cloud OS', `Spreadsheet saved in Cloud OS. (Drive note: ${err?.message || 'Ready'})`, 'info');
      }
    } else {
      notify('Saved to Cloud OS', `${title} saved. Sign in with Google to sync to your personal Google Drive.`, 'sync');
    }
    setIsSaved(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = [
      currentSheet.headers.join(','),
      ...currentSheet.rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\.[^/.]+$/, '')}_${currentSheet.name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Spreadsheet Exported', `Downloaded ${link.download}`, 'info');
  };

  // Open existing file from OS
  const handleOpenFile = (f: any) => {
    setFileId(f.id);
    setTitle(f.name);
    if (f.content) {
      try {
        const parsed = JSON.parse(f.content);
        if (parsed.sheets) setSheets(parsed.sheets);
        else if (parsed.rows && parsed.headers) {
          setSheets([{ id: 'sheet-1', name: 'Sheet 1', headers: parsed.headers, rows: parsed.rows }]);
        }
        if (parsed.sheetImages && Array.isArray(parsed.sheetImages)) {
          setSheetImages(parsed.sheetImages);
        }
      } catch {}
    }
    setIsSaved(true);
    setShowOpenModal(false);
    notify('Spreadsheet Loaded', `Opened ${f.name}`, 'info');
  };

  const selectedImage = sheetImages.find(img => img.id === selectedImageId);

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

      {/* Top Header & Toolbar */}
      <div className={`h-12 border-b flex items-center justify-between px-4 gap-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/80 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center justify-center">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setIsSaved(false); }}
                className={`font-semibold text-xs px-2 py-0.5 rounded border border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-emerald-500 bg-transparent outline-none w-64 ${
                  settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'
                }`}
              />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                Excel &amp; Google Sheets
              </span>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
            isSaved ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10 animate-pulse'
          }`}>
            {isSaved ? 'Drive Synced' : 'Unsaved Changes'}
          </span>
        </div>

        {/* Right actions: New Blank, Open, Save to Drive, Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateNewBlank}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 transition-colors font-medium text-xs"
            title="Create brand new blank spreadsheet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blank</span>
          </button>

          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors text-xs"
            title="Open spreadsheet from Google Drive"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          {/* User Account / Drive status */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
            <HardDrive className="w-3 h-3 text-emerald-400" />
            <span className="font-mono truncate max-w-[120px]">{user?.email || 'Personal Google Drive'}</span>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors text-xs"
            title="Save changes directly to personal Google Drive"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Drive</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium"
            title="Export as CSV table"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Excel Ribbon & Action Controls */}
      <div className={`h-10 border-b flex items-center px-4 space-x-2 overflow-x-auto ${
        settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-neutral-100/50 border-black/10'
      }`}>
        <button
          onClick={addRow}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors font-medium"
          title="Add Row to Sheet"
        >
          <Plus className="w-3 h-3" />
          <span>Add Row</span>
        </button>

        <button
          onClick={addColumn}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors font-medium"
          title="Add Column to Sheet"
        >
          <Plus className="w-3 h-3" />
          <span>Add Column</span>
        </button>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Upload Image from Laptop Button */}
        <button
          onClick={() => imageUploadRef.current?.click()}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 font-medium transition-colors"
          title="Upload image from your laptop/computer and place on spreadsheet"
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

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Text styling */}
        <button
          onClick={() => {
            const key = `${selectedCell.row}-${selectedCell.col}`;
            setCellFormatting(prev => ({
              ...prev,
              [key]: { ...prev[key], bold: !prev[key]?.bold }
            }));
          }}
          className="p-1 rounded hover:bg-white/10 transition-colors font-bold"
          title="Bold Cell"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            const key = `${selectedCell.row}-${selectedCell.col}`;
            setCellFormatting(prev => ({
              ...prev,
              [key]: { ...prev[key], italic: !prev[key]?.italic }
            }));
          }}
          className="p-1 rounded hover:bg-white/10 transition-colors italic"
          title="Italic Cell"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Sorting active column */}
        <button
          onClick={() => sortColumn(selectedCell.col, 'asc')}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-[11px]"
          title="Sort Active Column Ascending (A-Z)"
        >
          <ArrowUp className="w-3 h-3" />
          <span>Sort A-Z</span>
        </button>

        <button
          onClick={() => sortColumn(selectedCell.col, 'desc')}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-[11px]"
          title="Sort Active Column Descending (Z-A)"
        >
          <ArrowDown className="w-3 h-3" />
          <span>Sort Z-A</span>
        </button>

        {sheetImages.length > 0 && (
          <div className="ml-auto text-[11px] text-sky-400 flex items-center gap-1 font-mono">
            <ImageIcon className="w-3 h-3" />
            <span>{sheetImages.length} Image(s) on Sheet</span>
          </div>
        )}
      </div>

      {/* Formula Bar */}
      <form onSubmit={handleFormulaSubmit} className={`h-8 border-b flex items-center px-4 space-x-2 ${
        settings.theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-neutral-50 border-black/10'
      }`}>
        <div className="flex items-center space-x-1 text-emerald-400 font-mono font-bold text-xs w-16">
          <span>fx</span>
          <span>[{getColLetter(selectedCell.col)}{selectedCell.row + 1}]</span>
        </div>
        <input
          type="text"
          value={formulaInput}
          onChange={(e) => setFormulaInput(e.target.value)}
          placeholder="Enter formula or value (e.g. =SUM(C1:C5), =A1*B1, or text)..."
          className="flex-1 bg-transparent outline-none text-xs font-mono"
        />
        <button type="submit" className="p-1 hover:bg-white/10 rounded">
          <Check className="w-3 h-3 text-emerald-400" />
        </button>
      </form>

      {/* Main Grid Area & Floating Images */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto relative bg-white dark:bg-neutral-950">
          {/* Floating Sheet Images Layer */}
          {sheetImages.map((img) => {
            const isSelected = selectedImageId === img.id;
            let filterString = `brightness(${img.brightness}%) contrast(${img.contrast}%)`;
            if (img.filter === 'grayscale') filterString += ' grayscale(100%)';
            else if (img.filter === 'sepia') filterString += ' sepia(100%)';
            else if (img.filter === 'invert') filterString += ' invert(100%)';
            else if (img.filter === 'blur') filterString += ' blur(2px)';

            const radiusClass = img.borderRadius === 'circle' ? 'rounded-full' : img.borderRadius === 'rounded' ? 'rounded-xl' : 'rounded-none';

            return (
              <div
                key={img.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageId(img.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${img.x}px`,
                  top: `${img.y}px`,
                  width: `${img.width}px`,
                  height: `${img.height}px`,
                  zIndex: isSelected ? 30 : 20,
                  transform: `rotate(${img.rotation}deg)`
                }}
                className={`group cursor-move transition-shadow ${
                  isSelected ? 'ring-2 ring-sky-500 shadow-2xl' : 'hover:ring-1 hover:ring-white/40 shadow-lg'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  style={{ filter: filterString }}
                  className={`w-full h-full object-cover select-none ${radiusClass}`}
                />

                {/* Overlay controls on image hover / select */}
                <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 p-1 rounded-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageId(img.id);
                    }}
                    className="p-1 rounded text-white hover:text-sky-400"
                    title="Edit image properties"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSheetImage(img.id);
                    }}
                    className="p-1 rounded text-rose-400 hover:text-rose-600"
                    title="Delete image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Spreadsheet Table */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className={settings.theme === 'dark' ? 'bg-neutral-900 border-b border-white/10' : 'bg-neutral-100 border-b border-black/10'}>
                <th className="w-10 p-2 text-center border-r border-white/10 opacity-50 font-mono text-[10px]">#</th>
                {currentSheet.headers.map((h, ci) => (
                  <th
                    key={ci}
                    onClick={() => setSelectedCell({ row: 0, col: ci })}
                    className="p-2 border-r border-white/10 font-semibold text-left min-w-[120px] cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>{h}</span>
                      <span className="opacity-40 text-[9px] font-mono">{getColLetter(ci)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSheet.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-b transition-colors ${
                    settings.theme === 'dark' 
                      ? 'border-white/5 hover:bg-white/5' 
                      : 'border-black/5 hover:bg-black/5'
                  }`}
                >
                  <td className="p-1.5 text-center border-r border-white/10 opacity-50 font-mono text-[10px]">
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => {
                    const isSelected = selectedCell.row === ri && selectedCell.col === ci;
                    const formatKey = `${ri}-${ci}`;
                    const fmt = cellFormatting[formatKey];
                    const evaluated = evaluateCellFormula(cell, currentSheet.rows);

                    return (
                      <td
                        key={ci}
                        onClick={() => setSelectedCell({ row: ri, col: ci })}
                        className={`p-1.5 border-r border-white/10 cursor-text transition-all ${
                          isSelected 
                            ? 'ring-2 ring-emerald-500 bg-emerald-500/10' 
                            : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={isSelected ? cell : evaluated}
                          onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                          className={`w-full bg-transparent outline-none ${
                            fmt?.bold ? 'font-bold' : ''
                          } ${fmt?.italic ? 'italic' : ''}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Image Properties Drawer */}
        {selectedImage && (
          <div className={`w-64 border-l p-4 flex flex-col justify-between overflow-y-auto ${
            settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-neutral-50/90 border-black/10'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-white/10">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sheet Image Editor</span>
                </span>
                <button onClick={() => setSelectedImageId(null)} className="opacity-60 hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Position Coordinates */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Position on Grid</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] opacity-60">X:</span>
                    <input
                      type="number"
                      value={selectedImage.x}
                      onChange={(e) => handleUpdateSheetImage(selectedImage.id, { x: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded border border-white/15 bg-black/20 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60">Y:</span>
                    <input
                      type="number"
                      value={selectedImage.y}
                      onChange={(e) => handleUpdateSheetImage(selectedImage.id, { y: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded border border-white/15 bg-black/20 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Dimensions (px)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] opacity-60">Width:</span>
                    <input
                      type="number"
                      value={selectedImage.width}
                      onChange={(e) => handleUpdateSheetImage(selectedImage.id, { width: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded border border-white/15 bg-black/20 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60">Height:</span>
                    <input
                      type="number"
                      value={selectedImage.height}
                      onChange={(e) => handleUpdateSheetImage(selectedImage.id, { height: Number(e.target.value) })}
                      className="w-full px-2 py-1 rounded border border-white/15 bg-black/20 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold opacity-60 uppercase">Rotation</label>
                  <span className="text-[10px] font-mono text-emerald-400">{selectedImage.rotation}°</span>
                </div>
                <button
                  onClick={() => handleUpdateSheetImage(selectedImage.id, { rotation: (selectedImage.rotation + 90) % 360 })}
                  className="w-full py-1.5 rounded-lg border border-white/15 hover:bg-white/10 flex items-center justify-center space-x-1.5 text-xs"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotate 90°</span>
                </button>
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold opacity-60 uppercase">Brightness</label>
                  <span className="text-[10px] font-mono text-emerald-400">{selectedImage.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={selectedImage.brightness}
                  onChange={(e) => handleUpdateSheetImage(selectedImage.id, { brightness: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 rounded-full cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold opacity-60 uppercase">Contrast</label>
                  <span className="text-[10px] font-mono text-emerald-400">{selectedImage.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={selectedImage.contrast}
                  onChange={(e) => handleUpdateSheetImage(selectedImage.id, { contrast: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 rounded-full cursor-pointer"
                />
              </div>

              {/* Filter */}
              <div>
                <label className="block text-[10px] font-semibold opacity-60 uppercase mb-1">Color Filter</label>
                <select
                  value={selectedImage.filter}
                  onChange={(e) => handleUpdateSheetImage(selectedImage.id, { filter: e.target.value as any })}
                  className="w-full px-2 py-1 rounded border border-white/15 bg-black/20 text-xs outline-none"
                >
                  <option value="none">Standard (None)</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="sepia">Vintage Sepia</option>
                  <option value="invert">Inverted</option>
                  <option value="blur">Blur</option>
                </select>
              </div>
            </div>

            {/* Delete button */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => handleDeleteSheetImage(selectedImage.id)}
                className="w-full py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Image</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Insert Image URL Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Insert Image to Spreadsheet</span>
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
                  placeholder="https://example.com/chart.png"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-black/20 text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    imageUploadRef.current?.click();
                  }}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
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
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-xs shadow"
                  >
                    Insert Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tabs & Row Count Bar */}
      <div className={`h-8 border-t flex items-center justify-between px-3 ${
        settings.theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-neutral-100 border-black/10'
      }`}>
        <div className="flex items-center space-x-1 overflow-x-auto">
          {sheets.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSheetIndex(idx)}
              className={`px-3 py-1 text-[11px] font-medium rounded-t transition-colors ${
                activeSheetIndex === idx 
                  ? settings.theme === 'dark' 
                    ? 'bg-neutral-800 text-emerald-400 font-bold border-b-2 border-emerald-500' 
                    : 'bg-white text-emerald-600 font-bold border-b-2 border-emerald-500'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={handleAddNewSheetTab}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Add New Sheet Tab"
          >
            <Plus className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        <div className="text-[11px] opacity-60 font-mono flex items-center space-x-3">
          <span>Rows: {currentSheet.rows.length}</span>
          <span>•</span>
          <span>Cols: {currentSheet.headers.length}</span>
          <span>•</span>
          <span>Drive Autosave Active</span>
        </div>
      </div>

      {/* Open Spreadsheet Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Open Spreadsheet from Google Drive</span>
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {files.filter(f => f.type === 'spreadsheet' || f.name.endsWith('.sheet') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv')).length === 0 ? (
                <div className="p-4 text-center opacity-60">No saved spreadsheets found in Google Drive.</div>
              ) : (
                files.filter(f => f.type === 'spreadsheet' || f.name.endsWith('.sheet') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv')).map(f => (
                  <div
                    key={f.id}
                    onClick={() => handleOpenFile(f)}
                    className="p-2.5 rounded-xl hover:bg-white/10 cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs">{f.name}</div>
                      <div className="text-[10px] opacity-60">{f.size} • {f.path}</div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Open</span>
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
