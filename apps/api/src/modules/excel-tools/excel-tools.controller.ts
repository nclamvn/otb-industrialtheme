/**
 * Excel Tools Controller
 * API endpoints for NL Formula and Data Cleaner
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { ExcelToolsService } from './excel-tools.service';
import {
  NLFormulaRequestDto,
  NLFormulaResponseDto,
  FormulaSuggestionsResponseDto,
  DataQualityAnalyzeRequestDto,
  DataQualityAnalyzeResponseDto,
  DataQualityFixRequestDto,
  DataQualityFixResponseDto,
} from './dto/excel-tools.dto';

@ApiTags('Excel Tools')
@Controller('excel-tools')
export class ExcelToolsController {
  constructor(private readonly excelToolsService: ExcelToolsService) {}

  // ============================================================
  // NL Formula Endpoints
  // ============================================================

  @Post('nl-formula')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert Vietnamese to Excel Formula',
    description: 'Converts Vietnamese natural language input to an Excel formula',
  })
  @ApiResponse({
    status: 200,
    description: 'Formula generated successfully',
    type: NLFormulaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  convertNLToFormula(@Body() dto: NLFormulaRequestDto): NLFormulaResponseDto {
    return this.excelToolsService.convertNLToFormula(dto);
  }

  @Get('nl-formula/suggestions')
  @ApiOperation({
    summary: 'Get Formula Suggestions',
    description: 'Returns formula suggestions based on partial Vietnamese input',
  })
  @ApiQuery({
    name: 'query',
    description: 'Partial Vietnamese input',
    example: 'tính margin',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of suggestions',
    required: false,
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions retrieved successfully',
    type: FormulaSuggestionsResponseDto,
  })
  getFormulaSuggestions(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ): FormulaSuggestionsResponseDto {
    return this.excelToolsService.getFormulaSuggestions(query, limit || 5);
  }

  @Get('nl-formula/templates')
  @ApiOperation({
    summary: 'Get Formula Templates',
    description: 'Returns all available formula templates',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  getFormulaTemplates() {
    return this.excelToolsService.getFormulaTemplates();
  }

  // ============================================================
  // Data Quality Endpoints
  // ============================================================

  @Post('data-quality/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze Data Quality',
    description: 'Analyzes data quality and returns issues and quality score',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis completed successfully',
    type: DataQualityAnalyzeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data format',
  })
  analyzeDataQuality(
    @Body() dto: DataQualityAnalyzeRequestDto,
  ): DataQualityAnalyzeResponseDto {
    return this.excelToolsService.analyzeDataQuality(dto);
  }

  @Post('data-quality/fix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fix Data Quality Issues',
    description: 'Fixes auto-fixable data quality issues and returns cleaned data',
  })
  @ApiResponse({
    status: 200,
    description: 'Data cleaned successfully',
    type: DataQualityFixResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data format',
  })
  fixDataQuality(
    @Body() dto: DataQualityFixRequestDto,
  ): DataQualityFixResponseDto {
    return this.excelToolsService.fixDataQuality(dto);
  }
}
