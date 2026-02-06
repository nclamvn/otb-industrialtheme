/**
 * Excel I/O Types
 * Core types for reading/writing Excel and CSV files
 */

// Cell value types
export type CellValue = string | number | boolean | null

// Cell formatting (minimal for I/O)
export interface CellFormat {
  bold?: boolean
  italic?: boolean
  textColor?: string
  backgroundColor?: string
  fontSize?: number
  align?: 'left' | 'center' | 'right'
  numberFormat?: string
}

// Cell data
export interface CellData {
  value: CellValue
  formula: string | null
  displayValue: string
  format?: CellFormat
}

// Cell position
export interface CellPosition {
  row: number
  col: number
}

// Cell range
export interface CellRange {
  start: CellPosition
  end: CellPosition
}

// Sheet data
export interface Sheet {
  id: string
  name: string
  index: number
  cells: Record<string, CellData> // key: "row:col"
  tabColor?: string
  hidden?: boolean
  rowHeights?: Record<number, number>
  columnWidths?: Record<number, number>
  freezePane?: { row: number; col: number }
}

// Workbook data
export interface Workbook {
  id: string
  name: string
  sheets: Sheet[]
}

// Import result
export interface ImportResult {
  sheets: Array<{
    name: string
    cells: Record<string, CellData>
  }>
}

// Export options
export interface ExportOptions {
  fileName?: string
  includeFormulas?: boolean
  includeFormatting?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create cell key from row and column indices
 */
export const getCellKey = (row: number, col: number): string => `${row}:${col}`

/**
 * Parse cell key to row and column indices
 */
export const parseCellKey = (key: string): CellPosition => {
  const [row, col] = key.split(':').map(Number)
  return { row, col }
}

/**
 * Convert column index to letter (0 -> A, 25 -> Z, 26 -> AA)
 */
export const colToLetter = (col: number): string => {
  let result = ''
  let n = col + 1
  while (n > 0) {
    n -= 1
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

/**
 * Convert letter to column index (A -> 0, Z -> 25, AA -> 26)
 */
export const letterToCol = (s: string): number => {
  let result = 0
  for (const c of s.toUpperCase()) {
    result = result * 26 + (c.charCodeAt(0) - 64)
  }
  return result - 1
}

/**
 * Convert row and column to cell reference (0, 0) -> "A1"
 */
export const toCellRef = (row: number, col: number): string => {
  return `${colToLetter(col)}${row + 1}`
}

/**
 * Parse cell reference to row and column
 */
export const parseCellRef = (ref: string): CellPosition | null => {
  const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/)
  if (!match) return null

  const col = letterToCol(match[1])
  const row = parseInt(match[2], 10) - 1

  if (row < 0 || col < 0) return null
  return { row, col }
}
