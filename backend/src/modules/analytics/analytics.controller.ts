import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../common/guards/permissions.guard';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // SALES PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('sales/top-skus')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get top performing SKUs by performance score' })
  async getTopSkus(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getTopSkus(query) };
  }

  @Get('sales/bottom-skus')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get bottom performing SKUs by performance score' })
  async getBottomSkus(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getBottomSkus(query) };
  }

  @Get('sales/by-dimension')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get sales breakdown by dimension (collection, gender, category)' })
  async getSalesByDimension(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getSalesByDimension(query) };
  }

  @Get('sales/sell-through-summary')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get sell-through summary grouped by product type' })
  async getSellThroughSummary(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getSellThroughSummary(query) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUDGET ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('budget/utilization-trend')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get budget utilization trend over time' })
  async getUtilizationTrend(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getUtilizationTrend(query) };
  }

  @Get('budget/alerts')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get budget alerts grouped by severity' })
  async getBudgetAlerts(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getBudgetAlerts(query) };
  }

  @Get('budget/allocation-efficiency')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get allocation efficiency with actual vs planned' })
  async getAllocationEfficiency(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getAllocationEfficiency(query) };
  }

  @Get('budget/summary')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get budget analytics summary with KPIs' })
  async getBudgetSummary(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getBudgetSummary(query) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY TRENDS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('trends/attributes')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get attribute trend scores (color, composition, theme, product_type)' })
  async getTrendAttributes(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getTrendAttributes(query) };
  }

  @Get('trends/yoy-comparison')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get year-over-year comparison for attributes' })
  async getYoyComparison(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getYoyComparison(query) };
  }

  @Get('trends/gender-breakdown')
  @RequirePermissions('budget:read')
  @ApiOperation({ summary: 'Get gender breakdown of product type trends' })
  async getGenderBreakdown(@Query() query: AnalyticsQueryDto) {
    return { success: true, data: await this.analyticsService.getGenderBreakdown(query) };
  }
}
