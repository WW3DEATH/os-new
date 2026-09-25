import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Table, 
  Plus, 
  Download, 
  Save, 
  RefreshCw, 
  Calculator, 
  DollarSign, 
  Percent, 
  Hash, 
  FileSpreadsheet, 
  Trash2, 
  FolderOpen, 
  FilePlus, 
  BarChart2, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Check, 
  X,
  Sparkles,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronRight
} from 'lucide-react';

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
  const { files, updateFile, createFile, notify, settings } = useOS();

  // Find active sheet file or default
  const sheetFile = files.find(f => f.id === initialFileId) || files.find(f => f.type === 'spreadsheet');
  const [fileId, setFileId] = useState<string>(sheetFile?.id || 'new-sheet');
  const [title, setTitle] = useState(initialFileName || sheetFile?.name || 'Studio Production Budget Q3.xlsx');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Active cell selection
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [formulaInput, setFormulaInput] = useState<string>('');

  // Modals & Chart views
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showChartView, setShowChartView] = useState<boolean>(false);

  // Formatting toggles
  const [cellFormatting, setCellFormatting] = useState<Record<string, { bold?: boolean; italic?: boolean; currency?: boolean; percent?: boolean }>>({});

  // Multi-sheet tabs
  const defaultHeaders = ['Asset / Pipeline Item', 'Department', 'Rate ($)', 'Qty', 'Total ($)'];
  const defaultRows = [
    ['Cloud GPU Compute (RTX 6000 Ada)', '3D VFX', '4.50', '250', '1125.00'],
    ['ProRes 422 High-Bitrate Storage', 'Storage', '180.00', '4', '720.00'],
    ['Dolby Atmos Mastering Stems', 'Audio', '450.00', '3', '1350.00'],
    ['Motion Capture Rig Rental', 'Production', '600.00', '2', '1200.00'],
    ['Firebase & Serverless Render Nodes', 'Infrastructure', '120.00', '1', '120.00'],
    ['DaVinci Resolve Studio Color Suite', 'Post-Production', '350.00', '2', '700.00']
  ];

  const [sheets, setSheets] = useState<SheetTab[]>(() => {
    if (sheetFile?.content) {
      try {
        const parsed = JSON.parse(sheetFile.content);
        if (parsed.sheets && Array.isArray(parsed.sheets)) return parsed.sheets;
        if (parsed.rows && parsed.headers) {
          return [{ id: 'sheet-1', name: 'Sheet 1', headers: parsed.headers, rows: parsed.rows }];
        }
      } catch {}
    }
    return [
      { id: 'sheet-1', name: 'Budget Q3', headers: defaultHeaders, rows: defaultRows },
      { 
        id: 'sheet-2', 
        name: 'Render Benchmarks', 
        headers: ['Scene Asset', 'Resolution', 'Frames', 'Render Time (m)', 'GPU Temp (°C)'],
        rows: [
          ['Cyberpunk City Neon', '4K 60fps', '240', '42.5', '68'],
          ['Studio Product Packshot', '8K Still', '1', '6.2', '62'],
          ['Fluid Dynamics Splash', '4K 120fps', '480', '115.0', '71']
        ]
      }
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
  const getColLetter = (idx: number) => String.fromCharCode(65 + idx);

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

      // Auto compute total if changing Rate or Qty
      if (s.name.includes('Budget') && (colIndex === 2 || colIndex === 3)) {
        const rate = parseFloat(nextRows[rowIndex][2]) || 0;
        const qty = parseFloat(nextRows[rowIndex][3]) || 0;
        if (nextRows[rowIndex][4] !== undefined) {
          nextRows[rowIndex][4] = (rate * qty).toFixed(2);
        }
      }

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
    emptyRow[0] = 'New Item';
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
    const newColName = `Col ${getColLetter(currentSheet.headers.length)}`;
    setSheets(prev => prev.map((s, idx) => idx === activeSheetIndex ? {
      ...s,
      headers: [...s.headers, newColName],
      rows: s.rows.map(r => [...r, ''])
    } : s));
    setIsSaved(false);
    notify('Column Added', `Added ${newColName}`, 'info');
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
      headers: ['Item Name', 'Category', 'Value A', 'Value B', 'Total'],
      rows: [
        ['Item 1', 'General', '10.00', '5', '50.00'],
        ['Item 2', 'General', '25.00', '2', '50.00']
      ]
    };
    setSheets([...sheets, newTab]);
    setActiveSheetIndex(sheets.length);
    setIsSaved(false);
    notify('Sheet Tab Created', `Added ${newTab.name}`, 'info');
  };

  // Save to Google Drive
  const handleSave = () => {
    const payload = JSON.stringify({ title, sheets });
    if (fileId && files.some(f => f.id === fileId)) {
      updateFile(fileId, { content: payload, name: title });
    } else {
      createFile({
        name: title,
        path: `/Google Drive/${title}`,
        type: 'spreadsheet',
        size: `${Math.round(payload.length / 1024 * 10) / 10 || 2.1} KB`,
        content: payload,
        tags: ['drive', 'sheets', 'excel'],
        isCloudSynced: true,
        isOfflineAvailable: true
      });
    }
    setIsSaved(true);
    notify('Saved to Google Drive', `${title} synchronized.`, 'sync');
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = [currentSheet.headers.join(','), ...currentSheet.rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/\.[^/.]+$/, "") + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    notify('CSV Export Ready', `Downloaded ${a.download}`, 'info');
  };

  // Open existing spreadsheet
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
      } catch {}
    }
    setShowOpenModal(false);
    setIsSaved(true);
    notify('Spreadsheet Loaded', `Opened ${f.name}`, 'info');
  };

  // Template creation
  const handleCreateTemplate = (templateName: string, headers: string[], rows: string[][]) => {
    const newName = `Untitled ${templateName} ${files.length + 1}.xlsx`;
    setTitle(newName);
    setSheets([{ id: `sheet-${Date.now()}`, name: templateName, headers, rows }]);
    setActiveSheetIndex(0);
    setFileId(`sheet-${Date.now()}`);
    setIsSaved(false);
    setShowNewModal(false);
    notify('Spreadsheet Created', `Loaded template: ${templateName}`, 'info');
  };

  // Total summary for last numeric column
  const grandTotal = currentSheet.rows.reduce((sum, r) => {
    const lastColVal = parseFloat(r[r.length - 1]) || 0;
    return sum + lastColVal;
  }, 0);

  return (
    <div className={`h-full flex flex-col select-none text-xs ${settings.theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Excel Header Toolbar */}
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
                className={`font-semibold text-xs px-2 py-0.5 rounded border border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-emerald-500 bg-transparent outline-none w-60 ${
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

        {/* Right Toolbar Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 transition-colors font-medium text-xs"
            title="Create new spreadsheet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sheet</span>
          </button>

          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors text-xs"
            title="Open spreadsheet from Drive"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          <button
            onClick={() => setShowChartView(!showChartView)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              showChartView ? 'bg-emerald-600 text-white border-emerald-500' : 'border-white/10 hover:bg-white/10'
            }`}
            title="Toggle data charts visualization"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Chart View</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors text-xs"
            title="Save changes to Google Drive"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-md border border-white/10 hover:bg-white/10 text-xs font-medium"
            title="Export CSV"
          >
            Export .CSV
          </button>
        </div>
      </div>

      {/* Excel Formula Bar & Operations Ribbon */}
      <div className={`h-10 border-b flex items-center px-4 space-x-2 ${
        settings.theme === 'dark' ? 'bg-neutral-800/40 border-white/10' : 'bg-neutral-100/50 border-black/10'
      }`}>
        {/* Cell Coordinate Pill */}
        <div className="px-2 py-0.5 rounded bg-black/20 font-mono text-[11px] font-bold text-emerald-400 border border-white/10 min-w-[36px] text-center">
          {getColLetter(selectedCell.col)}{selectedCell.row + 1}
        </div>

        <span className="font-mono text-xs opacity-50 font-bold">fx</span>

        {/* Formula Input */}
        <form onSubmit={handleFormulaSubmit} className="flex-1">
          <input
            type="text"
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            placeholder="Type value or formula (e.g. =SUM(C1:C5), =A1*B1)..."
            className={`w-full px-2.5 py-1 rounded border text-xs font-mono outline-none ${
              settings.theme === 'dark' ? 'bg-neutral-900 border-white/15 focus:border-emerald-500' : 'bg-white border-black/15 focus:border-emerald-500'
            }`}
          />
        </form>

        {/* Quick Calculation Shortcuts */}
        <div className="flex items-center space-x-1 pl-2 border-l border-white/10">
          <button
            onClick={() => {
              const f = `=SUM(${getColLetter(selectedCell.col)}1:${getColLetter(selectedCell.col)}${currentSheet.rows.length})`;
              setFormulaInput(f);
              handleCellChange(selectedCell.row, selectedCell.col, f);
            }}
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold"
            title="Insert =SUM formula"
          >
            Σ SUM
          </button>
          <button
            onClick={() => {
              const f = `=AVERAGE(${getColLetter(selectedCell.col)}1:${getColLetter(selectedCell.col)}${currentSheet.rows.length})`;
              setFormulaInput(f);
              handleCellChange(selectedCell.row, selectedCell.col, f);
            }}
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold"
            title="Insert =AVERAGE formula"
          >
            AVG
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/10"></div>

        {/* Add Row & Column */}
        <button
          onClick={addRow}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-white/10 text-xs font-medium"
        >
          <Plus className="w-3 h-3" />
          <span>Add Row</span>
        </button>

        <button
          onClick={addColumn}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-white/10 text-xs font-medium"
        >
          <Plus className="w-3 h-3" />
          <span>Add Col</span>
        </button>
      </div>

      {/* Main Grid View or Chart View */}
      <div className="flex-1 flex overflow-hidden">
        {showChartView ? (
          /* Interactive Chart View */
          <div className="flex-1 p-8 overflow-y-auto bg-black/5 dark:bg-black/40 flex flex-col items-center">
            <div className={`w-full max-w-4xl p-6 rounded-2xl border shadow-xl ${
              settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span>Spreadsheet Visual Analytics ({currentSheet.name})</span>
                  </h3>
                  <p className="text-xs opacity-60">Dynamic bar chart rendered from current dataset rows.</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-400 font-mono">${grandTotal.toLocaleString()}</div>
                  <div className="text-[10px] opacity-60 uppercase font-mono">Grand Total</div>
                </div>
              </div>

              {/* Bar Chart Representation */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                {currentSheet.rows.map((row, idx) => {
                  const label = row[0] || `Row #${idx + 1}`;
                  const val = parseFloat(row[row.length - 1]) || 0;
                  const maxVal = Math.max(...currentSheet.rows.map(r => parseFloat(r[r.length - 1]) || 1));
                  const percentage = Math.max(8, Math.min(100, Math.round((val / maxVal) * 100)));

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate max-w-md">{label}</span>
                        <span className="font-mono text-emerald-400">${val.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Spreadsheet Grid View */
          <div className="flex-1 overflow-auto bg-white dark:bg-neutral-950 font-mono text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-neutral-100 border-black/15'} border-b sticky top-0 z-10`}>
                  {/* Row index header */}
                  <th className="w-12 p-2 border-r border-white/10 text-center opacity-40 font-mono font-normal">#</th>
                  {currentSheet.headers.map((h, cIdx) => (
                    <th key={cIdx} className="p-2.5 text-left border-r border-white/10 font-bold group relative min-w-[140px]">
                      <div className="flex items-center justify-between">
                        <span>{getColLetter(cIdx)} • {h}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => sortColumn(cIdx, 'asc')} className="p-0.5 hover:text-emerald-400" title="Sort A-Z">
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => sortColumn(cIdx, 'desc')} className="p-0.5 hover:text-emerald-400" title="Sort Z-A">
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="w-10 p-2 text-center opacity-40"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentSheet.rows.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    className={`transition-colors ${
                      selectedCell.row === rIdx ? 'bg-emerald-500/5' : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {/* Row Index */}
                    <td className="p-2 border-r border-white/10 text-center opacity-40 select-none bg-neutral-100/50 dark:bg-neutral-900/50">
                      {rIdx + 1}
                    </td>

                    {/* Columns */}
                    {row.map((cell, cIdx) => {
                      const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                      const evaluated = evaluateCellFormula(cell, currentSheet.rows);

                      return (
                        <td 
                          key={cIdx} 
                          onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                          className={`p-0 border-r border-white/10 relative ${
                            isSelected ? 'ring-2 ring-emerald-500 z-10' : ''
                          }`}
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                            className="w-full h-full px-2.5 py-1.5 bg-transparent outline-none font-mono text-xs"
                          />
                        </td>
                      );
                    })}

                    {/* Delete Row button */}
                    <td className="p-1 text-center">
                      <button 
                        onClick={() => deleteRow(rIdx)}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 opacity-30 hover:opacity-100 transition-opacity"
                        title="Delete row"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Sheet Tab Bar & Grand Total */}
      <div className={`h-8 border-t px-4 flex items-center justify-between text-xs ${
        settings.theme === 'dark' ? 'bg-neutral-900/90 border-white/10' : 'bg-neutral-100/90 border-black/10'
      }`}>
        {/* Sheet Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto">
          {sheets.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSheetIndex(idx)}
              className={`px-3 py-1 rounded-t-md text-[11px] font-medium transition-colors border-b-2 ${
                activeSheetIndex === idx
                  ? 'border-emerald-500 text-emerald-400 bg-white/5 font-semibold'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={handleAddNewSheetTab}
            className="p-1 rounded hover:bg-white/10 text-emerald-400"
            title="Add sheet tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Summary Info */}
        <div className="flex items-center space-x-4 font-mono text-[11px] opacity-75">
          <span>Rows: {currentSheet.rows.length}</span>
          <span>•</span>
          <span>Cols: {currentSheet.headers.length}</span>
          <span>•</span>
          <span className="font-bold text-emerald-400">Total: ${grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* New Spreadsheet Templates Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-emerald-500" />
                <span>Create New Spreadsheet</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  name: 'Blank Sheet', 
                  desc: 'Empty grid ready for calculations.',
                  headers: ['Item', 'Category', 'Rate', 'Units', 'Total'],
                  rows: [['New Item', 'General', '10.00', '1', '10.00']]
                },
                { 
                  name: 'Studio Budget & P&L', 
                  desc: 'Department expenses, hourly rates and cost totals.',
                  headers: ['Asset Pipeline', 'Department', 'Rate ($)', 'Qty', 'Total ($)'],
                  rows: [
                    ['VFX Volumetrics', '3D Scene 01', '40.00', '3.5', '140.00'],
                    ['Color Conform 4K', 'Post-Production', '18.00', '5', '90.00'],
                    ['Sound Stem Mastering', 'Audio Studio', '85.00', '2', '170.00']
                  ]
                },
                { 
                  name: 'Render Benchmarks', 
                  desc: 'GPU clock speeds, frame rates and peak thermals.',
                  headers: ['Project Scene', 'Resolution', 'Frames', 'Render Secs', 'Peak Temp (°C)'],
                  rows: [
                    ['Cycles Raytracing Master', '4K HDR', '120', '480', '68'],
                    ['Geometry Nodes Simulation', '1080p 120fps', '240', '210', '64'],
                    ['Dolby Atmos Mix Pass', '24-bit 96kHz', '1', '45', '58']
                  ]
                },
                { 
                  name: 'Inventory & Assets', 
                  desc: 'Hardware serials, studio displays, camera rigs.',
                  headers: ['Hardware Asset', 'Location', 'Purchase Price', 'Depreciation', 'Net Value'],
                  rows: [
                    ['Apple Studio Display 5K', 'Desk 01', '1599.00', '200.00', '1399.00'],
                    ['Mac Pro M3 Ultra 192GB', 'Rack Unit 4', '6999.00', '800.00', '6199.00'],
                    ['Blackmagic URSA 12K', 'Studio Floor', '5995.00', '600.00', '5395.00']
                  ]
                }
              ].map((t) => (
                <div
                  key={t.name}
                  onClick={() => handleCreateTemplate(t.name, t.headers, t.rows)}
                  className="p-3.5 rounded-xl border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/10 cursor-pointer transition-all"
                >
                  <div className="font-semibold text-xs text-emerald-400">{t.name}</div>
                  <div className="text-[10px] opacity-60 mt-1">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Open Spreadsheet Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl ${
            settings.theme === 'dark' ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/15'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-500" />
                <span>Open Spreadsheet from Google Drive</span>
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="hover:opacity-100 opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
              {files.filter(f => f.type === 'spreadsheet' || f.name.endsWith('.sheet') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv')).map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleOpenFile(f)}
                  className="p-3 hover:bg-white/5 cursor-pointer rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Table className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="font-semibold text-xs">{f.name}</div>
                      <div className="text-[10px] opacity-60">{f.path} • {f.size}</div>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 text-xs font-semibold">
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
