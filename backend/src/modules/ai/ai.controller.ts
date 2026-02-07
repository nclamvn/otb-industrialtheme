import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { BudgetAlertsService } from './budget-alerts.service';
import { OtbAllocationService } from './otb-allocation.service';
import { RiskScoringService } from './risk-scoring.service';
import { SkuRecommenderService } from './sku-recommender.service';
import {
  CalculateSizeCurveDto,
  CompareSizeCurveDto,
  GetAlertsQueryDto,
} from './dto/ai.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly budgetAlertsService: BudgetAlertsService,
    private readonly otbAllocationService: OtbAllocationService,
    private readonly riskScoringService: RiskScoringService,
    private readonly skuRecommenderService: SkuRecommenderService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // SIZE CURVE OPTIMIZER
  // ═══════════════════════════════════════════════════════════════════════

  @Get('size-curve/:category/:storeId')
  @ApiOperation({ summary: 'Get AI-recommended size curve for a category at a store' })
  async getSizeCurve(
    @Param('category') category: string,
    @Param('storeId') storeId: string,
    @Query('totalOrderQty') totalOrderQty: string,
  ) {
    const qty = parseInt(totalOrderQty, 10) || 100;
    const data = await this.aiService.calculateSizeCurve(category, storeId, qty);
    return { data };
  }

  @Post('size-curve/calculate')
  @ApiOperation({ summary: 'Calculate size curve for specific parameters' })
  async calculateSizeCurve(@Body() dto: CalculateSizeCurveDto) {
    const data = await this.aiService.calculateSizeCurve(
      dto.category,
      dto.storeId,
      dto.totalOrderQty,
    );
    return { data };
  }

  @Post('size-curve/compare')
  @ApiOperation({ summary: 'Compare user sizing vs AI recommendation' })
  async compareSizeCurve(@Body() dto: CompareSizeCurveDto) {
    const data = await this.aiService.compareSizeCurve(
      dto.skuId,
      dto.storeId,
      dto.userSizing,
    );
    return { data };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUDGET VARIANCE ALERTS
  // ═══════════════════════════════════════════════════════════════════════

  @Get('alerts')
  @ApiOperation({ summary: 'Get budget alerts (unread / by budget)' })
  async getAlerts(@Query() query: GetAlertsQueryDto) {
    const data = await this.budgetAlertsService.getAlerts({
      budgetId: query.budgetId,
      unreadOnly: query.unreadOnly === 'true',
    });
    return { data };
  }

  @Patch('alerts/:id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  async markAlertRead(@Param('id') id: string) {
    const data = await this.budgetAlertsService.markAsRead(id);
    return { data };
  }

  @Patch('alerts/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  async dismissAlert(@Param('id') id: string) {
    const data = await this.budgetAlertsService.dismissAlert(id);
    return { data };
  }

  @Post('alerts/check')
  @ApiOperation({ summary: 'Manually trigger budget alert check (admin)' })
  async triggerAlertCheck() {
    await this.budgetAlertsService.checkAllBudgets();
    return { message: 'Budget alert check completed' };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // OTB AUTO-ALLOCATION
  // ═══════════════════════════════════════════════════════════════════════

  @Post('allocation/generate')
  @ApiOperation({ summary: 'Generate OTB allocation recommendations' })
  async generateAllocation(
    @Body()
    input: {
      budgetDetailId: string;
      budgetAmount: number;
      seasonGroup: string;
      seasonType: string;
      storeId: string;
      brandId?: string;
    },
  ) {
    const data = await this.otbAllocationService.generateAllocation(input);
    return { data };
  }

  @Get('allocation/:budgetDetailId')
  @ApiOperation({ summary: 'Get existing allocation recommendations' })
  async getRecommendations(
    @Param('budgetDetailId') budgetDetailId: string,
  ) {
    const data = await this.otbAllocationService.getRecommendations(budgetDetailId);
    return { data };
  }

  @Post('allocation/:budgetDetailId/apply')
  @ApiOperation({ summary: 'Apply AI recommendations to planning' })
  async applyRecommendations(
    @Param('budgetDetailId') budgetDetailId: string,
    @Query('dimensionType') dimensionType?: string,
  ) {
    const data = await this.otbAllocationService.applyRecommendations(
      budgetDetailId,
      dimensionType,
    );
    return { data, message: 'Recommendations applied successfully' };
  }

  @Post('allocation/compare')
  @ApiOperation({ summary: 'Compare user allocation vs AI recommendation' })
  async compareAllocation(
    @Body()
    input: {
      budgetDetailId: string;
      userAllocation: Array<{
        dimensionType: string;
        dimensionValue: string;
        pct: number;
      }>;
    },
  ) {
    const data = await this.otbAllocationService.compareAllocation(
      input.budgetDetailId,
      input.userAllocation,
    );
    return { data };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RISK SCORING
  // ═══════════════════════════════════════════════════════════════════════

  @Post('risk/assess/:entityType/:entityId')
  @ApiOperation({ summary: 'Calculate risk score for proposal/ticket' })
  async assessRisk(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    if (entityType !== 'proposal') {
      throw new BadRequestException('Only proposal assessment is currently supported');
    }
    const data = await this.riskScoringService.assessProposal(entityId);
    return { success: true, data };
  }

  @Get('risk/:entityType/:entityId')
  @ApiOperation({ summary: 'Get existing risk assessment' })
  async getRiskAssessment(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const assessment = await this.riskScoringService.getAssessment(entityType, entityId);
    if (!assessment) {
      return { success: false, message: 'No assessment found. Trigger calculation first.' };
    }
    return { success: true, data: assessment };
  }

  @Post('risk/:entityType/:entityId/refresh')
  @ApiOperation({ summary: 'Recalculate risk score' })
  async refreshRiskAssessment(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    await this.riskScoringService.markStale(entityType, entityId);
    if (entityType !== 'proposal') {
      throw new BadRequestException('Only proposal assessment is currently supported');
    }
    const data = await this.riskScoringService.assessProposal(entityId);
    return { success: true, data, message: 'Risk assessment refreshed' };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SKU RECOMMENDER
  // ═══════════════════════════════════════════════════════════════════════

  @Post('sku-recommend/generate')
  @ApiOperation({ summary: 'Generate SKU recommendations for a category' })
  async generateSkuRecommendations(@Body() input: any) {
    const data = await this.skuRecommenderService.generateRecommendations(input);
    return { success: true, data };
  }

  @Get('sku-recommend/:budgetDetailId')
  @ApiOperation({ summary: 'Get existing SKU recommendations' })
  async getSkuRecommendations(
    @Param('budgetDetailId') budgetDetailId: string,
    @Query('category') category?: string,
  ) {
    const data = await this.skuRecommenderService.getRecommendations(budgetDetailId, category);
    return { success: true, data };
  }

  @Patch('sku-recommend/:recommendationId/status')
  @ApiOperation({ summary: 'Mark recommendation as selected/rejected' })
  async updateRecommendationStatus(
    @Param('recommendationId') recommendationId: string,
    @Body('status') status: 'selected' | 'rejected',
  ) {
    const data = await this.skuRecommenderService.updateRecommendationStatus(recommendationId, status);
    return { success: true, data };
  }

  @Post('sku-recommend/:budgetDetailId/add-to-proposal/:proposalId')
  @ApiOperation({ summary: 'Add selected recommendations to proposal' })
  async addSelectedToProposal(
    @Param('budgetDetailId') budgetDetailId: string,
    @Param('proposalId') proposalId: string,
  ) {
    const count = await this.skuRecommenderService.addSelectedToProposal(budgetDetailId, proposalId);
    return { success: true, data: { addedCount: count }, message: `${count} SKUs added to proposal` };
  }
}
