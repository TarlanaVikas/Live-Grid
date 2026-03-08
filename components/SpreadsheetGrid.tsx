"use client";

import { useCallback, useRef, useState } from "react";
import { Cell } from "./Cell";
import { colToLetter, evaluateFormula, isFormula } from "@/lib/formula";
import { cellKey } from "@/lib/documents";
import { exportToCSV, exportToJSON, exportToHTML, exportToTSV, downloadFile } from "@/lib/export";
import type { CellData } from "@/lib/types";

const COLS = 26;
const ROWS = 100;

interface SpreadsheetGridProps {
  docId: string;
  title: string;
  cells: Map<string, CellData>;
  onCellUpdate: (col: number, row: number, value: string, formula?: string, format?: any) => void;
  pendingWrites: boolean;
}

export function SpreadsheetGrid({
  docId,
  title,
  cells,
  onCellUpdate,
  pendingWrites,
}: SpreadsheetGridProps) {
  const [selected, setSelected] = useState<{ col: number; row: number }>({ col: 0, row: 0 });
  const [colOrder, setColOrder] = useState<number[]>(() => Array.from({ length: COLS }, (_, i) => i));
  const [rowOrder, setRowOrder] = useState<number[]>(() => Array.from({ length: ROWS }, (_, i) => i));
  const [draggedCol, setDraggedCol] = useState<number | null>(null);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const getCellValueInternal = useCallback(
    (col: number, row: number, visited: Set<string>): string | undefined => {
      const key = cellKey(col, row);
      if (visited.has(key)) return "#CIRCULAR";
      const data = cells.get(key);
      if (!data) return undefined;
      if (data.formula && isFormula(data.formula)) {
        visited.add(key);
        try {
          return evaluateFormula(
            data.formula,
            (c, r) => getCellValueInternal(c, r, visited) ?? "0"
          );
        } finally {
          visited.delete(key);
        }
      }
      return data.value;
    },
    [cells]
  );

  const getCellValue = useCallback(
    (col: number, row: number): string | undefined =>
      getCellValueInternal(col, row, new Set()),
    [getCellValueInternal]
  );

  const navigate = useCallback((dir: "left" | "right" | "up" | "down") => {
    setSelected((prev) => {
      switch (dir) {
        case "right": return { col: Math.min(prev.col + 1, COLS - 1), row: prev.row };
        case "left": return { col: Math.max(prev.col - 1, 0), row: prev.row };
        case "down": return { col: prev.col, row: Math.min(prev.row + 1, ROWS - 1) };
        case "up": return { col: prev.col, row: Math.max(prev.row - 1, 0) };
        default: return prev;
      }
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { col, row } = selected;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          navigate("right");
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigate("left");
          break;
        case "ArrowDown":
          e.preventDefault();
          navigate("down");
          break;
        case "ArrowUp":
          e.preventDefault();
          navigate("up");
          break;
        case "Tab":
          e.preventDefault();
          navigate(e.shiftKey ? "left" : "right");
          break;
        case "Enter":
          e.preventDefault();
          navigate("down");
          break;
      }
    },
    [selected, navigate]
  );

  // Column drag and drop handlers
  const handleColDragStart = useCallback((col: number) => {
    setDraggedCol(col);
  }, []);

  const handleColDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleColDrop = useCallback((targetCol: number) => {
    if (draggedCol === null || draggedCol === targetCol) {
      setDraggedCol(null);
      return;
    }

    setColOrder((prev) => {
      const newOrder = [...prev];
      const draggedValue = newOrder[draggedCol];
      newOrder.splice(draggedCol, 1);
      newOrder.splice(targetCol, 0, draggedValue);
      return newOrder;
    });

    setDraggedCol(null);
  }, [draggedCol]);

  // Row drag and drop handlers
  const handleRowDragStart = useCallback((row: number) => {
    setDraggedRow(row);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRowDrop = useCallback((targetRow: number) => {
    if (draggedRow === null || draggedRow === targetRow) {
      setDraggedRow(null);
      return;
    }

    setRowOrder((prev) => {
      const newOrder = [...prev];
      const draggedValue = newOrder[draggedRow];
      newOrder.splice(draggedRow, 1);
      newOrder.splice(targetRow, 0, draggedValue);
      return newOrder;
    });

    setDraggedRow(null);
  }, [draggedRow]);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const csv = exportToCSV(cells, title, ROWS, COLS, colOrder, rowOrder);
    downloadFile(csv, `${title || "spreadsheet"}.csv`, "text/csv");
    setShowExportMenu(false);
  }, [cells, title, colOrder, rowOrder]);

  const handleExportJSON = useCallback(() => {
    const json = exportToJSON(cells, title, ROWS, COLS, colOrder, rowOrder);
    downloadFile(json, `${title || "spreadsheet"}.json`, "application/json");
    setShowExportMenu(false);
  }, [cells, title, colOrder, rowOrder]);

  const handleExportHTML = useCallback(() => {
    const html = exportToHTML(cells, title, ROWS, COLS, colOrder, rowOrder);
    downloadFile(html, `${title || "spreadsheet"}.html`, "text/html");
    setShowExportMenu(false);
  }, [cells, title, colOrder, rowOrder]);

  const handleExportTSV = useCallback(() => {
    const tsv = exportToTSV(cells, title, ROWS, COLS, colOrder, rowOrder);
    downloadFile(tsv, `${title || "spreadsheet"}.tsv`, "text/tab-separated-values");
    setShowExportMenu(false);
  }, [cells, title, colOrder, rowOrder]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-6 border-b border-border bg-card-bg px-6 py-3">
        {/* Formatting Tools */}
        <div className="flex items-center gap-1">
          <div className="mr-4 text-sm font-medium text-muted">Format</div>

          {/* Bold */}
          <button
            type="button"
            onClick={() => {
              const key = cellKey(selected.col, selected.row);
              const current = cells.get(key);
              const value = current?.value || '';
              const formula = current?.formula;
              const format = current?.format || {};
              const newFormat = { ...format, bold: !format.bold };
              onCellUpdate(selected.col, selected.row, value, formula, newFormat);
            }}
            className={`btn-hover hover-scale flex h-8 w-8 items-center justify-center rounded border text-sm font-bold transition-all duration-200 ${
              cells.get(cellKey(selected.col, selected.row))?.format?.bold
                ? 'border-primary bg-primary text-white shadow-md'
                : 'border-border bg-card-bg text-foreground hover:bg-hover-bg hover:border-primary/50'
            }`}
            title="Bold (Ctrl+B)"
          >
            B
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => {
              const key = cellKey(selected.col, selected.row);
              const current = cells.get(key);
              const value = current?.value || '';
              const formula = current?.formula;
              const format = current?.format || {};
              const newFormat = { ...format, italic: !format.italic };
              onCellUpdate(selected.col, selected.row, value, formula, newFormat);
            }}
            className={`btn-hover hover-scale flex h-8 w-8 items-center justify-center rounded border text-sm font-bold italic transition-all duration-200 ${
              cells.get(cellKey(selected.col, selected.row))?.format?.italic
                ? 'border-primary bg-primary text-white shadow-md'
                : 'border-border bg-card-bg text-foreground hover:bg-hover-bg hover:border-primary/50'
            }`}
            title="Italic (Ctrl+I)"
          >
            I
          </button>

          {/* Text Color */}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-muted">Text:</span>
            <div className="relative group">
              <input
                type="color"
                key={`${selected.col}-${selected.row}-text`}
                value={cells.get(cellKey(selected.col, selected.row))?.format?.textColor || '#000000'}
                onInput={(e) => {
                  const key = cellKey(selected.col, selected.row);
                  const current = cells.get(key);
                  const value = current?.value || '';
                  const formula = current?.formula;
                  const format = current?.format || {};
                  const newFormat = { ...format, textColor: (e.target as HTMLInputElement).value };
                  onCellUpdate(selected.col, selected.row, value, formula, newFormat);
                }}
                className="w-8 h-8 border border-border rounded cursor-pointer hover-scale transition-all duration-200 hover:border-primary/50 hover:shadow-md"
                title="Text Color"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          </div>

          {/* Background Color */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Fill:</span>
            <div className="relative group">
              <input
                type="color"
                key={`${selected.col}-${selected.row}-bg`}
                value={cells.get(cellKey(selected.col, selected.row))?.format?.bgColor || '#ffffff'}
                onInput={(e) => {
                  const key = cellKey(selected.col, selected.row);
                  const current = cells.get(key);
                  const value = current?.value || '';
                  const formula = current?.formula;
                  const format = current?.format || {};
                  const newFormat = { ...format, bgColor: (e.target as HTMLInputElement).value };
                  onCellUpdate(selected.col, selected.row, value, formula, newFormat);
                }}
                className="w-8 h-8 border border-border rounded cursor-pointer hover-scale transition-all duration-200 hover:border-primary/50 hover:shadow-md"
                title="Background Color"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          </div>
        </div>

        {/* Cell Reference */}
        <div className="ml-auto flex items-center gap-4 text-sm text-muted fade-in">
          <span>Cell:</span>
          <span className="font-mono font-medium text-foreground bg-accent px-3 py-1.5 rounded-md border border-border hover-scale transition-all duration-200 hover:border-primary/30 hover:bg-primary/5">
            {colToLetter(selected.col)}{selected.row + 1}
          </span>

          {/* Export Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-hover flex items-center gap-2 rounded-lg border border-border bg-card-bg px-4 py-2 text-sm font-medium text-foreground hover:bg-hover-bg hover:border-primary/50 transition-all duration-200"
              title="Export spreadsheet"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card-bg shadow-lg z-50 fade-in">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg text-sm font-medium text-foreground transition-colors border-b border-border"
                >
                  📄 Export as CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg text-sm font-medium text-foreground transition-colors border-b border-border"
                >
                  📋 Export as JSON
                </button>
                <button
                  type="button"
                  onClick={handleExportTSV}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg text-sm font-medium text-foreground transition-colors border-b border-border"
                >
                  📑 Export as TSV
                </button>
                <button
                  type="button"
                  onClick={handleExportHTML}
                  className="w-full text-left px-4 py-2 hover:bg-hover-bg text-sm font-medium text-foreground transition-colors rounded-b-lg"
                >
                  🌐 Export as HTML
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        ref={gridRef}
        className="flex-1 overflow-auto"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <table className="border-collapse bg-card-bg" style={{ minWidth: COLS * 100 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-12 border-r border-b border-border bg-accent px-3 py-2 text-left text-xs font-semibold text-muted" />
              {colOrder.map((originalCol, displayIndex) => (
                <th
                  key={originalCol}
                  draggable
                  onDragStart={() => handleColDragStart(displayIndex)}
                  onDragOver={handleColDragOver}
                  onDrop={() => handleColDrop(displayIndex)}
                  className={`min-w-[100px] border-r border-b px-3 py-2 text-center text-xs font-semibold cursor-move user-select-none transition-colors ${
                    draggedCol === displayIndex
                      ? 'bg-primary/20 border-primary/50'
                      : 'border-border bg-accent text-muted hover:bg-primary/10'
                  }`}
                  title="Drag to reorder columns"
                >
                  {colToLetter(originalCol)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowOrder.map((originalRow, displayIndex) => (
              <tr key={originalRow}>
                <td
                  draggable
                  onDragStart={() => handleRowDragStart(displayIndex)}
                  onDragOver={handleRowDragOver}
                  onDrop={() => handleRowDrop(displayIndex)}
                  className={`sticky left-0 z-10 w-12 border-r border-b px-3 py-2 text-right text-xs font-medium cursor-move user-select-none transition-colors ${
                    draggedRow === displayIndex
                      ? 'bg-primary/20 border-primary/50'
                      : 'border-border bg-accent text-muted hover:bg-primary/10'
                  }`}
                  title="Drag to reorder rows"
                >
                  {originalRow + 1}
                </td>
                {colOrder.map((originalCol) => (
                  <Cell
                    key={cellKey(originalCol, originalRow)}
                    col={originalCol}
                    row={originalRow}
                    data={cells.get(cellKey(originalCol, originalRow))}
                    isSelected={selected.col === originalCol && selected.row === originalRow}
                    onSelect={() => {
                      setSelected({ col: originalCol, row: originalRow });
                      gridRef.current?.focus();
                    }}
                    onUpdate={(value, formula) => onCellUpdate(originalCol, originalRow, value, formula)}
                    onNavigate={navigate}
                    getCellValue={getCellValue}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
