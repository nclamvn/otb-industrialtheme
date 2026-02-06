import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SKUAnalysisService } from './sku-analysis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SKUPerformanceQueryDto, PerformanceMetric } from './dto/sku-analysis.dto';

@ApiTags('sku-analysis')
@ApiBearerAuth()
@Controller('sku-analysis')
@UseGuards(JwtAuthGuard)
export class SKUAnalysisController {
  constructor(private readonly service: SKUAnalysisService) {}

  @Get('best-performers')
  @ApiOperation({ summary: 'Get best performing SKUs' })
  getBestPerformers(@Query() query: SKUPerformanceQueryDto) {
    return this.service.getBestPerformers(query);
  }

  @Get('worst-performers')
  @ApiOperation({ summary: 'Get worst performing SKUs' })
  getWorstPerformers(@Query() query: SKUPerformanceQueryDto) {
    return this.service.getWorstPerformers(query);
  }

  @Get('rising-stars')
  @ApiOperation({ summary: 'Get SKUs with improving performance' })
  getRisingStars(@Query() query: SKUPerformanceQueryDto) {
    return this.service.getRisingStars(query);
  }

  @Get('declining')
  @ApiOperation({ summary: 'Get SKUs with declining performance' })
  getDecliningPerformers(@Query() query: SKUPerformanceQueryDto) {
    return this.service.getDecliningPerformers(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get SKU performance summary' })
  getSummary(@Query() query: SKUPerformanceQueryDto) {
    return this.service.getAnalysisSummary(query);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get SKU action recommendations' })
  getRecommendations(@Query() query: SKUPerformanceQueryDto) {
    return this.service.getRecommendations(query);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get available performance metrics' })
  getMetrics() {
    return {
      metrics: Object.values(PerformanceMetric).map((metric) => ({
        code: metric,
        name: metric.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
        description: this.getMetricDescription(metric),
      })),
    };
  }

  private getMetricDescription(metric: PerformanceMetric): string {
    const descriptions: Record<PerformanceMetric, string> = {
      [PerformanceMetric.REVENUE]: 'Total revenue generated from sales',
      [PerformanceMetric.UNITS_SOLD]: 'Number of units sold in the period',
      [PerformanceMetric.GROSS_MARGIN]: 'Gross margin percentage after COGS',
      [PerformanceMetric.SELL_THROUGH]: 'Percentage of inventory sold vs received',
      [PerformanceMetric.GMROI]: 'Gross Margin Return on Investment',
      [PerformanceMetric.STOCK_TURNOVER]: 'Number of times inventory is sold per year',
    };
    return descriptions[metric];
  }
}
