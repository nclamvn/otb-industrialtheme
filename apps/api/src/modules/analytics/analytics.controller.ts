import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // KPI Endpoints
  @Get('kpi')
  @ApiOperation({ summary: 'Get KPI dashboard' })
  getKPIDashboard(@Query() query: { seasonId?: string; brandId?: string }) {
    return this.analyticsService.getKPIDashboard(query);
  }

  @Get('kpi/alerts')
  @ApiOperation({ summary: 'Get KPI alerts' })
  getKPIAlerts(@Query() query: { isAcknowledged?: boolean; severity?: string; limit?: number }) {
    return this.analyticsService.getKPIAlerts(query);
  }

  @Post('kpi/alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge KPI alert' })
  acknowledgeKPIAlert(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.acknowledgeKPIAlert(id, user.id);
  }

  // Forecast Endpoints
  @Get('forecast')
  @ApiOperation({ summary: 'Get forecasts' })
  getForecasts(@Query() query: { seasonId?: string; brandId?: string; forecastType?: string }) {
    return this.analyticsService.getForecasts(query);
  }

  @Post('forecast/analyze')
  @ApiOperation({ summary: 'Generate new forecast' })
  generateForecast(
    @Body() data: { forecastType: string; seasonId: string; brandId?: string; categoryId?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.analyticsService.generateForecast(data, user.id);
  }

  // Scenario Endpoints
  @Get('simulator')
  @ApiOperation({ summary: 'Get scenarios' })
  getScenarios(@Query() query: { seasonId?: string; status?: string }) {
    return this.analyticsService.getScenarios(query);
  }

  @Post('simulator')
  @ApiOperation({ summary: 'Create new scenario' })
  createScenario(
    @Body() data: { name: string; description?: string; baseSeasonId: string; parameters: any },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.analyticsService.createScenario(data, user.id);
  }

  // Insights Endpoints
  @Get('insights')
  @ApiOperation({ summary: 'Get AI insights' })
  getAIInsights(@Query() query: { type?: string; status?: string; limit?: number }) {
    return this.analyticsService.getAIInsights(query);
  }

  // Executive Summary
  @Get('analytics/executive-summary')
  @ApiOperation({ summary: 'Get executive summary' })
  getExecutiveSummary(@Query() query: { seasonId?: string }) {
    return this.analyticsService.getExecutiveSummary(query);
  }

  // Stock Optimization
  @Get('analytics/stock-optimization')
  @ApiOperation({ summary: 'Get stock optimization recommendations' })
  getStockOptimization(@Query() query: { seasonId?: string; brandId?: string }) {
    return this.analyticsService.getStockOptimization(query);
  }

  // Risk Assessment
  @Get('analytics/risk-assessment')
  @ApiOperation({ summary: 'Get risk assessment' })
  getRiskAssessment(@Query() query: { seasonId?: string }) {
    return this.analyticsService.getRiskAssessment(query);
  }
}
