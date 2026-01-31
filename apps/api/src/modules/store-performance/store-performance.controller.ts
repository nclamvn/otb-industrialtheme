import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StorePerformanceService } from './store-performance.service';

@ApiTags('Store Performance')
@Controller('store-performance')
export class StorePerformanceController {
  constructor(private readonly storePerformanceService: StorePerformanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all store performance data' })
  async getAll(
    @Query('seasonId') seasonId?: string,
    @Query('storeGroup') storeGroup?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.storePerformanceService.getAll({ seasonId, storeGroup, periodStart, periodEnd, page, limit });
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get performance data for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  async getByStore(
    @Param('storeId') storeId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.storePerformanceService.getByStore(storeId, { periodStart, periodEnd });
  }

  @Get('group/:storeGroup')
  @ApiOperation({ summary: 'Get performance data for a store group' })
  @ApiParam({ name: 'storeGroup', description: 'Store group (REX, TTP, DAFC)' })
  async getByStoreGroup(
    @Param('storeGroup') storeGroup: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.storePerformanceService.getByStoreGroup(storeGroup, { seasonId });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary by store groups' })
  async getGroupSummary(
    @Query('seasonId') seasonId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.storePerformanceService.getGroupSummary({ seasonId, periodStart, periodEnd });
  }

  @Get('summary/:storeGroup')
  @ApiOperation({ summary: 'Get summary for a specific store group' })
  @ApiParam({ name: 'storeGroup', description: 'Store group' })
  async getSummaryByGroup(
    @Param('storeGroup') storeGroup: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.storePerformanceService.getSummaryByGroup(storeGroup, { seasonId });
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple stores' })
  async compareStores(
    @Body() body: { storeIds: string[]; metrics?: string[]; periodStart?: string; periodEnd?: string },
  ) {
    return this.storePerformanceService.compareStores(body.storeIds, body);
  }

  @Get('compare-groups')
  @ApiOperation({ summary: 'Compare store groups' })
  async compareGroups(
    @Query('seasonId') seasonId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.storePerformanceService.compareGroups({ seasonId, periodStart, periodEnd });
  }

  @Get('trend/:storeId')
  @ApiOperation({ summary: 'Get trend for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  async getTrend(
    @Param('storeId') storeId: string,
    @Query('weeks') weeks?: number,
    @Query('metric') metric?: string,
  ) {
    return this.storePerformanceService.getTrend(storeId, { weeks, metric });
  }

  @Get('trend/group/:storeGroup')
  @ApiOperation({ summary: 'Get trend for a store group' })
  @ApiParam({ name: 'storeGroup', description: 'Store group' })
  async getGroupTrend(
    @Param('storeGroup') storeGroup: string,
    @Query('weeks') weeks?: number,
    @Query('metric') metric?: string,
  ) {
    return this.storePerformanceService.getGroupTrend(storeGroup, { weeks, metric });
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top performing stores' })
  async getTopPerformers(
    @Query('limit') limit?: number,
    @Query('metric') metric?: string,
  ) {
    return this.storePerformanceService.getTopPerformers({ limit, metric });
  }

  @Get('bottom')
  @ApiOperation({ summary: 'Get bottom performing stores' })
  async getBottomPerformers(
    @Query('limit') limit?: number,
    @Query('metric') metric?: string,
  ) {
    return this.storePerformanceService.getBottomPerformers({ limit, metric });
  }

  @Get('store/:storeId/skus')
  @ApiOperation({ summary: 'Get SKU performance for a store' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  async getSKUPerformance(
    @Param('storeId') storeId: string,
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.storePerformanceService.getSKUPerformance(storeId, { brandId, categoryId, limit });
  }
}
