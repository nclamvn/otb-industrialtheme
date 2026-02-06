/**
 * Excel Export Utilities using xlsx library
 */

import * as XLSX from 'xlsx';

interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers?: Record<string, string>;
  columnWidths?: Record<string, number>;
}

interface MultiSheetExportOptions {
  filename: string;
  sheets: {
    name: string;
    data: Record<string, unknown>[];
    headers?: Record<string, string>;
    columnWidths?: Record<string, number>;
  }[];
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExcelExportOptions
): void {
  const { filename, sheetName = 'Sheet1', headers, columnWidths } = options;

  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Transform data if headers mapping is provided
  const transformedData = headers
    ? data.map((row) => {
        const transformed: Record<string, unknown> = {};
        for (const [key, label] of Object.entries(headers)) {
          transformed[label] = row[key];
        }
        return transformed;
      })
    : data;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(transformedData);

  // Apply column widths
  if (columnWidths) {
    const cols = Object.keys(headers || data[0]).map((key) => ({
      wch: columnWidths[key] || 15,
    }));
    worksheet['!cols'] = cols;
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportMultiSheetExcel(options: MultiSheetExportOptions): void {
  const { filename, sheets } = options;

  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;

    // Transform data if headers mapping is provided
    const transformedData = sheet.headers
      ? sheet.data.map((row) => {
          const transformed: Record<string, unknown> = {};
          for (const [key, label] of Object.entries(sheet.headers!)) {
            transformed[label] = row[key];
          }
          return transformed;
        })
      : sheet.data;

    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    // Apply column widths
    if (sheet.columnWidths) {
      const cols = Object.keys(sheet.headers || sheet.data[0]).map((key) => ({
        wch: sheet.columnWidths![key] || 15,
      }));
      worksheet['!cols'] = cols;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function parseExcelFile<T = Record<string, unknown>>(
  file: File
): Promise<{ sheetName: string; data: T[] }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const result = workbook.SheetNames.map((sheetName) => ({
          sheetName,
          data: XLSX.utils.sheet_to_json<T>(workbook.Sheets[sheetName]),
        }));

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
