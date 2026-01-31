import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import {
  CreateDeliveryWindowDto,
  UpdateDeliveryWindowDto,
  CreateDeliveryAllocationDto,
  UpdateDeliveryAllocationDto,
  BatchDeliveryUpdateDto,
  CopyAllocationsDto,
  AutoDistributeDto,
  GetDeliveryWindowsQueryDto,
  GetDeliveryAllocationsQueryDto,
  GetDeliveryMatrixQueryDto,
  GetDeliverySummaryQueryDto,
} from './delivery.dto';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ==================== Delivery Windows ====================

  @Get('windows')
  @ApiOperation({ summary: 'Get all delivery windows' })
  @ApiResponse({ status: 200, description: 'Returns list of delivery windows' })
  async getWindows(@Query() query: GetDeliveryWindowsQueryDto) {
    return this.deliveryService.getWindows(query);
  }

  @Get('windows/:id')
  @ApiOperation({ summary: 'Get delivery window by ID' })
  @ApiParam({ name: 'id', description: 'Window ID' })
  @ApiResponse({ status: 200, description: 'Returns delivery window' })
  @ApiResponse({ status: 404, description: 'Window not found' })
  async getWindowById(@Param('id') id: string) {
    return this.deliveryService.getWindowById(id);
  }

  @Post('windows')
  @ApiOperation({ summary: 'Create a new delivery window' })
  @ApiResponse({ status: 201, description: 'Window created successfully' })
  async createWindow(@Body() data: CreateDeliveryWindowDto) {
    return this.deliveryService.createWindow(data);
  }

  @Patch('windows/:id')
  @ApiOperation({ summary: 'Update delivery window' })
  @ApiParam({ name: 'id', description: 'Window ID' })
  @ApiResponse({ status: 200, description: 'Window updated successfully' })
  @ApiResponse({ status: 404, description: 'Window not found' })
  async updateWindow(@Param('id') id: string, @Body() data: UpdateDeliveryWindowDto) {
    return this.deliveryService.updateWindow(id, data);
  }

  @Delete('windows/:id')
  @ApiOperation({ summary: 'Delete delivery window' })
  @ApiParam({ name: 'id', description: 'Window ID' })
  @ApiResponse({ status: 200, description: 'Window deleted successfully' })
  @ApiResponse({ status: 404, description: 'Window not found' })
  async deleteWindow(@Param('id') id: string) {
    return this.deliveryService.deleteWindow(id);
  }

  // ==================== Delivery Allocations ====================

  @Get('allocations')
  @ApiOperation({ summary: 'Get all delivery allocations' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of allocations' })
  async getAllocations(@Query() query: GetDeliveryAllocationsQueryDto) {
    return this.deliveryService.getAllocations(query);
  }

  @Get('allocations/:id')
  @ApiOperation({ summary: 'Get delivery allocation by ID' })
  @ApiParam({ name: 'id', description: 'Allocation ID' })
  @ApiResponse({ status: 200, description: 'Returns delivery allocation' })
  @ApiResponse({ status: 404, description: 'Allocation not found' })
  async getAllocationById(@Param('id') id: string) {
    return this.deliveryService.getAllocationById(id);
  }

  @Post('allocations')
  @ApiOperation({ summary: 'Create a new delivery allocation' })
  @ApiResponse({ status: 201, description: 'Allocation created successfully' })
  async createAllocation(@Body() data: CreateDeliveryAllocationDto) {
    return this.deliveryService.createAllocation(data);
  }

  @Patch('allocations/:id')
  @ApiOperation({ summary: 'Update delivery allocation' })
  @ApiParam({ name: 'id', description: 'Allocation ID' })
  @ApiResponse({ status: 200, description: 'Allocation updated successfully' })
  @ApiResponse({ status: 404, description: 'Allocation not found' })
  async updateAllocation(@Param('id') id: string, @Body() data: UpdateDeliveryAllocationDto) {
    return this.deliveryService.updateAllocation(id, data);
  }

  @Delete('allocations/:id')
  @ApiOperation({ summary: 'Delete delivery allocation' })
  @ApiParam({ name: 'id', description: 'Allocation ID' })
  @ApiResponse({ status: 200, description: 'Allocation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Allocation not found' })
  async deleteAllocation(@Param('id') id: string) {
    return this.deliveryService.deleteAllocation(id);
  }

  @Post('allocations/batch')
  @ApiOperation({ summary: 'Batch update delivery allocations' })
  @ApiResponse({ status: 200, description: 'Returns batch operation result' })
  async batchUpdateAllocations(@Body() data: BatchDeliveryUpdateDto) {
    return this.deliveryService.batchUpdateAllocations(data);
  }

  // ==================== Matrix View ====================

  @Get('matrix')
  @ApiOperation({ summary: 'Get delivery matrix view' })
  @ApiResponse({ status: 200, description: 'Returns delivery matrix' })
  async getMatrix(@Query() query: GetDeliveryMatrixQueryDto) {
    return this.deliveryService.getMatrix(query);
  }

  // ==================== Summary ====================

  @Get('summary')
  @ApiOperation({ summary: 'Get delivery summary' })
  @ApiResponse({ status: 200, description: 'Returns delivery summary' })
  async getSummary(@Query() query: GetDeliverySummaryQueryDto) {
    return this.deliveryService.getSummary(query);
  }

  @Get('store-summary')
  @ApiOperation({ summary: 'Get store delivery summary' })
  @ApiResponse({ status: 200, description: 'Returns store-level summary' })
  async getStoreSummary(@Query() query: GetDeliverySummaryQueryDto) {
    return this.deliveryService.getStoreSummary(query);
  }

  // ==================== Copy & Auto-Distribute ====================

  @Post('copy')
  @ApiOperation({ summary: 'Copy allocations from one window to another' })
  @ApiResponse({ status: 200, description: 'Returns copy operation result' })
  async copyAllocations(@Body() data: CopyAllocationsDto) {
    return this.deliveryService.copyAllocations(data);
  }

  @Post('auto-distribute')
  @ApiOperation({ summary: 'Auto-distribute quantity across windows' })
  @ApiResponse({ status: 200, description: 'Returns created allocations' })
  async autoDistribute(@Body() data: AutoDistributeDto) {
    return this.deliveryService.autoDistribute(data);
  }
}
