import { describe, it, expect } from 'vitest'
import {
  getCellKey,
  parseCellKey,
  colToLetter,
  letterToCol,
  toCellRef,
  parseCellRef,
  importCSVFromString,
  exportToCSVString,
} from '../index'
import type { Sheet, CellData } from '../types'

describe('Excel I/O Utils', () => {
  describe('Helper Functions', () => {
    it('should create cell key from row and col', () => {
      expect(getCellKey(0, 0)).toBe('0:0')
      expect(getCellKey(5, 10)).toBe('5:10')
    })

    it('should parse cell key to row and col', () => {
      expect(parseCellKey('0:0')).toEqual({ row: 0, col: 0 })
      expect(parseCellKey('5:10')).toEqual({ row: 5, col: 10 })
    })

    it('should convert column number to letter', () => {
      expect(colToLetter(0)).toBe('A')
      expect(colToLetter(25)).toBe('Z')
      expect(colToLetter(26)).toBe('AA')
      expect(colToLetter(51)).toBe('AZ')
      expect(colToLetter(52)).toBe('BA')
    })

    it('should convert letter to column number', () => {
      expect(letterToCol('A')).toBe(0)
      expect(letterToCol('Z')).toBe(25)
      expect(letterToCol('AA')).toBe(26)
      expect(letterToCol('AZ')).toBe(51)
      expect(letterToCol('BA')).toBe(52)
    })

    it('should convert row and col to cell reference', () => {
      expect(toCellRef(0, 0)).toBe('A1')
      expect(toCellRef(4, 2)).toBe('C5')
      expect(toCellRef(0, 26)).toBe('AA1')
    })

    it('should parse cell reference to row and col', () => {
      expect(parseCellRef('A1')).toEqual({ row: 0, col: 0 })
      expect(parseCellRef('C5')).toEqual({ row: 4, col: 2 })
      expect(parseCellRef('AA1')).toEqual({ row: 0, col: 26 })
    })

    it('should return null for invalid cell reference', () => {
      expect(parseCellRef('invalid')).toBeNull()
      expect(parseCellRef('123')).toBeNull()
      expect(parseCellRef('')).toBeNull()
    })
  })

  describe('CSV Import', () => {
    it('should import simple CSV', () => {
      const csv = 'A,B,C\n1,2,3\n4,5,6'
      const result = importCSVFromString(csv, 'Test')

      expect(result.sheets).toHaveLength(1)
      expect(result.sheets[0].name).toBe('Test')
      expect(result.sheets[0].cells['0:0'].value).toBe('A')
      expect(result.sheets[0].cells['1:0'].value).toBe(1)
      expect(result.sheets[0].cells['2:2'].value).toBe(6)
    })

    it('should handle quoted values with commas', () => {
      const csv = '"Hello, World",Test\nValue1,"Value, 2"'
      const result = importCSVFromString(csv)

      expect(result.sheets[0].cells['0:0'].value).toBe('Hello, World')
      expect(result.sheets[0].cells['1:1'].value).toBe('Value, 2')
    })

    it('should parse numbers correctly', () => {
      const csv = '10,20.5,-5\ntext,100,0'
      const result = importCSVFromString(csv)

      expect(result.sheets[0].cells['0:0'].value).toBe(10)
      expect(result.sheets[0].cells['0:1'].value).toBe(20.5)
      expect(result.sheets[0].cells['0:2'].value).toBe(-5)
      expect(result.sheets[0].cells['1:0'].value).toBe('text')
    })
  })

  describe('CSV Export', () => {
    it('should export simple sheet to CSV', () => {
      const sheet: Sheet = {
        id: 'test',
        name: 'Test',
        index: 0,
        cells: {
          '0:0': { value: 'A', formula: null, displayValue: 'A' },
          '0:1': { value: 'B', formula: null, displayValue: 'B' },
          '1:0': { value: 1, formula: null, displayValue: '1' },
          '1:1': { value: 2, formula: null, displayValue: '2' },
        },
      }

      const csv = exportToCSVString(sheet)
      expect(csv).toBe('A,B\n1,2')
    })

    it('should escape special characters', () => {
      const sheet: Sheet = {
        id: 'test',
        name: 'Test',
        index: 0,
        cells: {
          '0:0': { value: 'Hello, World', formula: null, displayValue: 'Hello, World' },
          '0:1': { value: 'Say "Hi"', formula: null, displayValue: 'Say "Hi"' },
        },
      }

      const csv = exportToCSVString(sheet)
      expect(csv).toBe('"Hello, World","Say ""Hi"""')
    })

    it('should handle sparse cells', () => {
      const sheet: Sheet = {
        id: 'test',
        name: 'Test',
        index: 0,
        cells: {
          '0:0': { value: 'A', formula: null, displayValue: 'A' },
          '2:2': { value: 'C', formula: null, displayValue: 'C' },
        },
      }

      const csv = exportToCSVString(sheet)
      expect(csv).toBe('A,,\n,,\n,,C')
    })
  })
})
