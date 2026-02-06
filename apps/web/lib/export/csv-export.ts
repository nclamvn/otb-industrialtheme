/**
 * CSV Export Utilities
 */

interface CSVExportOptions {
  filename: string;
  headers?: string[];
  delimiter?: string;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  options: CSVExportOptions
): void {
  const { filename, headers, delimiter = ',' } = options;

  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine headers
  const csvHeaders = headers || Object.keys(data[0]);

  // Convert data to CSV format
  const csvContent = [
    csvHeaders.join(delimiter),
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          // Handle special characters and commas
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(delimiter)
    ),
  ].join('\n');

  // Create and trigger download
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
