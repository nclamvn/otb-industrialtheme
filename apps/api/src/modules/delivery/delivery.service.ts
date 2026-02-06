import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDeliveryWindowDto,
  UpdateDeliveryWindowDto,
  CreateDeliveryAllocationDto,
  UpdateDeliveryAllocationDto,
  BatchDeliveryUpdateDto,
  CopyAllocationsDto,
  AutoDistributeDto,
  GetDeliveryAllocationsQueryDto,
  GetDeliveryMatrixQueryDto,
  GetDeliverySummaryQueryDto,
} from './delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Delivery Windows ====================

  async getWindows(params: { seasonId?: string; isActive?: boolean }) {
    const where: any = {};
    if (params.seasonId) where.seasonId = params.seasonId;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return this.prisma.deliveryWindow.findMany({
      where,
      include: { season: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getWindowById(id: string) {
    const window = await this.prisma.deliveryWindow.findUnique({
      where: { id },
      include: { season: true, allocations: true },
    });

    if (!window) {
      throw new NotFoundException(`Delivery window with ID ${id} not found`);
    }

    return window;
  }

  async createWindow(data: CreateDeliveryWindowDto) {
    // Verify season exists
    const season = await this.prisma.season.findUnique({
      where: { id: data.seasonId },
    });

    if (!season) {
      throw new NotFoundException(`Season with ID ${data.seasonId} not found`);
    }

    return this.prisma.deliveryWindow.create({
      data: {
        seasonId: data.seasonId,
        name: data.name,
        code: data.code,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { season: true },
    });
  }

  async updateWindow(id: string, data: UpdateDeliveryWindowDto) {
    await this.getWindowById(id); // Verify exists

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.code) updateData.code = data.code;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return this.prisma.deliveryWindow.update({
      where: { id },
      data: updateData,
      include: { season: true },
    });
  }

  async deleteWindow(id: string) {
    await this.getWindowById(id); // Verify exists

    await this.prisma.deliveryWindow.delete({ where: { id } });
    return { deleted: true };
  }

  // ==================== Delivery Allocations ====================

  async getAllocations(query: GetDeliveryAllocationsQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.windowId) where.windowId = query.windowId;
    if (query.skuId) where.skuItemId = query.skuId;
    if (query.storeGroup) {
      where.location = { storeGroup: query.storeGroup };
    }
    if (query.seasonId) {
      where.window = { seasonId: query.seasonId };
    }

    const [data, total] = await Promise.all([
      this.prisma.deliveryAllocation.findMany({
        where,
        skip,
        take: limit,
        include: {
          window: true,
          skuItem: { include: { proposal: true } },
          location: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deliveryAllocation.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllocationById(id: string) {
    const allocation = await this.prisma.deliveryAllocation.findUnique({
      where: { id },
      include: {
        window: true,
        skuItem: { include: { proposal: true, category: true } },
        location: true,
      },
    });

    if (!allocation) {
      throw new NotFoundException(`Delivery allocation with ID ${id} not found`);
    }

    return allocation;
  }

  async createAllocation(data: CreateDeliveryAllocationDto) {
    // Calculate value if not provided
    let value = data.value;
    if (!value) {
      const skuItem = await this.prisma.sKUItem.findUnique({
        where: { id: data.skuItemId },
      });
      if (skuItem) {
        value = Number(skuItem.retailPrice) * data.quantity;
      }
    }

    return this.prisma.deliveryAllocation.create({
      data: {
        windowId: data.windowId,
        skuItemId: data.skuItemId,
        locationId: data.locationId,
        quantity: data.quantity,
        value: value || 0,
        status: data.status || 'PENDING',
      },
      include: {
        window: true,
        skuItem: true,
        location: true,
      },
    });
  }

  async updateAllocation(id: string, data: UpdateDeliveryAllocationDto) {
    await this.getAllocationById(id); // Verify exists

    return this.prisma.deliveryAllocation.update({
      where: { id },
      data,
      include: {
        window: true,
        skuItem: true,
        location: true,
      },
    });
  }

  async deleteAllocation(id: string) {
    await this.getAllocationById(id); // Verify exists

    await this.prisma.deliveryAllocation.delete({ where: { id } });
    return { deleted: true };
  }

  async batchUpdateAllocations(data: BatchDeliveryUpdateDto) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of data.updates) {
      try {
        await this.prisma.deliveryAllocation.update({
          where: { id: update.id },
          data: {
            quantity: update.quantity,
            value: update.value,
            status: update.status,
          },
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update allocation ${update.id}`);
      }
    }

    return results;
  }

  // ==================== Matrix View ====================

  async getMatrix(query: GetDeliveryMatrixQueryDto) {
    const windows = await this.prisma.deliveryWindow.findMany({
      where: query.seasonId ? { seasonId: query.seasonId } : undefined,
      orderBy: { sortOrder: 'asc' },
    });

    const whereAllocations: any = {};
    if (query.seasonId) whereAllocations.window = { seasonId: query.seasonId };
    if (query.brandId) whereAllocations.skuItem = { proposal: { brandId: query.brandId } };
    if (query.categoryId) whereAllocations.skuItem = { categoryId: query.categoryId };
    if (query.storeGroup) whereAllocations.location = { storeGroup: query.storeGroup };

    const allocations = await this.prisma.deliveryAllocation.findMany({
      where: whereAllocations,
      include: {
        window: true,
        skuItem: {
          include: {
            proposal: { include: { brand: true } },
            category: true,
          },
        },
        location: true,
      },
    });

    // Group by SKU
    const skuMap = new Map<string, any>();

    for (const alloc of allocations) {
      const skuId = alloc.skuItemId;
      if (!skuMap.has(skuId)) {
        skuMap.set(skuId, {
          skuId,
          skuCode: alloc.skuItem.skuCode,
          skuName: alloc.skuItem.styleName,
          brand: alloc.skuItem.proposal.brand.name,
          category: alloc.skuItem.category.name,
          windows: {},
          totals: { quantity: 0, value: 0 },
        });
      }

      const sku = skuMap.get(skuId);
      if (!sku.windows[alloc.windowId]) {
        sku.windows[alloc.windowId] = {
          windowId: alloc.windowId,
          windowName: alloc.window.name,
          stores: [],
        };
      }

      sku.windows[alloc.windowId].stores.push({
        storeId: alloc.locationId,
        storeName: alloc.location.name,
        storeGroup: alloc.location.storeGroup,
        quantity: alloc.quantity,
        value: Number(alloc.value),
      });

      sku.totals.quantity += alloc.quantity;
      sku.totals.value += Number(alloc.value);
    }

    // Convert to array format
    return Array.from(skuMap.values()).map(sku => ({
      ...sku,
      windows: Object.values(sku.windows),
    }));
  }

  // ==================== Summary ====================

  async getSummary(query: GetDeliverySummaryQueryDto) {
    const whereWindows: any = {};
    if (query.seasonId) whereWindows.seasonId = query.seasonId;

    const windows = await this.prisma.deliveryWindow.findMany({
      where: whereWindows,
      include: {
        allocations: {
          include: { location: true },
          where: query.storeGroup
            ? { location: { storeGroup: query.storeGroup } }
            : undefined,
        },
      },
    });

    const byWindow = windows.map(w => ({
      windowId: w.id,
      windowName: w.name,
      quantity: w.allocations.reduce((sum, a) => sum + a.quantity, 0),
      value: w.allocations.reduce((sum, a) => sum + Number(a.value), 0),
    }));

    // Aggregate by store group
    const storeGroups = new Map<string, { quantity: number; value: number }>();
    for (const window of windows) {
      for (const alloc of window.allocations) {
        const group = alloc.location.storeGroup || 'OTHER';
        if (!storeGroups.has(group)) {
          storeGroups.set(group, { quantity: 0, value: 0 });
        }
        const g = storeGroups.get(group)!;
        g.quantity += alloc.quantity;
        g.value += Number(alloc.value);
      }
    }

    const totalQuantity = byWindow.reduce((sum, w) => sum + w.quantity, 0);
    const totalValue = byWindow.reduce((sum, w) => sum + w.value, 0);

    const byStoreGroup = Array.from(storeGroups.entries()).map(([group, data]) => ({
      storeGroup: group,
      quantity: data.quantity,
      value: data.value,
      percentage: totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0,
    }));

    // Count unique SKUs
    const uniqueSkus = new Set<string>();
    for (const window of windows) {
      for (const alloc of window.allocations) {
        uniqueSkus.add(alloc.skuItemId);
      }
    }

    return {
      seasonId: query.seasonId || 'all',
      totalWindows: windows.length,
      totalSKUs: uniqueSkus.size,
      totalQuantity,
      totalValue,
      byWindow,
      byStoreGroup,
    };
  }

  async getStoreSummary(query: GetDeliverySummaryQueryDto) {
    const stores = await this.prisma.salesLocation.findMany({
      where: query.storeGroup ? { storeGroup: query.storeGroup } : { isActive: true },
      include: {
        deliveryAllocations: {
          where: query.seasonId
            ? { window: { seasonId: query.seasonId } }
            : undefined,
          include: { window: true },
        },
      },
    });

    return stores.map(store => {
      const byWindow = new Map<string, { windowId: string; windowName: string; quantity: number; value: number }>();

      for (const alloc of store.deliveryAllocations) {
        if (!byWindow.has(alloc.windowId)) {
          byWindow.set(alloc.windowId, {
            windowId: alloc.windowId,
            windowName: alloc.window.name,
            quantity: 0,
            value: 0,
          });
        }
        const w = byWindow.get(alloc.windowId)!;
        w.quantity += alloc.quantity;
        w.value += Number(alloc.value);
      }

      const totals = {
        quantity: store.deliveryAllocations.reduce((sum, a) => sum + a.quantity, 0),
        value: store.deliveryAllocations.reduce((sum, a) => sum + Number(a.value), 0),
      };

      return {
        storeGroup: store.storeGroup || 'OTHER',
        storeId: store.id,
        storeName: store.name,
        windows: Array.from(byWindow.values()),
        totals,
      };
    });
  }

  // ==================== Copy & Auto-Distribute ====================

  async copyAllocations(data: CopyAllocationsDto) {
    const sourceAllocations = await this.prisma.deliveryAllocation.findMany({
      where: {
        windowId: data.sourceWindowId,
        ...(data.skuIds?.length ? { skuItemId: { in: data.skuIds } } : {}),
      },
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const alloc of sourceAllocations) {
      try {
        await this.prisma.deliveryAllocation.upsert({
          where: {
            windowId_skuItemId_locationId: {
              windowId: data.targetWindowId,
              skuItemId: alloc.skuItemId,
              locationId: alloc.locationId,
            },
          },
          create: {
            windowId: data.targetWindowId,
            skuItemId: alloc.skuItemId,
            locationId: alloc.locationId,
            quantity: alloc.quantity,
            value: alloc.value,
            status: 'PENDING',
          },
          update: {
            quantity: alloc.quantity,
            value: alloc.value,
          },
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to copy allocation for SKU ${alloc.skuItemId}`);
      }
    }

    return results;
  }

  async autoDistribute(data: AutoDistributeDto) {
    const windowCount = data.windowIds.length;
    if (windowCount === 0) {
      throw new BadRequestException('At least one window is required');
    }

    // Calculate quantities based on method
    let quantities: number[];

    switch (data.method) {
      case 'EQUAL':
        const baseQty = Math.floor(data.totalQuantity / windowCount);
        const remainder = data.totalQuantity % windowCount;
        quantities = data.windowIds.map((_, i) => baseQty + (i < remainder ? 1 : 0));
        break;

      case 'WEIGHTED':
        // Use descending weights (first window gets most)
        const totalWeight = (windowCount * (windowCount + 1)) / 2;
        quantities = data.windowIds.map((_, i) => {
          const weight = windowCount - i;
          return Math.round((weight / totalWeight) * data.totalQuantity);
        });
        break;

      case 'FRONT_LOADED':
        // 50% in first window, rest distributed
        const firstHalf = Math.floor(data.totalQuantity * 0.5);
        const remaining = data.totalQuantity - firstHalf;
        const perWindow = Math.floor(remaining / (windowCount - 1));
        quantities = [firstHalf, ...Array(windowCount - 1).fill(perWindow)];
        break;

      case 'BACK_LOADED':
        // 50% in last window, rest distributed
        const lastHalf = Math.floor(data.totalQuantity * 0.5);
        const rest = data.totalQuantity - lastHalf;
        const perWin = Math.floor(rest / (windowCount - 1));
        quantities = [...Array(windowCount - 1).fill(perWin), lastHalf];
        break;

      default:
        quantities = Array(windowCount).fill(Math.floor(data.totalQuantity / windowCount));
    }

    // Get SKU for pricing
    const skuItem = await this.prisma.sKUItem.findUnique({
      where: { id: data.skuId },
    });

    if (!skuItem) {
      throw new NotFoundException(`SKU with ID ${data.skuId} not found`);
    }

    // Get all active stores
    const stores = await this.prisma.salesLocation.findMany({
      where: { isActive: true },
    });

    const allocations = [];

    for (let i = 0; i < data.windowIds.length; i++) {
      const windowQty = quantities[i];
      const perStore = Math.floor(windowQty / stores.length);

      for (const store of stores) {
        const allocation = await this.prisma.deliveryAllocation.upsert({
          where: {
            windowId_skuItemId_locationId: {
              windowId: data.windowIds[i],
              skuItemId: data.skuId,
              locationId: store.id,
            },
          },
          create: {
            windowId: data.windowIds[i],
            skuItemId: data.skuId,
            locationId: store.id,
            quantity: perStore,
            value: perStore * Number(skuItem.retailPrice),
            status: 'PENDING',
          },
          update: {
            quantity: perStore,
            value: perStore * Number(skuItem.retailPrice),
          },
        });
        allocations.push(allocation);
      }
    }

    return allocations;
  }
}
