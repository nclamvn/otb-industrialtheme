import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: Record<string, any>[];
}

export interface ExcelFile {
  filename: string;
  sheets: ExcelSheet[];
}

export class ExcelReader {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(__dirname, '../data');
  }

  /**
   * Read Excel file using ExcelJS (better for large files)
   */
  async readExcelJS(filePath: string): Promise<ExcelFile> {
    const fullPath = this.resolvePath(filePath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(fullPath);

    const sheets: ExcelSheet[] = [];

    workbook.eachSheet((worksheet) => {
      const headers: string[] = [];
      const rows: Record<string, any>[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // Header row
          row.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = this.normalizeHeader(cell.value?.toString() || `col_${colNumber}`);
          });
        } else {
          // Data rows
          const rowData: Record<string, any> = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = this.getCellValue(cell);
            }
          });

          // Only add non-empty rows
          if (Object.values(rowData).some(v => v !== null && v !== undefined && v !== '')) {
            rows.push(rowData);
          }
        }
      });

      sheets.push({
        name: worksheet.name,
        headers,
        rows,
      });
    });

    return {
      filename: path.basename(filePath),
      sheets,
    };
  }

  /**
   * Read Excel file using XLSX (faster for simple files)
   */
  readXLSX(filePath: string): ExcelFile {
    const fullPath = this.resolvePath(filePath);
    const workbook = XLSX.readFile(fullPath);

    const sheets: ExcelSheet[] = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        header: 1,
        defval: null,
      });

      if (jsonData.length === 0) {
        return { name: sheetName, headers: [], rows: [] };
      }

      // First row is headers
      const headers = (jsonData[0] as any[]).map((h, i) =>
        this.normalizeHeader(h?.toString() || `col_${i}`)
      );

      // Rest are data rows
      const rows = jsonData.slice(1).map((row: any[]) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] ?? null;
        });
        return rowData;
      }).filter(row =>
        Object.values(row).some(v => v !== null && v !== undefined && v !== '')
      );

      return { name: sheetName, headers, rows };
    });

    return {
      filename: path.basename(filePath),
      sheets,
    };
  }

  /**
   * Get specific sheet by name
   */
  async getSheet(filePath: string, sheetName: string): Promise<ExcelSheet | null> {
    const file = await this.readExcelJS(filePath);
    return file.sheets.find(s => s.name === sheetName) || null;
  }

  /**
   * List all Excel files in data directory
   */
  listExcelFiles(subDir?: string): string[] {
    const dir = subDir ? path.join(this.dataDir, subDir) : this.dataDir;

    if (!fs.existsSync(dir)) {
      return [];
    }

    const files: string[] = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const subFiles = this.listExcelFiles(path.join(subDir || '', item.name));
        files.push(...subFiles);
      } else if (item.name.match(/\.(xlsx|xls)$/i)) {
        files.push(path.join(subDir || '', item.name));
      }
    }

    return files;
  }

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    return fs.existsSync(this.resolvePath(filePath));
  }

  // Helper methods
  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.dataDir, filePath);
  }

  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private getCellValue(cell: ExcelJS.Cell): any {
    const value = cell.value;

    if (value === null || value === undefined) {
      return null;
    }

    // Handle different cell types
    if (typeof value === 'object') {
      // Date
      if (value instanceof Date) {
        return value;
      }
      // Rich text
      if ('richText' in value) {
        return (value as ExcelJS.CellRichTextValue).richText
          .map(rt => rt.text)
          .join('');
      }
      // Formula result
      if ('result' in value) {
        return (value as ExcelJS.CellFormulaValue).result;
      }
      // Hyperlink
      if ('hyperlink' in value) {
        return (value as ExcelJS.CellHyperlinkValue).text;
      }
    }

    return value;
  }
}

export const excelReader = new ExcelReader();
