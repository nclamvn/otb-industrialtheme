import { Controller, Get, Post, Patch, Delete, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PriceRangeService } from './price-range.service';
import {
  GetPriceRangesQueryDto,
  CreatePriceRangeDto,
  UpdatePriceRangeDto,
  AnalyzePriceRangeDto,
  PriceRangeDistributionDto,
  BatchPriceRangeUpdateDto,
  OptimizePriceRangesDto,
} from './price-range.dto';

@ApiTags('Price Range')
@Controller('price-ranges')
export class PriceRangeController {
  constructor(private readonly priceRangeService: PriceRangeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all price ranges' })
  @ApiResponse({ status: 200, description: 'Returns list of price ranges' })
  async getAll(@Query() query: GetPriceRangesQueryDto) {
    return this.priceRangeService.getAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get price range by ID' })
  @ApiParam({ name: 'id', description: 'Price range ID' })
  @ApiResponse({ status: 200, description: 'Returns the price range' })
  @ApiResponse({ status: 404, description: 'Price range not found' })
  async getById(@Param('id') id: string) {
    return this.priceRangeService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new price range' })
  @ApiResponse({ status: 201, description: 'Price range created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreatePriceRangeDto) {
    return this.priceRangeService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a price range' })
  @ApiParam({ name: 'id', description: 'Price range ID' })
  @ApiResponse({ status: 200, description: 'Price range updated successfully' })
  @ApiResponse({ status: 404, description: 'Price range not found' })
  async update(@Param('id') id: string, @Body() dto: UpdatePriceRangeDto) {
    return this.priceRangeService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price range' })
  @ApiParam({ name: 'id', description: 'Price range ID' })
  @ApiResponse({ status: 200, description: 'Price range deleted successfully' })
  @ApiResponse({ status: 404, description: 'Price range not found' })
  async delete(@Param('id') id: string) {
    return this.priceRangeService.delete(id);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze price range distribution' })
  @ApiResponse({ status: 200, description: 'Returns analysis results' })
  async analyze(@Body() dto: AnalyzePriceRangeDto) {
    return this.priceRangeService.analyze(dto);
  }

  @Post('distribution')
  @ApiOperation({ summary: 'Get SKU distribution by price ranges' })
  @ApiResponse({ status: 200, description: 'Returns distribution data' })
  async getDistribution(@Body() dto: PriceRangeDistributionDto) {
    return this.priceRangeService.getDistribution(dto);
  }

  @Patch('batch')
  @ApiOperation({ summary: 'Batch update price ranges' })
  @ApiResponse({ status: 200, description: 'Returns update results' })
  async batchUpdate(@Body() dto: BatchPriceRangeUpdateDto) {
    return this.priceRangeService.batchUpdate(dto);
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Get optimized price range suggestions' })
  @ApiResponse({ status: 200, description: 'Returns optimization suggestions' })
  async optimize(@Body() dto: OptimizePriceRangesDto) {
    return this.priceRangeService.optimize(dto);
  }

  @Get('history/:seasonId')
  @ApiOperation({ summary: 'Get price range analysis history' })
  @ApiParam({ name: 'seasonId', description: 'Season ID' })
  @ApiResponse({ status: 200, description: 'Returns analysis history' })
  async getHistory(@Param('seasonId') seasonId: string) {
    return this.priceRangeService.getHistory(seasonId);
  }

  @Get('summary/:seasonId')
  @ApiOperation({ summary: 'Get price range summary for a season' })
  @ApiParam({ name: 'seasonId', description: 'Season ID' })
  @ApiResponse({ status: 200, description: 'Returns summary data' })
  async getSummary(@Param('seasonId') seasonId: string) {
    return this.priceRangeService.getSummary(seasonId);
  }
}
