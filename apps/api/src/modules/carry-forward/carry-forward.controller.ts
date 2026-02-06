import { Controller, Get, Post, Patch, Delete, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CarryForwardService } from './carry-forward.service';
import {
  GetCarryForwardQueryDto,
  CreateCarryForwardDto,
  UpdateCarryForwardDto,
  ApproveCarryForwardDto,
  RejectCarryForwardDto,
  BatchCarryForwardDto,
  AnalyzeCarryForwardDto,
  AllocateCarryForwardDto,
} from './carry-forward.dto';

@ApiTags('Carry Forward')
@Controller('carry-forward')
export class CarryForwardController {
  constructor(private readonly carryForwardService: CarryForwardService) {}

  @Get()
  @ApiOperation({ summary: 'Get all carry forward items' })
  @ApiResponse({ status: 200, description: 'Returns list of carry forward items' })
  async getAll(@Query() query: GetCarryForwardQueryDto) {
    return this.carryForwardService.getAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get carry forward item by ID' })
  @ApiParam({ name: 'id', description: 'Carry forward item ID' })
  @ApiResponse({ status: 200, description: 'Returns the carry forward item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getById(@Param('id') id: string) {
    return this.carryForwardService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a carry forward item' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  async create(@Body() dto: CreateCarryForwardDto) {
    return this.carryForwardService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a carry forward item' })
  @ApiParam({ name: 'id', description: 'Carry forward item ID' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateCarryForwardDto) {
    return this.carryForwardService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a carry forward item' })
  @ApiParam({ name: 'id', description: 'Carry forward item ID' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async delete(@Param('id') id: string) {
    return this.carryForwardService.delete(id);
  }

  @Post('approve')
  @ApiOperation({ summary: 'Approve carry forward items' })
  @ApiResponse({ status: 200, description: 'Items approved successfully' })
  async approve(@Body() dto: ApproveCarryForwardDto) {
    return this.carryForwardService.approve(dto);
  }

  @Post('reject')
  @ApiOperation({ summary: 'Reject carry forward items' })
  @ApiResponse({ status: 200, description: 'Items rejected successfully' })
  async reject(@Body() dto: RejectCarryForwardDto) {
    return this.carryForwardService.reject(dto);
  }

  @Post('batch/:fromSeasonId/:toSeasonId')
  @ApiOperation({ summary: 'Batch create carry forward items' })
  @ApiParam({ name: 'fromSeasonId', description: 'Source season ID' })
  @ApiParam({ name: 'toSeasonId', description: 'Target season ID' })
  @ApiResponse({ status: 201, description: 'Items created successfully' })
  async batchCreate(
    @Param('fromSeasonId') fromSeasonId: string,
    @Param('toSeasonId') toSeasonId: string,
    @Body() dto: BatchCarryForwardDto,
  ) {
    return this.carryForwardService.batchCreate(fromSeasonId, toSeasonId, dto);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze SKUs for carry forward eligibility' })
  @ApiResponse({ status: 200, description: 'Returns analysis results' })
  async analyze(@Body() dto: AnalyzeCarryForwardDto) {
    return this.carryForwardService.analyze(dto);
  }

  @Post('allocate')
  @ApiOperation({ summary: 'Allocate approved carry forward items' })
  @ApiResponse({ status: 200, description: 'Items allocated successfully' })
  async allocate(@Body() dto: AllocateCarryForwardDto) {
    return this.carryForwardService.allocate(dto);
  }

  @Get('summary/:seasonId')
  @ApiOperation({ summary: 'Get carry forward summary for a season' })
  @ApiParam({ name: 'seasonId', description: 'Season ID' })
  @ApiResponse({ status: 200, description: 'Returns summary data' })
  async getSummary(@Param('seasonId') seasonId: string) {
    return this.carryForwardService.getSummary(seasonId);
  }

  @Get('history/:skuItemId')
  @ApiOperation({ summary: 'Get carry forward history for a SKU' })
  @ApiParam({ name: 'skuItemId', description: 'SKU Item ID' })
  @ApiResponse({ status: 200, description: 'Returns history data' })
  async getHistory(@Param('skuItemId') skuItemId: string) {
    return this.carryForwardService.getHistory(skuItemId);
  }
}
