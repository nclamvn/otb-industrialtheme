import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { BudgetTreeService } from './services/budget-tree.service';
import { GapAnalysisService } from './services/gap-analysis.service';
import { BudgetSuggestionsService } from './services/budget-suggestions.service';
import { BudgetVersionsService } from './services/budget-versions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

// DTOs
import {
  CreateBudgetTreeNodeDto,
  UpdateBudgetTreeNodeDto,
  InitializeTreeDto,
  BatchUpdateNodesDto,
} from './dto/budget-tree.dto';
import {
  AnalyzeGapsDto,
  GenerateSuggestionsDto,
  ApplySuggestionDto,
  DismissSuggestionDto,
} from './dto/gap-analysis.dto';
import {
  CreateBudgetVersionDto,
  SubmitBudgetVersionDto,
  ApproveBudgetVersionDto,
  RejectBudgetVersionDto,
  CompareVersionsDto,
  RollbackVersionDto,
  ListVersionsQueryDto,
} from './dto/budget-version.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly budgetTreeService: BudgetTreeService,
    private readonly gapAnalysisService: GapAnalysisService,
    private readonly suggestionsService: BudgetSuggestionsService,
    private readonly versionsService: BudgetVersionsService,
  ) {}

  // ========================================
  // EXISTING BUDGET ENDPOINTS
  // ========================================

  @Get()
  @ApiOperation({ summary: 'List all budgets' })
  findAll(@Query() query: any) {
    return this.budgetsService.findAll(query);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get budget summary statistics' })
  getSummaryStats(@Query() query: { seasonId?: string; brandId?: string }) {
    return this.budgetsService.getSummaryStats(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  findOne(@Param('id') id: string) {
    return this.budgetsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Create new budget' })
  create(@Body() data: any, @CurrentUser() user: CurrentUserPayload) {
    return this.budgetsService.create(data, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Update budget' })
  update(
    @Param('id') id: string,
    @Body() data: { changeReason?: string; [key: string]: any },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const { changeReason, ...updateData } = data;
    return this.budgetsService.update(id, updateData, user.id, changeReason);
  }

  @Delete(':id')
  @Roles('ADMIN', 'FINANCE_HEAD')
  @ApiOperation({ summary: 'Delete budget' })
  remove(@Param('id') id: string) {
    return this.budgetsService.remove(id);
  }

  @Post(':id/submit')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Submit budget for approval' })
  submit(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.budgetsService.submit(id, user.id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Approve budget' })
  approve(
    @Param('id') id: string,
    @Body() data: { comments?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.approve(id, user.id, data.comments);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Reject budget' })
  reject(
    @Param('id') id: string,
    @Body() data: { reason: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetsService.reject(id, user.id, data.reason);
  }

  @Get(':id/change-logs')
  @ApiOperation({ summary: 'Get budget change history' })
  getChangeLogs(@Param('id') id: string, @Query() query: any) {
    return this.budgetsService.getChangeLogs(id, query);
  }

  @Get(':id/version-history')
  @ApiOperation({ summary: 'Get budget version history with OTB plans' })
  getVersionHistory(@Param('id') id: string) {
    return this.budgetsService.getVersionHistory(id);
  }

  // ========================================
  // BUDGET TREE ENDPOINTS (Task #1)
  // ========================================

  @Get(':id/tree')
  @ApiOperation({ summary: 'Get hierarchical budget tree' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  getTree(@Param('id') id: string) {
    return this.budgetTreeService.getTree(id);
  }

  @Get(':id/tree/nodes/:nodeId')
  @ApiOperation({ summary: 'Get a specific tree node' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'nodeId', description: 'Node ID' })
  getNode(@Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.budgetTreeService.getNode(id, nodeId);
  }

  @Post(':id/tree/initialize')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Initialize tree from master data' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  initializeTree(
    @Param('id') id: string,
    @Body() data: InitializeTreeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetTreeService.initializeTree(id, data, user.id);
  }

  @Post(':id/tree/nodes')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Create a new tree node' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  createNode(
    @Param('id') id: string,
    @Body() data: CreateBudgetTreeNodeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetTreeService.createNode(id, data, user.id);
  }

  @Patch(':id/nodes/:nodeId')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Update a tree node budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'nodeId', description: 'Node ID' })
  updateNode(
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
    @Body() data: UpdateBudgetTreeNodeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetTreeService.updateNode(id, nodeId, data, user.id);
  }

  @Delete(':id/nodes/:nodeId')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Delete a tree node' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'nodeId', description: 'Node ID' })
  deleteNode(@Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.budgetTreeService.deleteNode(id, nodeId);
  }

  @Post(':id/tree/batch-update')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Batch update multiple nodes' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  batchUpdateNodes(
    @Param('id') id: string,
    @Body() data: BatchUpdateNodesDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.budgetTreeService.batchUpdateNodes(id, data, user.id);
  }

  // ========================================
  // GAP ANALYSIS ENDPOINTS (Task #3)
  // ========================================

  @Post(':id/analyze-gaps')
  @ApiOperation({ summary: 'Run gap analysis on budget tree' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  analyzeGaps(@Param('id') id: string, @Body() data: AnalyzeGapsDto) {
    return this.gapAnalysisService.analyzeGaps(id, data);
  }

  @Get(':id/gaps')
  @ApiOperation({ summary: 'Get latest gap analysis results' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  getGapAnalysis(@Param('id') id: string) {
    return this.gapAnalysisService.getLatestAnalysis(id);
  }

  @Get(':id/gaps/significant')
  @ApiOperation({ summary: 'Get nodes with significant gaps' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiQuery({ name: 'minGapPercent', required: false, description: 'Minimum gap percentage' })
  getSignificantGaps(
    @Param('id') id: string,
    @Query('minGapPercent') minGapPercent?: string,
  ) {
    const minPercent = minGapPercent ? parseFloat(minGapPercent) : 10;
    return this.gapAnalysisService.getNodesWithSignificantGaps(id, minPercent);
  }

  // ========================================
  // AI SUGGESTIONS ENDPOINTS (Task #3)
  // ========================================

  @Post(':id/ai-suggestions')
  @ApiOperation({ summary: 'Generate AI-powered budget suggestions' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  generateSuggestions(
    @Param('id') id: string,
    @Body() data: GenerateSuggestionsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suggestionsService.generateSuggestions(id, data, user.id);
  }

  @Get(':id/suggestions')
  @ApiOperation({ summary: 'Get pending suggestions for budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  getPendingSuggestions(@Param('id') id: string) {
    return this.suggestionsService.getPendingSuggestions(id);
  }

  @Get(':id/suggestions/:sid')
  @ApiOperation({ summary: 'Get a specific suggestion' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'sid', description: 'Suggestion ID' })
  getSuggestion(@Param('id') id: string, @Param('sid') sid: string) {
    return this.suggestionsService.getSuggestion(id, sid);
  }

  @Post(':id/suggestions/:sid/apply')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Apply a suggestion' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'sid', description: 'Suggestion ID' })
  applySuggestion(
    @Param('id') id: string,
    @Param('sid') sid: string,
    @Body() data: ApplySuggestionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suggestionsService.applySuggestion(id, sid, data, user.id);
  }

  @Post(':id/suggestions/:sid/dismiss')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Dismiss a suggestion' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'sid', description: 'Suggestion ID' })
  dismissSuggestion(
    @Param('id') id: string,
    @Param('sid') sid: string,
    @Body() data: DismissSuggestionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suggestionsService.dismissSuggestion(id, sid, data, user.id);
  }

  // ========================================
  // VERSION HISTORY ENDPOINTS (Task #4)
  // ========================================

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions for a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  listVersions(@Param('id') id: string, @Query() query: ListVersionsQueryDto) {
    return this.versionsService.listVersions(id, query);
  }

  @Post(':id/versions')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER')
  @ApiOperation({ summary: 'Create a new version (snapshot)' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  createVersion(
    @Param('id') id: string,
    @Body() data: CreateBudgetVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.createVersion(id, data, user.id);
  }

  @Get(':id/versions/current')
  @ApiOperation({ summary: 'Get current (active) version' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  getCurrentVersion(@Param('id') id: string) {
    return this.versionsService.getCurrentVersion(id);
  }

  @Get(':id/versions/:vid')
  @ApiOperation({ summary: 'Get a specific version' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'vid', description: 'Version ID' })
  getVersion(@Param('id') id: string, @Param('vid') vid: string) {
    return this.versionsService.getVersion(id, vid);
  }

  @Post(':id/versions/:vid/submit')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Submit a version for approval' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'vid', description: 'Version ID' })
  submitVersion(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() data: SubmitBudgetVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.submitVersion(id, vid, data, user.id);
  }

  @Post(':id/versions/:vid/approve')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Approve a version' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'vid', description: 'Version ID' })
  approveVersion(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() data: ApproveBudgetVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.approveVersion(id, vid, data, user.id);
  }

  @Post(':id/versions/:vid/reject')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Reject a version' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'vid', description: 'Version ID' })
  rejectVersion(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() data: RejectBudgetVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.rejectVersion(id, vid, data, user.id);
  }

  @Post(':id/versions/compare')
  @ApiOperation({ summary: 'Compare two versions' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  compareVersions(@Param('id') id: string, @Body() data: CompareVersionsDto) {
    return this.versionsService.compareVersions(id, data);
  }

  @Post(':id/rollback/:vid')
  @Roles('ADMIN', 'FINANCE_HEAD')
  @ApiOperation({ summary: 'Rollback to a specific version' })
  @ApiParam({ name: 'id', description: 'Budget ID' })
  @ApiParam({ name: 'vid', description: 'Version ID to rollback to' })
  rollback(
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() data: RollbackVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.rollback(id, vid, data, user.id);
  }
}
