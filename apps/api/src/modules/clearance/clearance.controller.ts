import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ClearanceService } from './clearance.service';
import { CreateMarkdownPlanDto } from './dto/create-markdown-plan.dto';
import { OptimizePlanDto } from './dto/optimize-plan.dto';
import { SimulateScenarioDto } from './dto/simulate-scenario.dto';

@ApiTags('Clearance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clearance')
export class ClearanceController {
  constructor(private readonly clearanceService: ClearanceService) {}

  // ==================== Markdown Plans ====================

  @Post('plans')
  @ApiOperation({ summary: 'Create a new markdown plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  async createPlan(@Body() dto: CreateMarkdownPlanDto, @Request() req: { user: { id: string } }) {
    return this.clearanceService.createPlan(dto, req.user.id);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all markdown plans' })
  @ApiQuery({ name: 'seasonId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getPlans(
    @Query('seasonId') seasonId?: string,
    @Query('brandId') brandId?: string,
    @Query('status') status?: string,
  ) {
    return this.clearanceService.getPlans({ seasonId, brandId, status });
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get markdown plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(@Param('id') id: string) {
    return this.clearanceService.getPlanById(id);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a markdown plan' })
  @ApiResponse({ status: 200, description: 'Plan deleted' })
  async deletePlan(@Param('id') id: string) {
    return this.clearanceService.deletePlan(id);
  }

  // ==================== Optimization ====================

  @Post('optimize')
  @ApiOperation({ summary: 'Run AI optimization on a markdown plan' })
  @ApiResponse({ status: 200, description: 'Optimization results' })
  async optimizePlan(@Body() dto: OptimizePlanDto) {
    return this.clearanceService.optimizePlan(dto);
  }

  @Get('eligible-skus')
  @ApiOperation({ summary: 'Get SKUs eligible for clearance' })
  @ApiQuery({ name: 'seasonId', required: true })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'minWeeksOnHand', required: false })
  @ApiQuery({ name: 'maxSellThrough', required: false })
  async getEligibleSKUs(
    @Query('seasonId') seasonId: string,
    @Query('brandId') brandId?: string,
    @Query('minWeeksOnHand') minWeeksOnHand?: string,
    @Query('maxSellThrough') maxSellThrough?: string,
  ) {
    return this.clearanceService.getEligibleSKUs({
      seasonId,
      brandId,
      minWeeksOnHand: minWeeksOnHand ? parseInt(minWeeksOnHand) : undefined,
      maxSellThrough: maxSellThrough ? parseInt(maxSellThrough) : undefined,
    });
  }

  // ==================== Simulation ====================

  @Post('simulate')
  @ApiOperation({ summary: 'Simulate a markdown scenario' })
  @ApiResponse({ status: 200, description: 'Simulation results' })
  async simulateScenario(@Body() dto: SimulateScenarioDto) {
    return this.clearanceService.simulateScenario(dto);
  }

  // ==================== Plan Lifecycle ====================

  @Put('plans/:id/approve')
  @ApiOperation({ summary: 'Approve a markdown plan' })
  @ApiResponse({ status: 200, description: 'Plan approved' })
  async approvePlan(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.clearanceService.approvePlan(id, req.user.id);
  }

  @Put('plans/:id/activate')
  @ApiOperation({ summary: 'Activate an approved markdown plan' })
  @ApiResponse({ status: 200, description: 'Plan activated' })
  async activatePlan(@Param('id') id: string) {
    return this.clearanceService.activatePlan(id);
  }

  // ==================== Results ====================

  @Get('plans/:id/results')
  @ApiOperation({ summary: 'Get markdown plan results and performance' })
  @ApiResponse({ status: 200, description: 'Plan results' })
  async getPlanResults(@Param('id') id: string) {
    return this.clearanceService.getPlanResults(id);
  }
}
