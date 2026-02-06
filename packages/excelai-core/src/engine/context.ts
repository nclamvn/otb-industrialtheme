/**
 * Formula evaluation context
 * Provides data access for formula evaluation
 */

import type { CellReference, FormulaValue, EvalContext } from './types'

export interface FormulaContext {
  /**
   * Get value of a single cell
   */
  getCellValue: (ref: CellReference) => FormulaValue

  /**
   * Get values of a range
   * @returns 2D array of values
   */
  getRangeValues: (start: CellReference, end: CellReference) => FormulaValue[][]

  /**
   * Current cell being evaluated (optional)
   */
  currentCell?: CellReference

  /**
   * Current sheet ID (optional)
   */
  sheetId?: string
}

/**
 * Create empty context (for testing)
 */
export function createEmptyContext(): EvalContext {
  return {
    getCellValue: () => null,
    getRangeValues: () => [],
    sheetId: 'Sheet1'
  }
}

/**
 * Create context from simple data object
 * Keys should be cell references like "A1", "B2", etc.
 */
export function createSimpleContext(data: Record<string, FormulaValue>): EvalContext {
  return {
    getCellValue: (ref: CellReference) => {
      const colLetter = colToLetter(ref.col)
      const key = `${colLetter}${ref.row + 1}`
      return data[key] ?? null
    },
    getRangeValues: (start: CellReference, end: CellReference) => {
      const result: FormulaValue[][] = []
      for (let row = start.row; row <= end.row; row++) {
        const rowData: FormulaValue[] = []
        for (let col = start.col; col <= end.col; col++) {
          const colLetter = colToLetter(col)
          const key = `${colLetter}${row + 1}`
          rowData.push(data[key] ?? null)
        }
        result.push(rowData)
      }
      return result
    },
    sheetId: 'Sheet1'
  }
}

// Helper function to convert column number to letter
function colToLetter(col: number): string {
  let result = ''
  let n = col
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result
    n = Math.floor(n / 26) - 1
  }
  return result
}
