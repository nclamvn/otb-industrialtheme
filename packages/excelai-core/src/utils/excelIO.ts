/**
 * Excel I/O Utilities
 * Functions for reading and writing Excel/CSV files
 */

import * as XLSX from 'xlsx'
import type { CellData, Sheet, ImportResult, CellValue } from './types'
import { getCellKey } from './types'

// Type augmentation for xlsx
const XLSXUtils = XLSX.utils as typeof XLSX.utils & {
  aoa_to_sheet: (data: unknown[][]) => XLSX.WorkSheet
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT EXCEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Import Excel file from File object (browser)
 */
export const importExcelFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const result = importExcelFromBuffer(data)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Import Excel from buffer (Node.js compatible)
 */
export const importExcelFromBuffer = (data: Uint8Array | ArrayBuffer): ImportResult => {
  const workbook = XLSX.read(data, { type: 'array', cellStyles: true })

  const sheets: ImportResult['sheets'] = []

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    }) as unknown[][]

    const cells: Record<string, CellData> = {}

    jsonData.forEach((row, rowIndex) => {
      if (Array.isArray(row)) {
        row.forEach((cellValue, colIndex) => {
          if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
            const key = getCellKey(rowIndex, colIndex)
            const value = typeof cellValue === 'number' ? cellValue :
                         typeof cellValue === 'boolean' ? cellValue :
                         String(cellValue)

            cells[key] = {
              value,
              formula: null,
              displayValue: String(value),
            }
          }
        })
      }
    })

    sheets.push({ name: sheetName, cells })
  })

  return { sheets }
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT CSV
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Import CSV file from File object (browser)
 */
export const importCSVFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const result = importCSVFromString(text, file.name.replace(/\.csv$/i, ''))
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Import CSV from string (Node.js compatible)
 */
export const importCSVFromString = (text: string, sheetName: string = 'Sheet1'): ImportResult => {
  const lines = text.split(/\r?\n/)
  const cells: Record<string, CellData> = {}

  lines.forEach((line, rowIndex) => {
    const values = parseCSVLine(line)

    values.forEach((value, colIndex) => {
      if (value !== '') {
        const key = getCellKey(rowIndex, colIndex)
        const numValue = Number(value)
        const finalValue = !isNaN(numValue) && value.trim() !== '' ? numValue : value

        cells[key] = {
          value: finalValue,
          formula: null,
          displayValue: String(finalValue),
        }
      }
    })
  })

  return {
    sheets: [{ name: sheetName, cells }],
  }
}

/**
 * Parse a single CSV line handling quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT EXCEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export sheets to Excel workbook buffer (Node.js compatible)
 */
export const exportToExcelBuffer = (
  sheets: Record<string, Sheet>,
  sheetOrder: string[]
): Uint8Array => {
  const workbook = XLSX.utils.book_new()

  sheetOrder.forEach((sheetId) => {
    const sheet = sheets[sheetId]
    if (!sheet) return

    const data = sheetToArray(sheet)
    const worksheet = XLSXUtils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array
}

/**
 * Export sheets to Excel file (browser - triggers download)
 */
export const exportToExcel = (
  sheets: Record<string, Sheet>,
  sheetOrder: string[],
  fileName: string = 'spreadsheet.xlsx'
): void => {
  const workbook = XLSX.utils.book_new()

  sheetOrder.forEach((sheetId) => {
    const sheet = sheets[sheetId]
    if (!sheet) return

    const data = sheetToArray(sheet)
    const worksheet = XLSXUtils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  XLSX.writeFile(workbook, fileName)
}

/**
 * Convert sheet to 2D array for xlsx
 */
function sheetToArray(sheet: Sheet): CellValue[][] {
  let maxRow = 0
  let maxCol = 0

  Object.keys(sheet.cells).forEach((key) => {
    const [rowStr, colStr] = key.split(':')
    maxRow = Math.max(maxRow, parseInt(rowStr))
    maxCol = Math.max(maxCol, parseInt(colStr))
  })

  const data: CellValue[][] = []

  for (let r = 0; r <= maxRow; r++) {
    data[r] = []
    for (let c = 0; c <= maxCol; c++) {
      const key = getCellKey(r, c)
      const cell = sheet.cells[key]
      data[r][c] = cell?.value ?? ''
    }
  }

  return data
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export sheet to CSV string (Node.js compatible)
 */
export const exportToCSVString = (sheet: Sheet): string => {
  let maxRow = 0
  let maxCol = 0

  Object.keys(sheet.cells).forEach((key) => {
    const [rowStr, colStr] = key.split(':')
    maxRow = Math.max(maxRow, parseInt(rowStr))
    maxCol = Math.max(maxCol, parseInt(colStr))
  })

  const lines: string[] = []

  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = []
    for (let c = 0; c <= maxCol; c++) {
      const key = getCellKey(r, c)
      const cell = sheet.cells[key]
      let value = String(cell?.value ?? '')

      // Escape quotes and wrap if contains comma or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`
      }

      row.push(value)
    }
    lines.push(row.join(','))
  }

  return lines.join('\n')
}

/**
 * Export sheet to CSV file (browser - triggers download)
 */
export const exportToCSV = (
  sheet: Sheet,
  fileName: string = 'spreadsheet.csv'
): void => {
  const csv = exportToCSVString(sheet)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}
