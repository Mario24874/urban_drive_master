// Zero-dependency report export for the Admin Portal: CSV download + PDF via
// browser print. Avoids pulling in xlsx/jspdf for what is fundamentally a
// "dump this table" feature.

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

function escapeCsv(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportToCSV<T>(filename: string, rows: T[], columns: ExportColumn<T>[]): void {
  const header = columns.map((c) => escapeCsv(c.header)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsv(c.accessor(row))).join(','));
  const csv = [header, ...lines].join('\n');
  // BOM so Excel opens UTF-8 accented characters correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string | number): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportToPDF<T>(title: string, rows: T[], columns: ExportColumn<T>[]): void {
  const win = window.open('', '_blank', 'width=1000,height=750');
  if (!win) return;

  const thead = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('');
  const tbody = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.accessor(row))}</td>`).join('')}</tr>`)
    .join('');

  win.document.open();
  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p.meta { color: #666; font-size: 12px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f0f0f0; }
  tr:nth-child(even) { background: #fafafa; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${escapeHtml(new Date().toLocaleString())} · ${rows.length} filas</p>
  <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
