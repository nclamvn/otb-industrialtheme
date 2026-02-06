/**
 * @dafc/excelai-core
 * ExcelAI Core - Formula Engine & Excel I/O Utilities
 */

// ═══════════════════════════════════════════════════════════════════════════
// Formula Engine Exports
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Parser
  Parser,
  FormulaParser,
  Tokenizer,
  parseCellRef as parseFormulaCellRef,
  parseFormula,
  colLetterToNumber,
  numberToColLetter,
  // Evaluator
  FormulaEvaluator,
  formulaEvaluator,
  // Context
  createEmptyContext,
  createSimpleContext,
  // Error
  FormulaError,
} from './engine'

// Engine types
export type {
  FormulaContext,
  ASTNode,
  NumberNode,
  StringNode,
  BooleanNode,
  ErrorNode,
  CellRefNode,
  RangeRefNode,
  FunctionCallNode,
  BinaryOpNode,
  UnaryOpNode,
  ArrayNode,
  CellReference,
  FormulaValue,
  EvalContext,
  CellDependency,
} from './engine'

// All formula functions
export * from './engine/functions'

// ═══════════════════════════════════════════════════════════════════════════
// Excel I/O Utils Exports
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Helpers
  getCellKey,
  parseCellKey,
  colToLetter,
  letterToCol,
  toCellRef,
  parseCellRef,
  // Import
  importExcelFile,
  importExcelFromBuffer,
  importCSVFile,
  importCSVFromString,
  // Export
  exportToExcel,
  exportToExcelBuffer,
  exportToCSV,
  exportToCSVString,
} from './utils'

// Utils types
export type {
  CellValue,
  CellFormat,
  CellData,
  CellPosition,
  CellRange,
  Sheet,
  Workbook,
  ImportResult,
  ExportOptions,
} from './utils'
