import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KpiService, KPI_BENCHMARKS, FashionKPIs } from './kpi.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('kpi')
@ApiBearerAuth()
@Controller('kpi')
@UseGuards(JwtAuthGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get KPI benchmarks' })
  getBenchmarks() {
    return KPI_BENCHMARKS;
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard KPIs' })
  getDashboard(
    @Query('divisionId') divisionId?: string,
    @Query('seasonId') seasonId?: string,
    @Query('year') year?: string,
  ) {
    return this.kpiService.getDashboardKPIs({
      divisionId,
      seasonId,
      year: year ? parseInt(year) : undefined,
    });
  }

  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get KPIs for a specific brand' })
  getBrandKPIs(
    @Param('brandId') brandId: string,
    @Query('seasonId') seasonId?: string,
  ): Promise<FashionKPIs> {
    return this.kpiService.getBrandKPIs(brandId, { seasonId });
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get KPIs for a specific category' })
  getCategoryKPIs(
    @Param('categoryId') categoryId: string,
    @Query('brandId') brandId?: string,
    @Query('seasonId') seasonId?: string,
  ): Promise<FashionKPIs> {
    return this.kpiService.getCategoryKPIs(categoryId, { brandId, seasonId });
  }

  @Get('trend/:brandId/:kpiName')
  @ApiOperation({ summary: 'Get KPI trend over time' })
  getKPITrend(
    @Param('brandId') brandId: string,
    @Param('kpiName') kpiName: keyof FashionKPIs,
    @Query('weeks') weeks?: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.kpiService.getKPITrend(brandId, kpiName, {
      weeks: weeks ? parseInt(weeks) : undefined,
      seasonId,
    });
  }

  @Get('calculate/gmroi')
  @ApiOperation({ summary: 'Calculate GMROI' })
  calculateGMROI(
    @Query('grossMargin') grossMargin: string,
    @Query('averageInventoryCost') averageInventoryCost: string,
  ) {
    return this.kpiService.calculateGMROI(
      parseFloat(grossMargin),
      parseFloat(averageInventoryCost),
    );
  }

  @Get('calculate/sell-through')
  @ApiOperation({ summary: 'Calculate Sell-Through Rate' })
  calculateSellThrough(
    @Query('unitsSold') unitsSold: string,
    @Query('unitsAvailable') unitsAvailable: string,
  ) {
    return this.kpiService.calculateSellThrough(
      parseInt(unitsSold),
      parseInt(unitsAvailable),
    );
  }

  @Get('calculate/woc')
  @ApiOperation({ summary: 'Calculate Weeks of Cover' })
  calculateWeeksOfCover(
    @Query('currentStock') currentStock: string,
    @Query('avgWeeklySales') avgWeeklySales: string,
  ) {
    return this.kpiService.calculateWeeksOfCover(
      parseFloat(currentStock),
      parseFloat(avgWeeklySales),
    );
  }

  @Get('calculate/gross-margin')
  @ApiOperation({ summary: 'Calculate Gross Margin %' })
  calculateGrossMargin(
    @Query('revenue') revenue: string,
    @Query('cogs') cogs: string,
  ) {
    return this.kpiService.calculateGrossMargin(
      parseFloat(revenue),
      parseFloat(cogs),
    );
  }

  @Get('calculate/plan-accuracy')
  @ApiOperation({ summary: 'Calculate Plan Accuracy' })
  calculatePlanAccuracy(
    @Query('actual') actual: string,
    @Query('plan') plan: string,
  ) {
    return this.kpiService.calculatePlanAccuracy(
      parseFloat(actual),
      parseFloat(plan),
    );
  }
}
