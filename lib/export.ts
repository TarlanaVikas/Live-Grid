import type { CellData } from "@/lib/types";

/**
 * Export spreadsheet data to CSV format
 */
export function exportToCSV(
  cells: Map<string, CellData>,
  title: string,
  rows: number = 100,
  cols: number = 26,
  colOrder?: number[],
  rowOrder?: number[]
): string {
  const orderedCols = colOrder || Array.from({ length: cols }, (_, i) => i);
  const orderedRows = rowOrder || Array.from({ length: rows }, (_, i) => i);

  // Find the actual used range
  const usedRange = findUsedRange(cells, orderedCols, orderedRows);
  const actualCols = orderedCols.slice(0, Math.max(usedRange.maxCol + 1, 1));
  const actualRows = orderedRows.slice(0, Math.max(usedRange.maxRow + 1, 1));

  const lines: string[] = [];

  // Add title as first line
  lines.push(`${escapeCsv(title)}`);
  lines.push(""); // Empty line for spacing

  // Add headers
  const headers = actualCols.map((col) => String.fromCharCode(65 + col)).join(",");
  lines.push(headers);

  // Add data rows (export all rows for proper alignment)
  for (const rowIdx of actualRows) {
    const rowData: string[] = [];
    for (const colIdx of actualCols) {
      const cellKey = `${colIdx}_${rowIdx}`;
      const cell = cells.get(cellKey);
      const value = cell?.value || "";
      rowData.push(escapeCsv(value));
    }
    lines.push(rowData.join(","));
  }

  return lines.join("\n");
}

/**
 * Export spreadsheet data to JSON format
 */
export function exportToJSON(
  cells: Map<string, CellData>,
  title: string,
  rows: number = 100,
  cols: number = 26,
  colOrder?: number[],
  rowOrder?: number[]
): string {
  const data: Record<string, Record<string, CellData>> = {};

  const orderedCols = colOrder || Array.from({ length: cols }, (_, i) => i);
  const orderedRows = rowOrder || Array.from({ length: rows }, (_, i) => i);

  // Find the actual used range
  const usedRange = findUsedRange(cells, orderedCols, orderedRows);
  const actualCols = orderedCols.slice(0, Math.max(usedRange.maxCol + 1, 1));
  const actualRows = orderedRows.slice(0, Math.max(usedRange.maxRow + 1, 1));

  for (const rowIdx of actualRows) {
    const rowKey = `row_${rowIdx}`;
    data[rowKey] = {};

    for (const colIdx of actualCols) {
      const colLetter = String.fromCharCode(65 + colIdx);
      const cellKey = `${colIdx}_${rowIdx}`;
      const cell = cells.get(cellKey);

      if (cell && (cell.value || cell.formula)) {
        data[rowKey][colLetter] = cell;
      }
    }
  }

  return JSON.stringify(
    {
      title,
      exportDate: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}

/**
 * Export spreadsheet data to HTML table
 */
export function exportToHTML(
  cells: Map<string, CellData>,
  title: string,
  rows: number = 100,
  cols: number = 26,
  colOrder?: number[],
  rowOrder?: number[]
): string {
  const orderedCols = colOrder || Array.from({ length: cols }, (_, i) => i);
  const orderedRows = rowOrder || Array.from({ length: rows }, (_, i) => i);

  // Find the actual used range
  const usedRange = findUsedRange(cells, orderedCols, orderedRows);
  const actualCols = orderedCols.slice(0, Math.max(usedRange.maxCol + 1, 1));
  const actualRows = orderedRows.slice(0, Math.max(usedRange.maxRow + 1, 1));

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <table>
    <thead>
      <tr>`;

  // Add headers
  for (const colIdx of actualCols) {
    html += `<th>${String.fromCharCode(65 + colIdx)}</th>`;
  }
  html += `</tr>
    </thead>
    <tbody>`;

  // Add data rows (export all rows for proper alignment)
  for (const rowIdx of actualRows) {
    html += `<tr>`;
    for (const colIdx of actualCols) {
      const cellKey = `${colIdx}_${rowIdx}`;
      const cell = cells.get(cellKey);
      const value = cell?.value || "";
      const style = getStyleString(cell);
      html += `<td${style}>${escapeHtml(value)}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody>
  </table>
</body>
</html>`;

  return html;
}

/**
 * Export spreadsheet data to TSV (Tab-Separated Values)
 */
export function exportToTSV(
  cells: Map<string, CellData>,
  title: string,
  rows: number = 100,
  cols: number = 26,
  colOrder?: number[],
  rowOrder?: number[]
): string {
  const orderedCols = colOrder || Array.from({ length: cols }, (_, i) => i);
  const orderedRows = rowOrder || Array.from({ length: rows }, (_, i) => i);

  // Find the actual used range
  const usedRange = findUsedRange(cells, orderedCols, orderedRows);
  const actualCols = orderedCols.slice(0, Math.max(usedRange.maxCol + 1, 1));
  const actualRows = orderedRows.slice(0, Math.max(usedRange.maxRow + 1, 1));

  const lines: string[] = [];

  // Add title
  lines.push(title);
  lines.push("");

  // Add headers
  const headers = actualCols.map((col) => String.fromCharCode(65 + col)).join("\t");
  lines.push(headers);

  // Add data rows (export all rows for proper alignment)
  for (const rowIdx of actualRows) {
    const rowData: string[] = [];
    for (const colIdx of actualCols) {
      const cellKey = `${colIdx}_${rowIdx}`;
      const cell = cells.get(cellKey);
      const value = cell?.value || "";
      rowData.push(value);
    }
    lines.push(rowData.join("\t"));
  }

  return lines.join("\n");
}

/**
 * Trigger a file download
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Helper function to escape CSV values
 */
function escapeCsv(value: string): string {
  if (!value) return '""';
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper function to get inline styles for HTML export
 */
function getStyleString(cell: CellData | undefined): string {
  if (!cell?.format) return "";

  const styles: string[] = [];

  if (cell.format.bold) {
    styles.push("font-weight: bold");
  }
  if (cell.format.italic) {
    styles.push("font-style: italic");
  }
  if (cell.format.textColor) {
    styles.push(`color: ${cell.format.textColor}`);
  }
  if (cell.format.bgColor) {
    styles.push(`background-color: ${cell.format.bgColor}`);
  }

  return styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
}

/**
 * Helper function to find the actual used range of the spreadsheet
 */
function findUsedRange(
  cells: Map<string, CellData>,
  orderedCols: number[],
  orderedRows: number[]
): { maxCol: number; maxRow: number } {
  let maxCol = 0;
  let maxRow = 0;

  for (const [key, cell] of cells) {
    if (cell.value || cell.formula) {
      const [colStr, rowStr] = key.split('_');
      const col = parseInt(colStr, 10);
      const row = parseInt(rowStr, 10);

      if (col > maxCol) maxCol = col;
      if (row > maxRow) maxRow = row;
    }
  }

  // Ensure we don't exceed the ordered arrays
  maxCol = Math.min(maxCol, orderedCols.length - 1);
  maxRow = Math.min(maxRow, orderedRows.length - 1);

  return { maxCol, maxRow };
}
