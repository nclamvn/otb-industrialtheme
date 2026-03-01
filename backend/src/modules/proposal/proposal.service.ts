import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProposalStatus, ApprovalAction, Prisma } from '@prisma/client';
import { CreateProposalDto, UpdateProposalDto, AddProductDto, BulkAddProductsDto, UpdateProductDto, ApprovalDecisionDto } from './dto/proposal.dto';

interface ProposalFilters {
  budgetId?: string;
  planningVersionId?: string;
  status?: ProposalStatus;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ProposalService {
  constructor(private prisma: PrismaService) {}

  // ─── LIST ────────────────────────────────────────────────────────────────

  async findAll(filters: ProposalFilters) {
    const { budgetId, planningVersionId, status } = filters;
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.pageSize) || 20;

    const where: Prisma.ProposalWhereInput = {};
    if (budgetId) where.budgetId = budgetId;
    if (planningVersionId) where.planningVersionId = planningVersionId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        include: {
          budget: { include: { groupBrand: true } },
          planningVersion: { select: { id: true, planningCode: true, versionNumber: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { products: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ─── GET ONE ─────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        budget: { include: { groupBrand: true } },
        planningVersion: {
          include: {
            budgetDetail: { include: { store: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        products: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    // Query approvals separately (polymorphic pattern)
    const approvals = await this.prisma.approval.findMany({
      where: { entityType: 'proposal', entityId: id },
      include: { decider: { select: { id: true, name: true } } },
      orderBy: { decidedAt: 'desc' },
    });

    // Calculate summary by collection/category
    const summary = this.calculateSummary(proposal.products);

    return { ...proposal, approvals, summary };
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(dto: CreateProposalDto, userId: string) {
    // Validate budget exists and is approved
    const budget = await this.prisma.budget.findUnique({
      where: { id: dto.budgetId },
    });

    if (!budget) throw new BadRequestException('Budget not found');

    // R-PRP-01: Budget must be approved before creating proposals
    if (budget.status !== 'APPROVED') {
      throw new BadRequestException('Cannot create proposal for non-approved budget');
    }

    // Validate planning version if provided
    if (dto.planningVersionId) {
      const planning = await this.prisma.planningVersion.findUnique({
        where: { id: dto.planningVersionId },
        include: { budgetDetail: true },
      });

      if (!planning) throw new BadRequestException('Planning version not found');

      // R-PRP-02: Planning must belong to the same budget
      if (planning.budgetDetail.budgetId !== dto.budgetId) {
        throw new BadRequestException('Planning version does not belong to the specified budget');
      }
    }

    return this.prisma.proposal.create({
      data: {
        ticketName: dto.ticketName,
        budgetId: dto.budgetId,
        planningVersionId: dto.planningVersionId,
        createdById: userId,
      },
      include: {
        budget: { include: { groupBrand: true } },
        planningVersion: true,
      },
    });
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProposalDto, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    // R-PRP-03: Only DRAFT can be edited
    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ForbiddenException('Only draft proposals can be edited');
    }

    // Validate planning version if changing
    if (dto.planningVersionId) {
      const planning = await this.prisma.planningVersion.findUnique({
        where: { id: dto.planningVersionId },
        include: { budgetDetail: true },
      });

      if (!planning) throw new BadRequestException('Planning version not found');

      if (planning.budgetDetail.budgetId !== proposal.budgetId) {
        throw new BadRequestException('Planning version does not belong to the proposal budget');
      }
    }

    return this.prisma.proposal.update({
      where: { id },
      data: {
        ticketName: dto.ticketName,
        planningVersionId: dto.planningVersionId,
      },
      include: {
        budget: { include: { groupBrand: true } },
        planningVersion: true,
      },
    });
  }

  // ─── ADD PRODUCT ─────────────────────────────────────────────────────────

  async addProduct(proposalId: string, dto: AddProductDto, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ForbiddenException('Can only add products to draft proposals');
    }

    // Check if SKU already in proposal
    const existing = await this.prisma.proposalProduct.findFirst({
      where: { proposalId, skuId: dto.skuId },
    });

    if (existing) {
      throw new BadRequestException('SKU already exists in this proposal. Use update to change quantity.');
    }

    // Get SKU details
    const sku = await this.prisma.skuCatalog.findUnique({
      where: { id: dto.skuId },
      include: { brand: true },
    });

    if (!sku) throw new BadRequestException('SKU not found in catalog');

    // Parse productType to extract category/gender info (e.g., "W OUTERWEAR" → gender: Women, category: Outerwear)
    const [genderCode, ...categoryParts] = (sku.productType || '').split(' ');
    const gender = genderCode === 'W' ? 'Women' : genderCode === 'M' ? 'Men' : genderCode;
    const category = categoryParts.join(' ');

    // Use SRP as unit cost since unitCost doesn't exist
    const unitCost = Number(sku.srp);
    const totalValue = unitCost * dto.orderQty;

    // Get max sort order
    const lastProduct = await this.prisma.proposalProduct.findFirst({
      where: { proposalId },
      orderBy: { sortOrder: 'desc' },
    });

    const product = await this.prisma.proposalProduct.create({
      data: {
        proposalId,
        skuId: dto.skuId,
        skuCode: sku.skuCode,
        productName: sku.productName,
        collection: sku.brand?.name || null,
        gender,
        category,
        subCategory: null,
        theme: sku.theme,
        color: sku.color,
        composition: sku.composition,
        unitCost,
        srp: sku.srp,
        orderQty: dto.orderQty,
        totalValue,
        customerTarget: dto.customerTarget,
        imageUrl: sku.imageUrl,
        sortOrder: (lastProduct?.sortOrder || 0) + 1,
      },
    });

    // Update proposal totals
    await this.updateProposalTotals(proposalId);

    return product;
  }

  // ─── BULK ADD PRODUCTS ───────────────────────────────────────────────────

  async bulkAddProducts(proposalId: string, dto: BulkAddProductsDto, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ForbiddenException('Can only add products to draft proposals');
    }

    const results: Array<{ success: boolean; skuId: string; product?: any; error?: string }> = [];
    for (const productDto of dto.products) {
      try {
        const product = await this.addProduct(proposalId, productDto, userId);
        results.push({ success: true, skuId: productDto.skuId, product });
      } catch (error: any) {
        results.push({ success: false, skuId: productDto.skuId, error: error.message });
      }
    }

    return { results, proposal: await this.findOne(proposalId) };
  }

  // ─── UPDATE PRODUCT ──────────────────────────────────────────────────────

  async updateProduct(proposalId: string, productId: string, dto: UpdateProductDto, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ForbiddenException('Can only update products in draft proposals');
    }

    const product = await this.prisma.proposalProduct.findFirst({
      where: { id: productId, proposalId },
    });

    if (!product) throw new NotFoundException('Product not found in this proposal');

    const updateData: any = {};
    if (dto.orderQty !== undefined) {
      updateData.orderQty = dto.orderQty;
      updateData.totalValue = Number(product.unitCost) * dto.orderQty;
    }
    if (dto.customerTarget !== undefined) updateData.customerTarget = dto.customerTarget;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const updated = await this.prisma.proposalProduct.update({
      where: { id: productId },
      data: updateData,
    });

    // Update proposal totals
    await this.updateProposalTotals(proposalId);

    return updated;
  }

  // ─── REMOVE PRODUCT ──────────────────────────────────────────────────────

  async removeProduct(proposalId: string, productId: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ForbiddenException('Can only remove products from draft proposals');
    }

    const product = await this.prisma.proposalProduct.findFirst({
      where: { id: productId, proposalId },
    });

    if (!product) throw new NotFoundException('Product not found in this proposal');

    await this.prisma.proposalProduct.delete({ where: { id: productId } });

    // Update proposal totals
    await this.updateProposalTotals(proposalId);

    return { message: 'Product removed from proposal' };
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────────

  async submit(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit proposal with status: ${proposal.status}`);
    }

    // R-PRP-04: Must have at least one product
    if (proposal.products.length === 0) {
      throw new BadRequestException('Proposal must have at least one product');
    }

    return this.prisma.proposal.update({
      where: { id },
      data: { status: ProposalStatus.SUBMITTED },
      include: {
        budget: { include: { groupBrand: true } },
        _count: { select: { products: true } },
      },
    });
  }

  // ─── APPROVE LEVEL 1 ─────────────────────────────────────────────────────

  async approveLevel1(id: string, dto: ApprovalDecisionDto, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.SUBMITTED) {
      throw new BadRequestException(`Cannot approve proposal with status: ${proposal.status}`);
    }

    const newStatus = dto.action === 'APPROVED'
      ? ProposalStatus.LEVEL1_APPROVED
      : ProposalStatus.REJECTED;

    await this.prisma.approval.create({
      data: {
        entityType: 'proposal',
        entityId: id,
        level: 1,
        deciderId: userId,
        action: dto.action as ApprovalAction,
        comment: dto.comment,
      },
    });

    return this.prisma.proposal.update({
      where: { id },
      data: { status: newStatus },
      include: {
        budget: { include: { groupBrand: true } },
        _count: { select: { products: true } },
      },
    });
  }

  // ─── APPROVE LEVEL 2 ─────────────────────────────────────────────────────

  async approveLevel2(id: string, dto: ApprovalDecisionDto, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.LEVEL1_APPROVED) {
      throw new BadRequestException(`Cannot approve proposal with status: ${proposal.status}`);
    }

    const newStatus = dto.action === 'APPROVED'
      ? ProposalStatus.APPROVED
      : ProposalStatus.REJECTED;

    await this.prisma.approval.create({
      data: {
        entityType: 'proposal',
        entityId: id,
        level: 2,
        deciderId: userId,
        action: dto.action as ApprovalAction,
        comment: dto.comment,
      },
    });

    return this.prisma.proposal.update({
      where: { id },
      data: { status: newStatus },
      include: {
        budget: { include: { groupBrand: true } },
        _count: { select: { products: true } },
      },
    });
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  async remove(id: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ForbiddenException('Only draft proposals can be deleted');
    }

    return this.prisma.proposal.delete({ where: { id } });
  }

  // ─── STATISTICS ──────────────────────────────────────────────────────────

  async getStatistics(budgetId?: string) {
    const where: Prisma.ProposalWhereInput = budgetId ? { budgetId } : {};

    const [total, byStatus, totals] = await Promise.all([
      this.prisma.proposal.count({ where }),
      this.prisma.proposal.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.proposal.aggregate({
        where,
        _sum: {
          totalSkuCount: true,
          totalOrderQty: true,
          totalValue: true,
        },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus: statusMap,
      totals: {
        skuCount: totals._sum.totalSkuCount || 0,
        orderQty: totals._sum.totalOrderQty || 0,
        value: totals._sum.totalValue || 0,
      },
    };
  }

  // ─── SAVE FULL (atomic replace) ────────────────────────────────────────

  async saveFullProposal(id: string, body: { products: any[] }, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status !== ProposalStatus.DRAFT) {
      throw new ForbiddenException('Only draft proposals can be saved');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete all existing products (cascades to allocations)
      await tx.proposalProduct.deleteMany({ where: { proposalId: id } });

      // Re-create products from payload
      let sortOrder = 0;
      for (const p of body.products) {
        sortOrder++;
        const unitCost = Number(p.unitCost || p.srp) || 0;
        const orderQty = Number(p.orderQty || p.order) || 0;
        const totalValue = unitCost * orderQty;

        await tx.proposalProduct.create({
          data: {
            proposalId: id,
            skuId: p.skuId || null,
            skuCode: p.skuCode || p.sku || '',
            productName: p.productName || p.name || '',
            collection: p.collection || null,
            gender: p.gender || null,
            category: p.category || null,
            subCategory: p.subCategory || null,
            theme: p.theme || null,
            color: p.color || null,
            composition: p.composition || null,
            unitCost,
            srp: Number(p.srp) || unitCost,
            orderQty,
            totalValue,
            customerTarget: p.customerTarget || 'New',
            imageUrl: p.imageUrl || null,
            sortOrder,
          },
        });
      }

      // Update totals
      const products = await tx.proposalProduct.findMany({ where: { proposalId: id } });
      const totalSkuCount = products.length;
      const totalOrderQty = products.reduce((sum, pr) => sum + pr.orderQty, 0);
      const totalVal = products.reduce((sum, pr) => sum + Number(pr.totalValue), 0);

      return tx.proposal.update({
        where: { id },
        data: { totalSkuCount, totalOrderQty, totalValue: totalVal },
        include: {
          budget: { include: { groupBrand: true } },
          products: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  // ─── COPY ─────────────────────────────────────────────────────────────

  async copyProposal(id: string, userId: string) {
    const source = await this.prisma.proposal.findUnique({
      where: { id },
      include: { products: { include: { allocations: true } } },
    });

    if (!source) throw new NotFoundException('Proposal not found');

    return this.prisma.$transaction(async (tx) => {
      // Create new proposal as DRAFT
      const newProposal = await tx.proposal.create({
        data: {
          ticketName: `${source.ticketName || 'Proposal'} (copy)`,
          budgetId: source.budgetId,
          planningVersionId: source.planningVersionId,
          createdById: userId,
          totalSkuCount: source.totalSkuCount,
          totalOrderQty: source.totalOrderQty,
          totalValue: source.totalValue,
        },
      });

      // Clone products
      for (const prod of source.products) {
        const newProduct = await tx.proposalProduct.create({
          data: {
            proposalId: newProposal.id,
            skuId: prod.skuId,
            skuCode: prod.skuCode,
            productName: prod.productName,
            collection: prod.collection,
            gender: prod.gender,
            category: prod.category,
            subCategory: prod.subCategory,
            theme: prod.theme,
            color: prod.color,
            composition: prod.composition,
            unitCost: prod.unitCost,
            srp: prod.srp,
            orderQty: prod.orderQty,
            totalValue: prod.totalValue,
            customerTarget: prod.customerTarget,
            imageUrl: prod.imageUrl,
            sortOrder: prod.sortOrder,
          },
        });

        // Clone allocations
        for (const alloc of prod.allocations) {
          await tx.productAllocation.create({
            data: {
              proposalProductId: newProduct.id,
              storeId: alloc.storeId,
              quantity: alloc.quantity,
            },
          });
        }
      }

      return tx.proposal.findUnique({
        where: { id: newProposal.id },
        include: {
          budget: { include: { groupBrand: true } },
          products: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  // ─── HISTORICAL ───────────────────────────────────────────────────────

  async findHistorical(params: {
    fiscalYear: number;
    seasonGroupId: string;
    seasonType?: string;
    brandId?: string;
  }) {
    const { fiscalYear, seasonGroupId, seasonType, brandId } = params;

    // Find budgets from the previous year matching brand + season
    const budgetWhere: Prisma.BudgetWhereInput = {
      fiscalYear: fiscalYear - 1,
      seasonGroupId,
    };
    if (brandId) budgetWhere.groupBrandId = brandId;
    if (seasonType) budgetWhere.seasonType = seasonType;

    const budgets = await this.prisma.budget.findMany({
      where: budgetWhere,
      select: { id: true },
    });

    if (budgets.length === 0) return null;

    const budgetIds = budgets.map(b => b.id);

    // Find proposals matching these budgets, prefer APPROVED > DRAFT, newest
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        budgetId: { in: budgetIds },
      },
      include: {
        budget: { include: { groupBrand: true } },
        products: {
          include: { allocations: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [
        { status: 'asc' }, // APPROVED sorts before DRAFT alphabetically
        { createdAt: 'desc' },
      ],
    });

    return proposal;
  }

  // ─── HELPER: Update Proposal Totals ──────────────────────────────────────

  private async updateProposalTotals(proposalId: string) {
    const products = await this.prisma.proposalProduct.findMany({
      where: { proposalId },
    });

    const totalSkuCount = products.length;
    const totalOrderQty = products.reduce((sum, p) => sum + p.orderQty, 0);
    const totalValue = products.reduce((sum, p) => sum + Number(p.totalValue), 0);

    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { totalSkuCount, totalOrderQty, totalValue },
    });
  }

  // ─── SIZING: LIST ──────────────────────────────────────────────────────

  async getSizingsByProduct(productId: string) {
    const product = await this.prisma.proposalProduct.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.proposalSizing.findMany({
      where: { proposalProductId: productId },
      orderBy: [{ choiceVersion: 'asc' }, { sizeCode: 'asc' }],
    });
  }

  // ─── SIZING: SAVE (overwrite) ─────────────────────────────────────────

  async saveSizings(productId: string, sizings: any[]) {
    const product = await this.prisma.proposalProduct.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.$transaction(async (tx) => {
      // Delete all existing sizings
      await tx.proposalSizing.deleteMany({
        where: { proposalProductId: productId },
      });

      // Re-create from payload
      if (sizings && sizings.length > 0) {
        await tx.proposalSizing.createMany({
          data: sizings.map(s => ({
            proposalProductId: productId,
            choiceVersion: s.choiceVersion,
            isFinal: s.isFinal || false,
            sizeCode: s.sizeCode,
            quantity: s.quantity || 0,
          })),
        });
      }

      return tx.proposalSizing.findMany({
        where: { proposalProductId: productId },
        orderBy: [{ choiceVersion: 'asc' }, { sizeCode: 'asc' }],
      });
    });
  }

  // ─── HELPER: Calculate Summary by Dimension ──────────────────────────────

  private calculateSummary(products: any[]) {
    const byCollection: Record<string, { qty: number; value: number; count: number }> = {};
    const byCategory: Record<string, { qty: number; value: number; count: number }> = {};

    for (const p of products) {
      const collection = p.collection || 'Unknown';
      const category = p.category || 'Unknown';

      if (!byCollection[collection]) byCollection[collection] = { qty: 0, value: 0, count: 0 };
      byCollection[collection].qty += p.orderQty;
      byCollection[collection].value += Number(p.totalValue);
      byCollection[collection].count += 1;

      if (!byCategory[category]) byCategory[category] = { qty: 0, value: 0, count: 0 };
      byCategory[category].qty += p.orderQty;
      byCategory[category].value += Number(p.totalValue);
      byCategory[category].count += 1;
    }

    return { byCollection, byCategory };
  }
}
