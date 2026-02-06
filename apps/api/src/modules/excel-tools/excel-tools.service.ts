/**
 * Excel Tools Service
 * Business logic for NL Formula and Data Cleaner APIs
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  NLFormulaEngine,
  DataCleaner,
  createSKUCleaner,
  CleanerConfig,
  NLFormulaResult,
  CleaningResult,
} from '@dafc/excelai-tools';

import {
  NLFormulaRequestDto,
  NLFormulaResponseDto,
  FormulaSuggestionsResponseDto,
  DataQualityAnalyzeRequestDto,
  DataQualityAnalyzeResponseDto,
  DataQualityFixRequestDto,
  DataQualityFixResponseDto,
} from './dto/excel-tools.dto';

@Injectable()
export class ExcelToolsService {
  private readonly logger = new Logger(ExcelToolsService.name);
  private readonly nlEngine: NLFormulaEngine;

  constructor() {
    this.nlEngine = new NLFormulaEngine();
  }

  /**
   * Convert Vietnamese natural language to Excel formula
   */
  convertNLToFormula(dto: NLFormulaRequestDto): NLFormulaResponseDto {
    this.logger.log(`Converting NL to formula: "${dto.input}"`);

    const result = this.nlEngine.convert(dto.input, {
      context: dto.context,
      returnAlternatives: dto.returnAlternatives,
      maxAlternatives: 3,
    });

    this.logger.log(`Formula generated: ${result.formula} (confidence: ${result.intent.confidence})`);

    return {
      success: result.success,
      formula: result.formula,
      intent: {
        type: result.intent.type,
        confidence: result.intent.confidence,
        fields: result.intent.fields,
        operations: result.intent.operations,
        rawInput: result.intent.rawInput,
        suggestedFormula: result.intent.suggestedFormula,
        description: result.intent.description,
      },
      alternativeIntents: result.alternativeIntents?.map(alt => ({
        type: alt.type,
        confidence: alt.confidence,
        fields: alt.fields,
        operations: alt.operations,
        rawInput: alt.rawInput,
        suggestedFormula: alt.suggestedFormula,
        description: alt.description,
      })),
      executionTime: result.executionTime,
    };
  }

  /**
   * Get formula suggestions based on partial input
   */
  getFormulaSuggestions(query: string, limit: number = 5): FormulaSuggestionsResponseDto {
    this.logger.log(`Getting suggestions for: "${query}"`);

    const suggestions = this.nlEngine.suggest(query, limit);

    return {
      suggestions: suggestions.map(s => ({
        formula: s.formula,
        description: s.description,
        confidence: s.confidence,
      })),
      query,
    };
  }

  /**
   * Get available formula templates
   */
  getFormulaTemplates() {
    return this.nlEngine.getTemplates();
  }

  /**
   * Analyze data quality
   */
  analyzeDataQuality(dto: DataQualityAnalyzeRequestDto): DataQualityAnalyzeResponseDto {
    this.logger.log(`Analyzing data quality for ${dto.data.length} rows`);

    const config: Partial<CleanerConfig> = {
      requiredColumns: dto.requiredColumns || [],
      numericColumns: dto.numericColumns || [],
      categoryColumns: dto.categoryColumns || [],
      outlierThreshold: dto.outlierThreshold || 3,
    };

    // Use SKU cleaner as base if no custom config
    const cleaner = dto.requiredColumns?.length
      ? new DataCleaner(config)
      : createSKUCleaner(config);

    const result = cleaner.analyze(dto.data);

    this.logger.log(`Analysis complete: ${result.issuesFound} issues found, quality score: ${result.qualityScore.overall}`);

    return this.mapToAnalyzeResponse(result);
  }

  /**
   * Fix data quality issues
   */
  fixDataQuality(dto: DataQualityFixRequestDto): DataQualityFixResponseDto {
    this.logger.log(`Fixing data quality for ${dto.data.length} rows`);

    const config: Partial<CleanerConfig> = {
      requiredColumns: dto.requiredColumns || [],
      numericColumns: dto.numericColumns || [],
      categoryColumns: dto.categoryColumns || [],
      outlierThreshold: dto.outlierThreshold || 3,
      autoFix: dto.autoFix !== false,
      removeDuplicates: dto.removeDuplicates !== false,
    };

    // Use SKU cleaner as base if no custom config
    const cleaner = dto.requiredColumns?.length
      ? new DataCleaner(config)
      : createSKUCleaner(config);

    const result = cleaner.clean(dto.data);

    this.logger.log(`Cleaning complete: ${result.issuesFixed} issues fixed, ${result.cleanedRowCount} rows remaining`);

    return this.mapToFixResponse(result);
  }

  /**
   * Map CleaningResult to AnalyzeResponse DTO
   */
  private mapToAnalyzeResponse(result: CleaningResult): DataQualityAnalyzeResponseDto {
    return {
      success: result.success,
      originalRowCount: result.originalRowCount,
      issuesFound: result.issuesFound,
      issues: result.issues.map(issue => ({
        id: issue.id,
        type: issue.type,
        severity: issue.severity,
        row: issue.row,
        column: issue.column,
        value: issue.value,
        message: issue.message,
        suggestion: issue.suggestion,
        autoFixable: issue.autoFixable,
        fixedValue: issue.fixedValue,
      })),
      qualityScore: {
        overall: result.qualityScore.overall,
        completeness: result.qualityScore.completeness,
        accuracy: result.qualityScore.accuracy,
        consistency: result.qualityScore.consistency,
        validity: result.qualityScore.validity,
      },
      summary: {
        duplicatesRemoved: result.summary.duplicatesRemoved,
        missingValuesFilled: result.summary.missingValuesFilled,
        outliersDetected: result.summary.outliersDetected,
        formatErrorsFixed: result.summary.formatErrorsFixed,
        inconsistenciesFixed: result.summary.inconsistenciesFixed,
        executionTimeMs: result.summary.executionTimeMs,
      },
    };
  }

  /**
   * Map CleaningResult to FixResponse DTO
   */
  private mapToFixResponse(result: CleaningResult): DataQualityFixResponseDto {
    return {
      ...this.mapToAnalyzeResponse(result),
      cleanedRowCount: result.cleanedRowCount,
      issuesFixed: result.issuesFixed,
      cleanedData: result.cleanedData || [],
    };
  }
}
