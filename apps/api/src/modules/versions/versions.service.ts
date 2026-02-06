import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateVersionDto,
  UpdateVersionDto,
  OTBPlanVersionType,
  OTBPlanVersionStatus,
  RecordChangeDto,
} from './dto/create-version.dto';

@Injectable()
export class VersionsService {
  constructor(private prisma: PrismaService) {}

  // Version Type Workflow Order
  private readonly versionTypeOrder = [
    OTBPlanVersionType.SYSTEM_PROPOSED,
    OTBPlanVersionType.USER_ADJUSTED,
    OTBPlanVersionType.FINANCE_REVIEWED,
    OTBPlanVersionType.BOD_APPROVED,
    OTBPlanVersionType.BRAND_CONSENSUS,
  ];

  async findAll(query: {
    otbPlanId?: string;
    versionType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.OTBPlanVersionWhereInput = {};
    if (query.otbPlanId) where.otbPlanId = query.otbPlanId;
    if (query.versionType) where.versionType = query.versionType as any;
    if (query.status) where.status = query.status as any;

    const [data, total] = await Promise.all([
      this.prisma.oTBPlanVersion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { versionNumber: 'desc' },
        include: {
          otbPlan: {
            include: {
              budget: {
                include: {
                  brand: { select: { id: true, name: true, code: true } },
                  season: { select: { id: true, name: true, code: true } },
                },
              },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
          submittedBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.oTBPlanVersion.count({ where }),
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
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                brand: true,
                season: true,
                location: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        changes: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }

  async create(dto: CreateVersionDto, userId: string) {
    // Get the latest version for this OTB plan
    const latestVersion = await this.prisma.oTBPlanVersion.findFirst({
      where: { otbPlanId: dto.otbPlanId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Validate version type progression
    if (latestVersion) {
      const currentTypeIndex = this.versionTypeOrder.indexOf(
        latestVersion.versionType as OTBPlanVersionType,
      );
      const newTypeIndex = this.versionTypeOrder.indexOf(dto.versionType);

      // Allow same type (revision) or next type in sequence
      if (newTypeIndex < currentTypeIndex) {
        throw new BadRequestException(
          `Cannot create ${dto.versionType} version after ${latestVersion.versionType}`,
        );
      }

      // Mark previous version as superseded
      await this.prisma.oTBPlanVersion.update({
        where: { id: latestVersion.id },
        data: { status: OTBPlanVersionStatus.SUPERSEDED },
      });
    }

    const version = await this.prisma.oTBPlanVersion.create({
      data: {
        otbPlanId: dto.otbPlanId,
        versionNumber: nextVersionNumber,
        versionType: dto.versionType,
        snapshotData: dto.snapshotData,
        totalOTBValue: dto.totalOTBValue,
        totalOTBUnits: dto.totalOTBUnits,
        status: OTBPlanVersionStatus.DRAFT,
        createdById: userId,
      },
      include: {
        otbPlan: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return version;
  }

  async update(id: string, dto: UpdateVersionDto) {
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status === OTBPlanVersionStatus.APPROVED) {
      throw new ForbiddenException('Cannot modify an approved version');
    }

    return this.prisma.oTBPlanVersion.update({
      where: { id },
      data: dto as any,
      include: {
        otbPlan: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async submit(id: string, userId: string, comments?: string) {
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status !== OTBPlanVersionStatus.DRAFT) {
      throw new BadRequestException('Only draft versions can be submitted');
    }

    return this.prisma.oTBPlanVersion.update({
      where: { id },
      data: {
        status: OTBPlanVersionStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedById: userId,
        approvalComments: comments,
      },
      include: {
        otbPlan: true,
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async review(id: string, userId: string) {
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status !== OTBPlanVersionStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted versions can be reviewed');
    }

    return this.prisma.oTBPlanVersion.update({
      where: { id },
      data: {
        status: OTBPlanVersionStatus.UNDER_REVIEW,
      },
    });
  }

  async approve(id: string, userId: string, comments?: string) {
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id },
      include: { otbPlan: true },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (
      version.status !== OTBPlanVersionStatus.SUBMITTED &&
      version.status !== OTBPlanVersionStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Only submitted or under review versions can be approved',
      );
    }

    // Update version and OTB plan in transaction
    return this.prisma.$transaction(async (tx) => {
      const updatedVersion = await tx.oTBPlanVersion.update({
        where: { id },
        data: {
          status: OTBPlanVersionStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: userId,
          approvalComments: comments,
        },
        include: {
          otbPlan: true,
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });

      // Update OTB plan version number to track latest approved version
      await tx.oTBPlan.update({
        where: { id: version.otbPlanId },
        data: {
          version: version.versionNumber,
        },
      });

      return updatedVersion;
    });
  }

  async reject(id: string, userId: string, reason: string) {
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (
      version.status !== OTBPlanVersionStatus.SUBMITTED &&
      version.status !== OTBPlanVersionStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Only submitted or under review versions can be rejected',
      );
    }

    return this.prisma.oTBPlanVersion.update({
      where: { id },
      data: {
        status: OTBPlanVersionStatus.REJECTED,
        approvalComments: reason,
      },
    });
  }

  async recordChange(versionId: string, change: RecordChangeDto) {
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return this.prisma.oTBVersionChange.create({
      data: {
        versionId,
        entityType: change.entityType,
        entityId: change.entityId,
        fieldName: change.fieldName,
        previousValue: change.previousValue,
        newValue: change.newValue,
        changeReason: change.changeReason,
      },
    });
  }

  async getChanges(versionId: string) {
    const version = await this.prisma.oTBPlanVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return this.prisma.oTBVersionChange.findMany({
      where: { versionId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async compareVersions(versionId1: string, versionId2: string) {
    const [version1, version2] = await Promise.all([
      this.prisma.oTBPlanVersion.findUnique({
        where: { id: versionId1 },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          changes: true,
        },
      }),
      this.prisma.oTBPlanVersion.findUnique({
        where: { id: versionId2 },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          changes: true,
        },
      }),
    ]);

    if (!version1 || !version2) {
      throw new NotFoundException('One or both versions not found');
    }

    // Calculate differences
    const snapshot1 = version1.snapshotData as Record<string, any>;
    const snapshot2 = version2.snapshotData as Record<string, any>;

    const differences = {
      totalOTBValue: {
        v1: version1.totalOTBValue,
        v2: version2.totalOTBValue,
        change: Number(version2.totalOTBValue) - Number(version1.totalOTBValue),
        changePercent:
          Number(version1.totalOTBValue) > 0
            ? ((Number(version2.totalOTBValue) - Number(version1.totalOTBValue)) /
                Number(version1.totalOTBValue)) *
              100
            : 0,
      },
      totalOTBUnits: {
        v1: version1.totalOTBUnits,
        v2: version2.totalOTBUnits,
        change: version2.totalOTBUnits - version1.totalOTBUnits,
        changePercent:
          version1.totalOTBUnits > 0
            ? ((version2.totalOTBUnits - version1.totalOTBUnits) /
                version1.totalOTBUnits) *
              100
            : 0,
      },
      versionType: {
        v1: version1.versionType,
        v2: version2.versionType,
      },
      status: {
        v1: version1.status,
        v2: version2.status,
      },
    };

    return {
      version1: {
        id: version1.id,
        versionNumber: version1.versionNumber,
        versionType: version1.versionType,
        status: version1.status,
        createdBy: version1.createdBy,
        createdAt: version1.createdAt,
      },
      version2: {
        id: version2.id,
        versionNumber: version2.versionNumber,
        versionType: version2.versionType,
        status: version2.status,
        createdBy: version2.createdBy,
        createdAt: version2.createdAt,
      },
      differences,
      changeCount: {
        v1: version1.changes.length,
        v2: version2.changes.length,
      },
    };
  }

  async getVersionTimeline(otbPlanId: string) {
    const versions = await this.prisma.oTBPlanVersion.findMany({
      where: { otbPlanId },
      orderBy: { versionNumber: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        changes: {
          take: 5,
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      versionType: v.versionType,
      status: v.status,
      totalOTBValue: v.totalOTBValue,
      totalOTBUnits: v.totalOTBUnits,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
      submittedBy: v.submittedBy,
      submittedAt: v.submittedAt,
      approvedBy: v.approvedBy,
      approvedAt: v.approvedAt,
      changeCount: v.changes.length,
      approvalComments: v.approvalComments,
    }));
  }
}
