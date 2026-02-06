import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateWSSIDto, WSSIForecastType } from './dto/create-wssi.dto';
import { UpdateWSSIDto } from './dto/update-wssi.dto';
import { QueryWSSIDto, WSSISummaryQueryDto } from './dto/query-wssi.dto';
import { ReforecastDto, BulkReforecastDto } from './dto/reforecast.dto';
import { CreateThresholdDto, UpdateThresholdDto } from './dto/threshold.dto';

@Injectable()
export class WSSIService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryWSSIDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.WSSIRecordWhereInput = {};

    if (query.year) where.year = query.year;
    if (query.weekNumber) where.weekNumber = query.weekNumber;
    if (query.weekStart && query.weekEnd) {
      where.weekNumber = { gte: query.weekStart, lte: query.weekEnd };
    }
    if (query.divisionId) where.divisionId = query.divisionId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.subcategoryId) where.subcategoryId = query.subcategoryId;
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.forecastType) where.forecastType = query.forecastType;
    if (query.hasAlerts) {
      where.alerts = { some: { isAcknowledged: false } };
    }

    let orderBy: Prisma.WSSIRecordOrderByWithRelationInput = { weekNumber: 'asc' };
    if (query.sortBy) {
      orderBy = { [query.sortBy]: query.sortOrder || 'asc' } as Prisma.WSSIRecordOrderByWithRelationInput;
    }

    const [data, total] = await Promise.all([
      this.prisma.wSSIRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          division: { select: { id: true, name: true, code: true } },
          brand: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true, code: true } },
          subcategory: { select: { id: true, name: true, code: true } },
          season: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, code: true } },
          alerts: {
            where: { isAcknowledged: false },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.wSSIRecord.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.wSSIRecord.findUnique({
      where: { id },
      include: {
        division: true,
        brand: true,
        category: true,
        subcategory: true,
        season: true,
        location: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
          include: {
            acknowledgedBy: { select: { id: true, name: true, email: true } },
          },
        },
        reforecastedBy: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!record) {
      throw new NotFoundException('WSSI record not found');
    }

    return record;
  }

  async create(dto: CreateWSSIDto, userId: string) {
    const calculatedMetrics = this.calculateMetrics(dto);

    const record = await this.prisma.wSSIRecord.create({
      data: {
        year: dto.year,
        weekNumber: dto.weekNumber,
        weekStartDate: new Date(dto.weekStartDate),
        weekEndDate: new Date(dto.weekEndDate),
        divisionId: dto.divisionId,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        seasonId: dto.seasonId,
        locationId: dto.locationId,
        openingStockValue: dto.openingStockValue || 0,
        closingStockValue: dto.closingStockValue || 0,
        openingStockUnits: dto.openingStockUnits || 0,
        closingStockUnits: dto.closingStockUnits || 0,
        salesPlanValue: dto.salesPlanValue || 0,
        salesPlanUnits: dto.salesPlanUnits || 0,
        salesActualValue: dto.salesActualValue || 0,
        salesActualUnits: dto.salesActualUnits || 0,
        intakePlanValue: dto.intakePlanValue || 0,
        intakePlanUnits: dto.intakePlanUnits || 0,
        intakeActualValue: dto.intakeActualValue || 0,
        intakeActualUnits: dto.intakeActualUnits || 0,
        markdownPlanValue: dto.markdownPlanValue,
        markdownActualValue: dto.markdownActualValue,
        forecastType: dto.forecastType || WSSIForecastType.PLAN,
        ...calculatedMetrics,
        createdById: userId,
      },
      include: {
        division: true,
        brand: true,
        category: true,
        season: true,
      },
    });

    await this.checkAndCreateAlerts(record);

    return record;
  }

  async update(id: string, dto: UpdateWSSIDto) {
    const existing = await this.prisma.wSSIRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('WSSI record not found');
    }

    const updateData: any = { ...dto };
    if ((dto as any).weekStartDate) updateData.weekStartDate = new Date((dto as any).weekStartDate);
    if ((dto as any).weekEndDate) updateData.weekEndDate = new Date((dto as any).weekEndDate);

    const calculatedMetrics = this.calculateMetrics({
      ...existing,
      ...dto,
    } as any);

    const record = await this.prisma.wSSIRecord.update({
      where: { id },
      data: {
        ...updateData,
        ...calculatedMetrics,
      },
      include: {
        division: true,
        brand: true,
        category: true,
        season: true,
        location: true,
      },
    });

    await this.checkAndCreateAlerts(record);

    return record;
  }

  async remove(id: string) {
    const existing = await this.prisma.wSSIRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('WSSI record not found');
    }

    await this.prisma.wSSIRecord.delete({ where: { id } });
    return { deleted: true };
  }

  async reforecast(dto: ReforecastDto, userId: string) {
    const results = [];

    for (const weekUpdate of dto.weekUpdates) {
      const existing = await this.prisma.wSSIRecord.findFirst({
        where: {
          year: dto.year,
          weekNumber: weekUpdate.weekNumber,
          divisionId: dto.divisionId,
          brandId: dto.brandId,
          categoryId: dto.categoryId || null,
          subcategoryId: dto.subcategoryId || null,
          seasonId: dto.seasonId,
          locationId: dto.locationId || null,
        },
      });

      if (!existing) {
        throw new NotFoundException(
          `WSSI record not found for week ${weekUpdate.weekNumber}`,
        );
      }

      const updateData: any = {
        forecastType: WSSIForecastType.REFORECAST,
        reforecastedAt: new Date(),
        reforecastedById: userId,
        reforecastReason: dto.reforecastReason,
      };

      if (weekUpdate.salesPlanValue !== undefined) {
        updateData.salesPlanValue = weekUpdate.salesPlanValue;
      }
      if (weekUpdate.salesPlanUnits !== undefined) {
        updateData.salesPlanUnits = weekUpdate.salesPlanUnits;
      }
      if (weekUpdate.intakePlanValue !== undefined) {
        updateData.intakePlanValue = weekUpdate.intakePlanValue;
      }
      if (weekUpdate.intakePlanUnits !== undefined) {
        updateData.intakePlanUnits = weekUpdate.intakePlanUnits;
      }
      if (weekUpdate.markdownPlanValue !== undefined) {
        updateData.markdownPlanValue = weekUpdate.markdownPlanValue;
      }

      const calculatedMetrics = this.calculateMetrics({
        ...existing,
        ...updateData,
      } as any);

      const updated = await this.prisma.wSSIRecord.update({
        where: { id: existing.id },
        data: {
          ...updateData,
          ...calculatedMetrics,
        },
      });

      results.push(updated);
    }

    return { updated: results.length, records: results };
  }

  async bulkReforecast(dto: BulkReforecastDto, userId: string) {
    const results = [];

    for (const record of dto.records) {
      const existing = await this.prisma.wSSIRecord.findUnique({
        where: { id: record.wssiRecordId },
      });

      if (!existing) {
        throw new NotFoundException(
          `WSSI record not found: ${record.wssiRecordId}`,
        );
      }

      const updateData: any = {
        forecastType: WSSIForecastType.REFORECAST,
        reforecastedAt: new Date(),
        reforecastedById: userId,
        reforecastReason: dto.reforecastReason,
      };

      if (record.salesPlanValue !== undefined) {
        updateData.salesPlanValue = record.salesPlanValue;
      }
      if (record.salesPlanUnits !== undefined) {
        updateData.salesPlanUnits = record.salesPlanUnits;
      }
      if (record.intakePlanValue !== undefined) {
        updateData.intakePlanValue = record.intakePlanValue;
      }
      if (record.intakePlanUnits !== undefined) {
        updateData.intakePlanUnits = record.intakePlanUnits;
      }
      if (record.markdownPlanValue !== undefined) {
        updateData.markdownPlanValue = record.markdownPlanValue;
      }

      const calculatedMetrics = this.calculateMetrics({
        ...existing,
        ...updateData,
      } as any);

      const updated = await this.prisma.wSSIRecord.update({
        where: { id: existing.id },
        data: {
          ...updateData,
          ...calculatedMetrics,
        },
      });

      results.push(updated);
    }

    return { updated: results.length, records: results };
  }

  async getSummary(query: WSSISummaryQueryDto) {
    const where: Prisma.WSSIRecordWhereInput = { year: query.year };

    if (query.divisionId) where.divisionId = query.divisionId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.locationId) where.locationId = query.locationId;

    const records = await this.prisma.wSSIRecord.findMany({
      where,
      orderBy: { weekNumber: 'asc' },
      include: {
        brand: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, code: true } },
      },
    });

    const totals = {
      totalSalesPlan: 0,
      totalSalesActual: 0,
      totalIntakePlan: 0,
      totalIntakeActual: 0,
      averageWoC: 0,
      averageSellThrough: 0,
      averageSalesVariance: 0,
    };

    for (const record of records) {
      totals.totalSalesPlan += Number(record.salesPlanValue);
      totals.totalSalesActual += Number(record.salesActualValue);
      totals.totalIntakePlan += Number(record.intakePlanValue);
      totals.totalIntakeActual += Number(record.intakeActualValue);
      totals.averageWoC += Number(record.weeksOfCover);
      totals.averageSellThrough += Number(record.sellThroughPct);
      totals.averageSalesVariance += Number(record.salesVariancePct);
    }

    const count = records.length || 1;
    totals.averageWoC = totals.averageWoC / count;
    totals.averageSellThrough = totals.averageSellThrough / count;
    totals.averageSalesVariance = totals.averageSalesVariance / count;

    let groupedData: Record<string, any[]> = {};
    if (query.groupBy) {
      for (const record of records) {
        let key: string;
        switch (query.groupBy) {
          case 'week':
            key = `W${record.weekNumber}`;
            break;
          case 'month':
            key = `M${Math.ceil(record.weekNumber / 4)}`;
            break;
          case 'brand':
            key = record.brand?.name || 'Unknown';
            break;
          case 'category':
            key = record.category?.name || 'Unknown';
            break;
          case 'location':
            key = record.location?.name || 'All Locations';
            break;
          default:
            key = 'all';
        }
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push(record);
      }
    }

    return {
      year: query.year,
      recordCount: records.length,
      totals,
      groupedData: query.groupBy ? groupedData : null,
      records: query.groupBy ? null : records,
    };
  }

  async getAlerts(query: {
    divisionId?: string;
    brandId?: string;
    acknowledged?: boolean;
    severity?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.WSSIAlertWhereInput = {};

    if (query.divisionId || query.brandId) {
      where.wssiRecord = {};
      if (query.divisionId) {
        (where.wssiRecord as any).divisionId = query.divisionId;
      }
      if (query.brandId) {
        (where.wssiRecord as any).brandId = query.brandId;
      }
    }
    if (query.acknowledged !== undefined) {
      where.isAcknowledged = query.acknowledged;
    }
    if (query.severity) {
      where.severity = query.severity as any;
    }

    const [data, total] = await Promise.all([
      this.prisma.wSSIAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wssiRecord: {
            include: {
              brand: { select: { id: true, name: true, code: true } },
              category: { select: { id: true, name: true, code: true } },
            },
          },
          acknowledgedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.wSSIAlert.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async acknowledgeAlert(alertId: string, userId: string, notes?: string) {
    const alert = await this.prisma.wSSIAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    return this.prisma.wSSIAlert.update({
      where: { id: alertId },
      data: {
        isAcknowledged: true,
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
        resolutionNotes: notes,
      },
    });
  }

  // Threshold Management
  async getThresholds(query: {
    divisionId?: string;
    brandId?: string;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const where: Prisma.WSSIThresholdWhereInput = {};
    if (query.divisionId) where.divisionId = query.divisionId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.wSSIThreshold.findMany({
      where,
      include: {
        division: { select: { id: true, name: true, code: true } },
        brand: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ divisionId: 'asc' }, { brandId: 'asc' }],
    });
  }

  async getThreshold(id: string) {
    const threshold = await this.prisma.wSSIThreshold.findUnique({
      where: { id },
      include: {
        division: true,
        brand: true,
        category: true,
      },
    });

    if (!threshold) {
      throw new NotFoundException('Threshold not found');
    }

    return threshold;
  }

  async createThreshold(dto: CreateThresholdDto) {
    return this.prisma.wSSIThreshold.create({
      data: {
        divisionId: dto.divisionId,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        wocMinimum: dto.wocMinimum ?? 3.0,
        wocMaximum: dto.wocMaximum ?? 8.0,
        wocTarget: dto.wocTarget ?? 5.0,
        salesVarianceAlert: dto.salesVarianceAlert ?? 10.0,
        isActive: dto.isActive ?? true,
      },
      include: {
        division: { select: { id: true, name: true, code: true } },
        brand: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async updateThreshold(id: string, dto: UpdateThresholdDto) {
    const existing = await this.prisma.wSSIThreshold.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Threshold not found');
    }

    return this.prisma.wSSIThreshold.update({
      where: { id },
      data: dto,
      include: {
        division: { select: { id: true, name: true, code: true } },
        brand: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async deleteThreshold(id: string) {
    const existing = await this.prisma.wSSIThreshold.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Threshold not found');
    }

    await this.prisma.wSSIThreshold.delete({ where: { id } });
    return { deleted: true };
  }

  private calculateMetrics(data: any) {
    const salesPlan = Number(data.salesPlanValue) || 0;
    const salesActual = Number(data.salesActualValue) || 0;
    const intakePlan = Number(data.intakePlanValue) || 0;
    const intakeActual = Number(data.intakeActualValue) || 0;
    const closingStock = Number(data.closingStockValue) || 0;

    const salesVariancePct =
      salesPlan > 0 ? ((salesActual - salesPlan) / salesPlan) * 100 : 0;

    const intakeVariancePct =
      intakePlan > 0 ? ((intakeActual - intakePlan) / intakePlan) * 100 : 0;

    const weeksOfCover = salesActual > 0 ? closingStock / (salesActual / 1) : 0;

    const openingStock = Number(data.openingStockValue) || 0;
    const totalAvailable = openingStock + intakeActual;
    const sellThroughPct =
      totalAvailable > 0 ? (salesActual / totalAvailable) * 100 : 0;

    return {
      salesVariancePct: Math.round(salesVariancePct * 100) / 100,
      intakeVariancePct: Math.round(intakeVariancePct * 100) / 100,
      weeksOfCover: Math.round(weeksOfCover * 100) / 100,
      sellThroughPct: Math.round(sellThroughPct * 100) / 100,
    };
  }

  private async checkAndCreateAlerts(record: any) {
    const threshold = await this.prisma.wSSIThreshold.findFirst({
      where: {
        OR: [
          { divisionId: record.divisionId, brandId: record.brandId },
          { divisionId: record.divisionId, brandId: null },
          { divisionId: null, brandId: null },
        ],
        isActive: true,
      },
      orderBy: [{ divisionId: 'desc' }, { brandId: 'desc' }],
    });

    if (!threshold) return;

    const alerts: Array<{
      alertType: string;
      severity: string;
      thresholdValue: number;
      actualValue: number;
      title: string;
      message: string;
      recommendation?: string;
    }> = [];

    const woc = Number(record.weeksOfCover);
    const wocMin = Number(threshold.wocMinimum);
    const wocMax = Number(threshold.wocMaximum);

    if (woc < wocMin) {
      alerts.push({
        alertType: 'LOW_STOCK',
        severity: woc < wocMin * 0.5 ? 'CRITICAL' : 'HIGH',
        thresholdValue: wocMin,
        actualValue: woc,
        title: 'Low Stock Alert',
        message: `Weeks of Cover (${woc.toFixed(1)}) is below minimum threshold (${wocMin})`,
        recommendation: 'Consider expediting pending intake orders or reducing sales forecast',
      });
    }

    if (woc > wocMax) {
      alerts.push({
        alertType: 'HIGH_STOCK',
        severity: woc > wocMax * 1.5 ? 'HIGH' : 'MEDIUM',
        thresholdValue: wocMax,
        actualValue: woc,
        title: 'High Stock Alert',
        message: `Weeks of Cover (${woc.toFixed(1)}) exceeds maximum threshold (${wocMax})`,
        recommendation: 'Consider markdown action or reducing future intake',
      });
    }

    const salesVariance = Math.abs(Number(record.salesVariancePct));
    const salesThreshold = Number(threshold.salesVarianceAlert);

    if (salesVariance > salesThreshold) {
      const isBelow = Number(record.salesVariancePct) < 0;
      alerts.push({
        alertType: isBelow ? 'SALES_BELOW_PLAN' : 'SALES_ABOVE_PLAN',
        severity: salesVariance > salesThreshold * 2 ? 'HIGH' : 'MEDIUM',
        thresholdValue: salesThreshold,
        actualValue: salesVariance,
        title: isBelow ? 'Sales Below Plan' : 'Sales Above Plan',
        message: `Sales variance (${record.salesVariancePct.toFixed(1)}%) exceeds alert threshold (±${salesThreshold}%)`,
        recommendation: isBelow
          ? 'Review pricing strategy and marketing activities'
          : 'Review inventory availability to meet demand',
      });
    }

    for (const alertData of alerts) {
      await this.prisma.wSSIAlert.create({
        data: {
          wssiRecordId: record.id,
          alertType: alertData.alertType as any,
          severity: alertData.severity as any,
          thresholdValue: alertData.thresholdValue,
          actualValue: alertData.actualValue,
          title: alertData.title,
          message: alertData.message,
          recommendation: alertData.recommendation,
        },
      });
    }
  }
}
