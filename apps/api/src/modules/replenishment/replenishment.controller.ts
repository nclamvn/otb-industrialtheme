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
import { ReplenishmentService } from './replenishment.service';
import { CreateMOCTargetDto, CreateMOQRuleDto } from './dto/create-moc-target.dto';
import { CreateReplenishmentOrderDto } from './dto/create-replenishment-order.dto';

@ApiTags('Replenishment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('replenishment')
export class ReplenishmentController {
  constructor(private readonly replenishmentService: ReplenishmentService) {}

  // ==================== MOC Targets ====================

  @Post('moc-targets')
  @ApiOperation({ summary: 'Create a MOC (Month of Cover) target' })
  @ApiResponse({ status: 201, description: 'MOC target created' })
  async createMOCTarget(@Body() dto: CreateMOCTargetDto) {
    return this.replenishmentService.createMOCTarget(dto);
  }

  @Get('moc-targets')
  @ApiOperation({ summary: 'Get MOC targets' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'seasonId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  async getMOCTargets(
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('seasonId') seasonId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.replenishmentService.getMOCTargets({
      brandId,
      categoryId,
      seasonId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Put('moc-targets/:id')
  @ApiOperation({ summary: 'Update a MOC target' })
  async updateMOCTarget(@Param('id') id: string, @Body() dto: Partial<CreateMOCTargetDto>) {
    return this.replenishmentService.updateMOCTarget(id, dto);
  }

  @Delete('moc-targets/:id')
  @ApiOperation({ summary: 'Delete a MOC target' })
  async deleteMOCTarget(@Param('id') id: string) {
    return this.replenishmentService.deleteMOCTarget(id);
  }

  // ==================== MOQ Rules ====================

  @Post('moq-rules')
  @ApiOperation({ summary: 'Create a MOQ (Minimum Order Quantity) rule' })
  @ApiResponse({ status: 201, description: 'MOQ rule created' })
  async createMOQRule(@Body() dto: CreateMOQRuleDto) {
    return this.replenishmentService.createMOQRule(dto);
  }

  @Get('moq-rules')
  @ApiOperation({ summary: 'Get MOQ rules' })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  async getMOQRules(
    @Query('supplierId') supplierId?: string,
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.replenishmentService.getMOQRules({ supplierId, brandId, categoryId });
  }

  @Put('moq-rules/:id')
  @ApiOperation({ summary: 'Update a MOQ rule' })
  async updateMOQRule(@Param('id') id: string, @Body() dto: Partial<CreateMOQRuleDto>) {
    return this.replenishmentService.updateMOQRule(id, dto);
  }

  @Delete('moq-rules/:id')
  @ApiOperation({ summary: 'Delete a MOQ rule' })
  async deleteMOQRule(@Param('id') id: string) {
    return this.replenishmentService.deleteMOQRule(id);
  }

  // ==================== Inventory Status ====================

  @Get('inventory-status')
  @ApiOperation({ summary: 'Get inventory status with MOC analysis' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'statusFilter', required: false, enum: ['ALL', 'LOW', 'CRITICAL', 'STOCKOUT', 'OVERSTOCK'] })
  async getInventoryStatus(
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('locationId') locationId?: string,
    @Query('statusFilter') statusFilter?: 'ALL' | 'LOW' | 'CRITICAL' | 'STOCKOUT' | 'OVERSTOCK',
  ) {
    return this.replenishmentService.getInventoryStatus({
      brandId,
      categoryId,
      locationId,
      statusFilter,
    });
  }

  @Post('generate-alerts')
  @ApiOperation({ summary: 'Generate replenishment alerts for low stock SKUs' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  async generateAlerts(
    @Query('brandId') brandId?: string,
    @Query('locationId') locationId?: string,
  ) {
    const count = await this.replenishmentService.generateAlerts({ brandId, locationId });
    return { alertsCreated: count };
  }

  // ==================== Alerts ====================

  @Get('alerts')
  @ApiOperation({ summary: 'Get replenishment alerts' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'alertType', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAlerts(
    @Query('status') status?: string,
    @Query('alertType') alertType?: string,
    @Query('brandId') brandId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.replenishmentService.getAlerts({
      status,
      alertType,
      brandId,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Put('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledgeAlert(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.replenishmentService.acknowledgeAlert(id, req.user.id);
  }

  @Put('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  async resolveAlert(@Param('id') id: string, @Body('notes') notes: string) {
    return this.replenishmentService.resolveAlert(id, notes);
  }

  // ==================== Orders ====================

  @Post('orders')
  @ApiOperation({ summary: 'Create a replenishment order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async createOrder(@Body() dto: CreateReplenishmentOrderDto, @Request() req: { user: { id: string } }) {
    return this.replenishmentService.createOrder(dto, req.user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get replenishment orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getOrders(
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.replenishmentService.getOrders({
      status,
      supplierId,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrderById(@Param('id') id: string) {
    return this.replenishmentService.getOrderById(id);
  }

  @Put('orders/:id/submit')
  @ApiOperation({ summary: 'Submit an order' })
  async submitOrder(@Param('id') id: string) {
    return this.replenishmentService.submitOrder(id);
  }

  @Put('orders/:id/confirm')
  @ApiOperation({ summary: 'Confirm an order' })
  async confirmOrder(@Param('id') id: string) {
    return this.replenishmentService.confirmOrder(id);
  }

  @Put('orders/:id/receive')
  @ApiOperation({ summary: 'Receive items for an order' })
  async receiveOrder(
    @Param('id') id: string,
    @Body() items: { skuId: string; receivedQty: number }[],
  ) {
    return this.replenishmentService.receiveOrder(id, items);
  }

  // ==================== Dashboard ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get replenishment dashboard summary' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  async getDashboardSummary(
    @Query('brandId') brandId?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.replenishmentService.getDashboardSummary({ brandId, locationId });
  }
}
