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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reports' })
  findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: any) {
    return this.reportsService.findAll(user.id, query);
  }

  @Get('budget-summary')
  @ApiOperation({ summary: 'Get budget summary report' })
  getBudgetSummary(@Query() query: any) {
    return this.reportsService.getBudgetSummary(query);
  }

  @Get('otb-analysis')
  @ApiOperation({ summary: 'Get OTB analysis report' })
  getOtbAnalysis(@Query() query: any) {
    return this.reportsService.getOtbAnalysis(query);
  }

  @Get('sku-performance')
  @ApiOperation({ summary: 'Get SKU performance report' })
  getSkuPerformance(@Query() query: any) {
    return this.reportsService.getSkuPerformance(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new report' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() data: any) {
    return this.reportsService.create(user.id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.reportsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute report and generate output' })
  execute(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() params: any,
  ) {
    return this.reportsService.execute(id, user.id, params);
  }
}
