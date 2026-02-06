/**
 * @dafc/excelai-core/engine
 * Formula Engine - Parser, Evaluator, and Functions
 */

export { Parser, Tokenizer, parseCellRef, parseFormula, colLetterToNumber, numberToColLetter } from './FormulaParser'
export { FormulaEvaluator, formulaEvaluator } from './FormulaEvaluator'
export type { FormulaContext } from './context'
export { createEmptyContext, createSimpleContext } from './context'

// Export types
export type {
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
} from './types'

export { FormulaError } from './types'

// Export all functions
export * from './functions'

// Re-export Parser as FormulaParser for convenience
export { Parser as FormulaParser } from './FormulaParser'
