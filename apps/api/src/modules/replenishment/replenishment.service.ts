import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMOCTargetDto, CreateMOQRuleDto } from './dto/create-moc-target.dto';
import { CreateReplenishmentOrderDto } from './dto/create-replenishment-order.dto';

export interface SKUInventoryStatus {
  skuId: string;
  skuCode: string;
  skuName: string;
  brandId?: string;
  categoryId?: string;
  locationId?: string;
  currentStock: number;
  avgWeeklySales: number;
  avgMonthlySales: number;
  currentMOC: number;
  targetMOC: number;
  minMOC: number;
  maxMOC: number;
  safetyStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  costPrice: number;
  retailPrice: number;
  projectedStockoutDate?: Date;
  daysUntilStockout?: number;
  suggestedOrderQty: number;
  suggestedOrderValue: number;
  status: 'OK' | 'LOW' | 'CRITICAL' | 'STOCKOUT' | 'OVERSTOCK';
}

@Injectable()
export class ReplenishmentService {
  private readonly logger = new Logger(ReplenishmentService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== MOC Targets ====================

  async createMOCTarget(dto: CreateMOCTargetDto) {
    // Validate MOC values
    if (dto.minMOC > dto.targetMOC || dto.targetMOC > dto.maxMOC) {
      throw new BadRequestException('MOC values must be: min <= target <= max');
    }

    return this.prisma.mOCTarget.create({
      data: {
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        seasonId: dto.seasonId,
        locationId: dto.locationId,
        minMOC: dto.minMOC,
        targetMOC: dto.targetMOC,
        maxMOC: dto.maxMOC,
        leadTimeDays: dto.leadTimeDays || 30,
        safetyStockDays: dto.safetyStockDays || 14,
      },
    });
  }

  async getMOCTargets(filters: {
    brandId?: string;
    categoryId?: string;
    seasonId?: string;
    isActive?: boolean;
  }) {
    const where: any = {};
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.seasonId) where.seasonId = filters.seasonId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.mOCTarget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMOCTarget(id: string, dto: Partial<CreateMOCTargetDto>) {
    const target = await this.prisma.mOCTarget.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException(`MOC Target with ID ${id} not found`);
    }

    return this.prisma.mOCTarget.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMOCTarget(id: string) {
    await this.prisma.mOCTarget.delete({ where: { id } });
    return { success: true };
  }

  // ==================== MOQ Rules ====================

  async createMOQRule(dto: CreateMOQRuleDto) {
    return this.prisma.mOQRule.create({
      data: {
        supplierId: dto.supplierId,
        supplierName: dto.supplierName,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        moqUnits: dto.moqUnits,
        moqValue: dto.moqValue,
        packSize: dto.packSize || 1,
        cartonSize: dto.cartonSize,
        leadTimeDays: dto.leadTimeDays || 30,
      },
    });
  }

  async getMOQRules(filters: { supplierId?: string; brandId?: string; categoryId?: string }) {
    const where: any = { isActive: true };
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    return this.prisma.mOQRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMOQRule(id: string, dto: Partial<CreateMOQRuleDto>) {
    return this.prisma.mOQRule.update({
      where: { id },
      data: dto,
    });
  }

  async deleteMOQRule(id: string) {
    await this.prisma.mOQRule.delete({ where: { id } });
    return { success: true };
  }

  // ==================== Inventory Analysis ====================

  /**
   * Get MOC target for a specific context
   */
  async getMOCTargetForSKU(brandId?: string, categoryId?: string, locationId?: string) {
    // Try to find most specific target first
    const target = await this.prisma.mOCTarget.findFirst({
      where: {
        isActive: true,
        OR: [
          { brandId, categoryId, locationId },
          { brandId, categoryId, locationId: null },
          { brandId, categoryId: null, locationId: null },
          { brandId: null, categoryId: null, locationId: null },
        ],
      },
      orderBy: [
        { brandId: 'desc' },
        { categoryId: 'desc' },
        { locationId: 'desc' },
      ],
    });

    return target || {
      minMOC: 1.5,
      targetMOC: 2.5,
      maxMOC: 4.0,
      leadTimeDays: 30,
      safetyStockDays: 14,
    };
  }

  /**
   * Calculate MOC for an SKU
   */
  calculateMOC(currentStock: number, avgMonthlySales: number): number {
    if (avgMonthlySales === 0) return currentStock > 0 ? 999 : 0;
    return Math.round((currentStock / avgMonthlySales) * 100) / 100;
  }

  /**
   * Calculate safety stock
   */
  calculateSafetyStock(avgWeeklySales: number, safetyStockDays: number): number {
    return Math.ceil((avgWeeklySales / 7) * safetyStockDays);
  }

  /**
   * Calculate reorder point
   */
  calculateReorderPoint(avgWeeklySales: number, leadTimeDays: number, safetyStock: number): number {
    const leadTimeWeeks = leadTimeDays / 7;
    return Math.ceil(avgWeeklySales * leadTimeWeeks + safetyStock);
  }

  /**
   * Calculate suggested order quantity to reach target MOC
   */
  calculateSuggestedOrderQty(
    currentStock: number,
    avgMonthlySales: number,
    targetMOC: number,
    leadTimeDays: number,
  ): number {
    const targetStock = Math.ceil(avgMonthlySales * targetMOC);
    const leadTimeConsumption = Math.ceil(avgMonthlySales * (leadTimeDays / 30));
    const suggestedQty = targetStock - currentStock + leadTimeConsumption;
    return Math.max(0, suggestedQty);
  }

  /**
   * Get inventory status for all SKUs
   */
  async getInventoryStatus(filters: {
    brandId?: string;
    categoryId?: string;
    locationId?: string;
    statusFilter?: 'ALL' | 'LOW' | 'CRITICAL' | 'STOCKOUT' | 'OVERSTOCK';
  }): Promise<SKUInventoryStatus[]> {
    // In production, this would fetch real inventory data
    // For now, return mock data for demonstration
    const mockInventory: SKUInventoryStatus[] = [
      {
        skuId: 'sku-rep-001',
        skuCode: 'SHIRT-BLU-M',
        skuName: 'Blue Oxford Shirt - Medium',
        brandId: filters.brandId,
        categoryId: 'cat-tops',
        locationId: filters.locationId,
        currentStock: 45,
        avgWeeklySales: 20,
        avgMonthlySales: 85,
        currentMOC: 0.53,
        targetMOC: 2.5,
        minMOC: 1.5,
        maxMOC: 4.0,
        safetyStock: 40,
        reorderPoint: 126,
        leadTimeDays: 30,
        costPrice: 25.99,
        retailPrice: 59.99,
        daysUntilStockout: 16,
        projectedStockoutDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        suggestedOrderQty: 213,
        suggestedOrderValue: 5536.87,
        status: 'CRITICAL',
      },
      {
        skuId: 'sku-rep-002',
        skuCode: 'JEANS-BLK-32',
        skuName: 'Black Slim Jeans - 32',
        brandId: filters.brandId,
        categoryId: 'cat-bottoms',
        locationId: filters.locationId,
        currentStock: 120,
        avgWeeklySales: 15,
        avgMonthlySales: 64,
        currentMOC: 1.88,
        targetMOC: 2.5,
        minMOC: 1.5,
        maxMOC: 4.0,
        safetyStock: 30,
        reorderPoint: 94,
        leadTimeDays: 30,
        costPrice: 35.99,
        retailPrice: 89.99,
        daysUntilStockout: 56,
        suggestedOrderQty: 104,
        suggestedOrderValue: 3742.96,
        status: 'LOW',
      },
      {
        skuId: 'sku-rep-003',
        skuCode: 'SWEATER-GRN-L',
        skuName: 'Green Wool Sweater - Large',
        brandId: filters.brandId,
        categoryId: 'cat-tops',
        locationId: filters.locationId,
        currentStock: 200,
        avgWeeklySales: 12,
        avgMonthlySales: 51,
        currentMOC: 3.92,
        targetMOC: 2.5,
        minMOC: 1.5,
        maxMOC: 4.0,
        safetyStock: 24,
        reorderPoint: 75,
        leadTimeDays: 30,
        costPrice: 45.99,
        retailPrice: 119.99,
        daysUntilStockout: 117,
        suggestedOrderQty: 0,
        suggestedOrderValue: 0,
        status: 'OK',
      },
      {
        skuId: 'sku-rep-004',
        skuCode: 'COAT-BRN-XL',
        skuName: 'Brown Winter Coat - XL',
        brandId: filters.brandId,
        categoryId: 'cat-outerwear',
        locationId: filters.locationId,
        currentStock: 350,
        avgWeeklySales: 8,
        avgMonthlySales: 34,
        currentMOC: 10.29,
        targetMOC: 2.5,
        minMOC: 1.5,
        maxMOC: 4.0,
        safetyStock: 16,
        reorderPoint: 50,
        leadTimeDays: 30,
        costPrice: 89.99,
        retailPrice: 249.99,
        daysUntilStockout: 306,
        suggestedOrderQty: 0,
        suggestedOrderValue: 0,
        status: 'OVERSTOCK',
      },
      {
        skuId: 'sku-rep-005',
        skuCode: 'SCARF-RED-OS',
        skuName: 'Red Cashmere Scarf - One Size',
        brandId: filters.brandId,
        categoryId: 'cat-accessories',
        locationId: filters.locationId,
        currentStock: 0,
        avgWeeklySales: 5,
        avgMonthlySales: 21,
        currentMOC: 0,
        targetMOC: 2.5,
        minMOC: 1.5,
        maxMOC: 4.0,
        safetyStock: 10,
        reorderPoint: 31,
        leadTimeDays: 30,
        costPrice: 39.99,
        retailPrice: 89.99,
        daysUntilStockout: 0,
        suggestedOrderQty: 74,
        suggestedOrderValue: 2959.26,
        status: 'STOCKOUT',
      },
    ];

    // Apply status filter
    if (filters.statusFilter && filters.statusFilter !== 'ALL') {
      return mockInventory.filter((item) => item.status === filters.statusFilter);
    }

    return mockInventory;
  }

  /**
   * Generate replenishment alerts
   */
  async generateAlerts(filters: { brandId?: string; locationId?: string }): Promise<number> {
    const inventoryStatus = await this.getInventoryStatus(filters);
    let alertsCreated = 0;

    for (const item of inventoryStatus) {
      if (item.status === 'STOCKOUT' || item.status === 'CRITICAL' || item.status === 'LOW') {
        // Check if alert already exists
        const existingAlert = await this.prisma.replenishmentAlert.findFirst({
          where: {
            skuId: item.skuId,
            status: { in: ['OPEN', 'ACKNOWLEDGED'] },
          },
        });

        if (!existingAlert) {
          let alertType = 'LOW_MOC';
          if (item.status === 'STOCKOUT') alertType = 'STOCKOUT_RISK';
          else if (item.currentStock <= item.reorderPoint) alertType = 'REORDER_POINT';
          else if (item.daysUntilStockout && item.daysUntilStockout <= item.leadTimeDays) {
            alertType = 'LEAD_TIME_WARNING';
          }

          await this.prisma.replenishmentAlert.create({
            data: {
              skuId: item.skuId,
              skuCode: item.skuCode,
              skuName: item.skuName,
              brandId: item.brandId,
              categoryId: item.categoryId,
              locationId: item.locationId,
              alertType,
              currentStock: item.currentStock,
              currentMOC: item.currentMOC,
              avgWeeklySales: item.avgWeeklySales,
              targetMOC: item.targetMOC,
              safetyStock: item.safetyStock,
              recommendedOrderQty: item.suggestedOrderQty,
              recommendedOrderValue: item.suggestedOrderValue,
              recommendedOrderDate: new Date(),
              projectedStockoutDate: item.projectedStockoutDate,
            },
          });
          alertsCreated++;
        }
      }
    }

    return alertsCreated;
  }

  // ==================== Alerts ====================

  async getAlerts(filters: {
    status?: string;
    alertType?: string;
    brandId?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.alertType) where.alertType = filters.alertType;
    if (filters.brandId) where.brandId = filters.brandId;

    return this.prisma.replenishmentAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  async acknowledgeAlert(id: string, userId: string) {
    return this.prisma.replenishmentAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
    });
  }

  async resolveAlert(id: string, notes: string) {
    return this.prisma.replenishmentAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNotes: notes,
      },
    });
  }

  // ==================== Orders ====================

  async createOrder(dto: CreateReplenishmentOrderDto, userId: string) {
    // Generate order number
    const orderCount = await this.prisma.replenishmentOrder.count();
    const orderNumber = `RO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, '0')}`;

    // Calculate totals
    let totalUnits = 0;
    let totalValue = 0;

    for (const item of dto.items) {
      const discount = item.discountPct || 0;
      const itemValue = item.orderedQty * item.unitCost * (1 - discount / 100);
      totalUnits += item.orderedQty;
      totalValue += itemValue;
    }

    // Create order with items
    const order = await this.prisma.replenishmentOrder.create({
      data: {
        orderNumber,
        supplierId: dto.supplierId,
        supplierName: dto.supplierName,
        expectedDelivery: new Date(dto.expectedDelivery),
        totalUnits,
        totalValue,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            skuId: item.skuId,
            skuCode: item.skuCode,
            skuName: item.skuName,
            orderedQty: item.orderedQty,
            unitCost: item.unitCost,
            totalValue: item.orderedQty * item.unitCost * (1 - (item.discountPct || 0) / 100),
            discountPct: item.discountPct,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Link alerts to order if provided
    if (dto.alertIds && dto.alertIds.length > 0) {
      await this.prisma.replenishmentAlert.updateMany({
        where: { id: { in: dto.alertIds } },
        data: {
          status: 'ORDERED',
          orderId: order.id,
        },
      });
    }

    return order;
  }

  async getOrders(filters: { status?: string; supplierId?: string; limit?: number }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.supplierId) where.supplierId = filters.supplierId;

    return this.prisma.replenishmentOrder.findMany({
      where,
      include: {
        items: true,
        _count: { select: { alerts: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.replenishmentOrder.findUnique({
      where: { id },
      include: {
        items: true,
        alerts: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async submitOrder(id: string) {
    return this.prisma.replenishmentOrder.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });
  }

  async confirmOrder(id: string) {
    return this.prisma.replenishmentOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  async receiveOrder(id: string, items: { skuId: string; receivedQty: number }[]) {
    const order = await this.getOrderById(id);

    // Update received quantities
    for (const itemUpdate of items) {
      await this.prisma.replenishmentOrderItem.updateMany({
        where: {
          orderId: id,
          skuId: itemUpdate.skuId,
        },
        data: { receivedQty: itemUpdate.receivedQty },
      });
    }

    // Check if fully received
    const updatedItems = await this.prisma.replenishmentOrderItem.findMany({
      where: { orderId: id },
    });

    const fullyReceived = updatedItems.every((item) => item.receivedQty >= item.orderedQty);
    const partiallyReceived = updatedItems.some((item) => item.receivedQty > 0);

    const newStatus = fullyReceived
      ? 'RECEIVED'
      : partiallyReceived
      ? 'PARTIALLY_RECEIVED'
      : order.status;

    return this.prisma.replenishmentOrder.update({
      where: { id },
      data: {
        status: newStatus,
        actualDelivery: fullyReceived ? new Date() : undefined,
      },
      include: { items: true },
    });
  }

  // ==================== Dashboard ====================

  async getDashboardSummary(filters: { brandId?: string; locationId?: string }) {
    const inventoryStatus = await this.getInventoryStatus(filters);

    const alertCounts = await this.prisma.replenishmentAlert.groupBy({
      by: ['status'],
      _count: true,
      where: filters.brandId ? { brandId: filters.brandId } : undefined,
    });

    const pendingOrders = await this.prisma.replenishmentOrder.count({
      where: { status: { in: ['DRAFT', 'SUBMITTED', 'CONFIRMED'] } },
    });

    return {
      inventorySummary: {
        totalSKUs: inventoryStatus.length,
        stockout: inventoryStatus.filter((i) => i.status === 'STOCKOUT').length,
        critical: inventoryStatus.filter((i) => i.status === 'CRITICAL').length,
        low: inventoryStatus.filter((i) => i.status === 'LOW').length,
        ok: inventoryStatus.filter((i) => i.status === 'OK').length,
        overstock: inventoryStatus.filter((i) => i.status === 'OVERSTOCK').length,
      },
      alertSummary: {
        open: alertCounts.find((a) => a.status === 'OPEN')?._count || 0,
        acknowledged: alertCounts.find((a) => a.status === 'ACKNOWLEDGED')?._count || 0,
        ordered: alertCounts.find((a) => a.status === 'ORDERED')?._count || 0,
        resolved: alertCounts.find((a) => a.status === 'RESOLVED')?._count || 0,
      },
      pendingOrders,
      urgentItems: inventoryStatus
        .filter((i) => i.status === 'STOCKOUT' || i.status === 'CRITICAL')
        .slice(0, 10),
    };
  }
}
