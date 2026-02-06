import { describe, it, expect } from 'vitest'
import { Parser as FormulaParser } from '../FormulaParser'
import { FormulaEvaluator } from '../FormulaEvaluator'
import { createSimpleContext } from '../context'
import type { EvalContext } from '../types'

describe('Formula Engine', () => {
  const parser = new FormulaParser()
  const evaluator = new FormulaEvaluator()

  // Create a basic context adapter
  const createEvalContext = (data: Record<string, any>): EvalContext => {
    const simpleCtx = createSimpleContext(data)
    return {
      getCellValue: simpleCtx.getCellValue,
      getRangeValues: simpleCtx.getRangeValues,
      sheetId: 'Sheet1',
    }
  }

  describe('Math Functions', () => {
    it('should evaluate SUM with numbers', () => {
      const ast = parser.parse('=SUM(1, 2, 3)')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe(6)
    })

    it('should evaluate AVERAGE', () => {
      const ast = parser.parse('=AVERAGE(10, 20, 30)')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe(20)
    })

    it('should evaluate basic arithmetic', () => {
      const ast = parser.parse('=1 + 2 * 3')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe(7)
    })

    it('should evaluate MIN and MAX', () => {
      const minAst = parser.parse('=MIN(5, 3, 8, 1)')
      const maxAst = parser.parse('=MAX(5, 3, 8, 1)')
      const context = createEvalContext({})

      expect(evaluator.evaluate(minAst, context)).toBe(1)
      expect(evaluator.evaluate(maxAst, context)).toBe(8)
    })
  })

  describe('Logical Functions', () => {
    it('should evaluate IF true condition', () => {
      const ast = parser.parse('=IF(5 > 3, "Yes", "No")')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe('Yes')
    })

    it('should evaluate IF false condition', () => {
      const ast = parser.parse('=IF(1 > 10, "Yes", "No")')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe('No')
    })

    it('should evaluate AND', () => {
      const trueAst = parser.parse('=AND(TRUE, TRUE)')
      const falseAst = parser.parse('=AND(TRUE, FALSE)')
      const context = createEvalContext({})

      expect(evaluator.evaluate(trueAst, context)).toBe(true)
      expect(evaluator.evaluate(falseAst, context)).toBe(false)
    })

    it('should evaluate OR', () => {
      const trueAst = parser.parse('=OR(FALSE, TRUE)')
      const falseAst = parser.parse('=OR(FALSE, FALSE)')
      const context = createEvalContext({})

      expect(evaluator.evaluate(trueAst, context)).toBe(true)
      expect(evaluator.evaluate(falseAst, context)).toBe(false)
    })
  })

  describe('Text Functions', () => {
    it('should evaluate CONCATENATE', () => {
      const ast = parser.parse('=CONCATENATE("Hello", " ", "World")')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe('Hello World')
    })

    it('should evaluate LEN', () => {
      const ast = parser.parse('=LEN("Hello")')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe(5)
    })

    it('should evaluate UPPER and LOWER', () => {
      const upperAst = parser.parse('=UPPER("hello")')
      const lowerAst = parser.parse('=LOWER("HELLO")')
      const context = createEvalContext({})

      expect(evaluator.evaluate(upperAst, context)).toBe('HELLO')
      expect(evaluator.evaluate(lowerAst, context)).toBe('hello')
    })
  })

  describe('Cell References', () => {
    it('should evaluate cell reference', () => {
      const ast = parser.parse('=A1')
      const context = createEvalContext({ 'A1': 100 })
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe(100)
    })

    it('should evaluate cell addition', () => {
      const ast = parser.parse('=A1 + B1')
      const context = createEvalContext({ 'A1': 10, 'B1': 20 })
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe(30)
    })

    it('should evaluate SUM with cell range', () => {
      const ast = parser.parse('=SUM(A1:A3)')
      const context = createEvalContext({ 'A1': 10, 'A2': 20, 'A3': 30 })
      const result = evaluator.evaluate(ast, context)
      expect(result).toBe(60)
    })
  })

  describe('Error Handling', () => {
    it('should return error for division by zero', () => {
      const ast = parser.parse('=1/0')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toHaveProperty('type', '#DIV/0!')
    })

    it('should handle unknown functions', () => {
      const ast = parser.parse('=UNKNOWNFUNC(1)')
      const context = createEvalContext({})
      const result = evaluator.evaluate(ast, context)
      expect(result).toHaveProperty('type', '#NAME?')
    })
  })
})
