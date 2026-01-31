import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CostingService } from './costing.service';
import {
  CalculateCostingDto,
  CreateCostingDto,
  UpdateCostingDto,
  BatchCostingUpdateDto,
  RecalculateAllDto,
  GetCostingsQueryDto,
  GetCostingSummaryQueryDto,
  CreateCostingConfigDto,
  UpdateCostingConfigDto,
  ExportCostingDto,
} from './costing.dto';

@ApiTags('Costing')
@Controller('costing')
export class CostingController {
  constructor(private readonly costingService: CostingService) {}

  // ==================== Costing CRUD ====================

  @Get()
  @ApiOperation({ summary: 'Get all costings with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of costings' })
  async getAll(@Query() query: GetCostingsQueryDto) {
    return this.costingService.getAll(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get costing summary' })
  @ApiResponse({ status: 200, description: 'Returns costing summary' })
  async getSummary(@Query() query: GetCostingSummaryQueryDto) {
    return this.costingService.getSummary(query);
  }

  @Get('margin-analysis')
  @ApiOperation({ summary: 'Get margin analysis' })
  @ApiResponse({ status: 200, description: 'Returns margin analysis data' })
  async getMarginAnalysis(@Query() query: GetCostingSummaryQueryDto) {
    return this.costingService.getMarginAnalysis(query);
  }

  @Get('sku/:skuId')
  @ApiOperation({ summary: 'Get costing by SKU ID' })
  @ApiParam({ name: 'skuId', description: 'SKU ID' })
  @ApiResponse({ status: 200, description: 'Returns costing for SKU' })
  @ApiResponse({ status: 404, description: 'Costing not found' })
  async getBySku(@Param('skuId') skuId: string) {
    return this.costingService.getBySku(skuId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get costing by ID' })
  @ApiParam({ name: 'id', description: 'Costing ID' })
  @ApiResponse({ status: 200, description: 'Returns costing' })
  @ApiResponse({ status: 404, description: 'Costing not found' })
  async getById(@Param('id') id: string) {
    return this.costingService.getById(id);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate costing breakdown' })
  @ApiResponse({ status: 200, description: 'Returns calculated costing breakdown' })
  async calculate(@Body() data: CalculateCostingDto) {
    return this.costingService.calculate(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new costing record' })
  @ApiResponse({ status: 201, description: 'Costing created successfully' })
  async create(@Body() data: CreateCostingDto) {
    return this.costingService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update costing' })
  @ApiParam({ name: 'id', description: 'Costing ID' })
  @ApiResponse({ status: 200, description: 'Costing updated successfully' })
  @ApiResponse({ status: 404, description: 'Costing not found' })
  async update(@Param('id') id: string, @Body() data: UpdateCostingDto) {
    return this.costingService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete costing' })
  @ApiParam({ name: 'id', description: 'Costing ID' })
  @ApiResponse({ status: 200, description: 'Costing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Costing not found' })
  async delete(@Param('id') id: string) {
    return this.costingService.delete(id);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch update costings' })
  @ApiResponse({ status: 200, description: 'Returns batch operation result' })
  async batchUpdate(@Body() data: BatchCostingUpdateDto) {
    return this.costingService.batchUpdate(data);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate all costings with new exchange rate' })
  @ApiResponse({ status: 200, description: 'Returns recalculation result' })
  async recalculateAll(@Body() data: RecalculateAllDto) {
    return this.costingService.recalculateAll(data);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export costings to Excel' })
  @ApiResponse({ status: 200, description: 'Returns download URL' })
  async exportToExcel(@Body() data: ExportCostingDto) {
    return this.costingService.exportToExcel(data);
  }

  // ==================== Costing Configs ====================

  @Get('configs')
  @ApiOperation({ summary: 'Get all costing configs' })
  @ApiResponse({ status: 200, description: 'Returns list of costing configs' })
  async getConfigs(
    @Query('brandId') brandId?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.costingService.getConfigs({ brandId, category, isActive });
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Get costing config by ID' })
  @ApiParam({ name: 'id', description: 'Config ID' })
  @ApiResponse({ status: 200, description: 'Returns costing config' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  async getConfigById(@Param('id') id: string) {
    return this.costingService.getConfigById(id);
  }

  @Post('configs')
  @ApiOperation({ summary: 'Create a new costing config' })
  @ApiResponse({ status: 201, description: 'Config created successfully' })
  async createConfig(@Body() data: CreateCostingConfigDto) {
    return this.costingService.createConfig(data);
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: 'Update costing config' })
  @ApiParam({ name: 'id', description: 'Config ID' })
  @ApiResponse({ status: 200, description: 'Config updated successfully' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  async updateConfig(@Param('id') id: string, @Body() data: UpdateCostingConfigDto) {
    return this.costingService.updateConfig(id, data);
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: 'Delete costing config' })
  @ApiParam({ name: 'id', description: 'Config ID' })
  @ApiResponse({ status: 200, description: 'Config deleted successfully' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  async deleteConfig(@Param('id') id: string) {
    return this.costingService.deleteConfig(id);
  }
}
