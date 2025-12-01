/**
 * Export Utility Functions
 * 
 * Provides functions to export data in various formats (CSV, Excel, PDF)
 */

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  filename?: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], headers: string[], filename: string = 'export.csv') {
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to JSON format
 */
/**
 * Export data to Excel format (CSV for now, can be enhanced with xlsx library)
 */
function exportToExcel(
  data: any[],
  headers: string[],
  filename: string = 'export.csv'
) {
  // For now, use CSV format
  // In production, install 'xlsx' package and generate true Excel files
  return exportToCSV(data, headers, filename.replace('.xlsx', '.csv').replace('.xls', '.csv'));
}

/**
 * Generate download link for exported data
 */
function downloadExport(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function exportToJSON(data: any[], filename: string = 'export.json') {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
function formatDateForExport(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return `$${amount.toFixed(2)}`;
}

