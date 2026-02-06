import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEditDto,
  BulkEditDto,
  ApproveEditDto,
  RejectEditDto,
  QueryEditHistoryDto,
  UndoEditDto,
  EditResult,
  EditStatus,
  CascadeInfo,
  EditPermissionCheck,
  CASCADE_RULES,
  AUTO_APPROVE_LIMITS,
} from './dto/edit.dto';

@Injectable()
export class EditEngineService {
  private readonly logger = new Logger(EditEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Apply a single edit with cascade calculations
   */
  async applyEdit(dto: CreateEditDto, userId: string): Promise<EditResult> {
    const fieldKey = `${dto.entityType}.${dto.fieldName}`;

    // Check permissions
    const permissionCheck = await this.checkEditPermission(
      userId,
      dto.entityType,
      dto.fieldName
    );

    if (!permissionCheck.canEdit) {
      throw new ForbiddenException(permissionCheck.lockReason || 'Edit not allowed');
    }

    // Calculate variance
    const variance = this.calculateVariance(dto);

    // Determine if auto-approve applies
    const shouldAutoApprove = this.shouldAutoApprove(fieldKey, variance, permissionCheck);

    // Calculate cascade effects
    const cascadeInfo = await this.calculateCascade(dto);

    // Create edit history record
    const editHistory = await this.prisma.editHistory.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        fieldName: dto.fieldName,
        fieldType: dto.fieldType,
        fieldLabel: dto.fieldLabel,
        oldValue: dto.oldValue,
        newValue: dto.newValue,
        oldValueJson: dto.oldValueJson,
        newValueJson: dto.newValueJson,
        varianceAmount: variance.amount,
        variancePct: variance.percent,
        cascadeInfo: cascadeInfo ? JSON.parse(JSON.stringify(cascadeInfo)) : undefined,
        status: shouldAutoApprove ? 'AUTO_APPROVED' : permissionCheck.requiresApproval ? 'PENDING' : 'AUTO_APPROVED',
        requiresApproval: permissionCheck.requiresApproval && !shouldAutoApprove,
        editReason: dto.editReason,
        editSource: dto.editSource || 'manual',
        sessionId: dto.sessionId,
        editedById: userId,
      },
    });

    // If auto-approved, apply the change immediately
    if (editHistory.status === 'AUTO_APPROVED') {
      await this.applyChangeToEntity(dto);

      // Apply cascade changes
      if (cascadeInfo && cascadeInfo.affectedFields.length > 0) {
        await this.applyCascadeChanges(cascadeInfo, userId, dto.sessionId);
      }
    }

    return {
      success: true,
      editId: editHistory.id,
      status: editHistory.status as EditStatus,
      requiresApproval: editHistory.requiresApproval,
      cascadeInfo: cascadeInfo || undefined,
    };
  }

  /**
   * Apply multiple edits in a batch
   */
  async applyBulkEdits(dto: BulkEditDto, userId: string): Promise<EditResult[]> {
    const sessionId = dto.sessionId || this.generateSessionId();
    const results: EditResult[] = [];

    for (const edit of dto.edits) {
      try {
        const result = await this.applyEdit(
          { ...edit, sessionId, editReason: dto.editReason || edit.editReason },
          userId
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          editId: '',
          status: EditStatus.PENDING,
          requiresApproval: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Approve a pending edit
   */
  async approveEdit(dto: ApproveEditDto, approverId: string): Promise<EditResult> {
    const edit = await this.prisma.editHistory.findUnique({
      where: { id: dto.editId },
    });

    if (!edit) {
      throw new NotFoundException('Edit not found');
    }

    if (edit.status !== 'PENDING') {
      throw new BadRequestException('Edit is not pending approval');
    }

    // Update edit status
    await this.prisma.editHistory.update({
      where: { id: dto.editId },
      data: {
        status: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
        approvalReason: dto.approvalReason,
      },
    });

    // Apply the change to entity
    await this.applyChangeToEntity({
      entityType: edit.entityType,
      entityId: edit.entityId,
      fieldName: edit.fieldName,
      fieldType: edit.fieldType as any,
      newValue: edit.newValue ?? undefined,
      newValueJson: edit.newValueJson as any,
    });

    // Apply cascade changes
    if (edit.cascadeInfo) {
      await this.applyCascadeChanges(
        edit.cascadeInfo as unknown as CascadeInfo,
        approverId,
        edit.sessionId ?? undefined
      );
    }

    return {
      success: true,
      editId: dto.editId,
      status: EditStatus.APPROVED,
      requiresApproval: false,
    };
  }

  /**
   * Reject a pending edit
   */
  async rejectEdit(dto: RejectEditDto, rejecterId: string): Promise<EditResult> {
    const edit = await this.prisma.editHistory.findUnique({
      where: { id: dto.editId },
    });

    if (!edit) {
      throw new NotFoundException('Edit not found');
    }

    if (edit.status !== 'PENDING') {
      throw new BadRequestException('Edit is not pending approval');
    }

    await this.prisma.editHistory.update({
      where: { id: dto.editId },
      data: {
        status: 'REJECTED',
        rejectedById: rejecterId,
        rejectedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    return {
      success: true,
      editId: dto.editId,
      status: EditStatus.REJECTED,
      requiresApproval: false,
    };
  }

  /**
   * Undo a previously applied edit
   */
  async undoEdit(dto: UndoEditDto, userId: string): Promise<EditResult> {
    const edit = await this.prisma.editHistory.findUnique({
      where: { id: dto.editId },
    });

    if (!edit) {
      throw new NotFoundException('Edit not found');
    }

    if (edit.status !== 'APPROVED' && edit.status !== 'AUTO_APPROVED') {
      throw new BadRequestException('Can only undo approved edits');
    }

    // Create a reversal edit
    const reversalDto: CreateEditDto = {
      entityType: edit.entityType,
      entityId: edit.entityId,
      fieldName: edit.fieldName,
      fieldType: edit.fieldType as any,
      oldValue: edit.newValue ?? undefined,
      newValue: edit.oldValue ?? undefined,
      oldValueJson: edit.newValueJson as any,
      newValueJson: edit.oldValueJson as any,
      editReason: `Undo: ${dto.reason || 'No reason provided'}`,
      editSource: 'undo',
    };

    return this.applyEdit(reversalDto, userId);
  }

  /**
   * Get edit history with filters
   */
  async getEditHistory(query: QueryEditHistoryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.fieldName) where.fieldName = query.fieldName;
    if (query.editedById) where.editedById = query.editedById;
    if (query.status) where.status = query.status;
    if (query.sessionId) where.sessionId = query.sessionId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.editHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          editedBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true } },
          rejectedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.editHistory.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get pending edits for approval
   */
  async getPendingEdits(approverId: string) {
    // Get user role for permission check
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { role: true },
    });

    if (!approver) {
      throw new NotFoundException('Approver not found');
    }

    return this.prisma.editHistory.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        editedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Get entity edit timeline
   */
  async getEntityTimeline(entityType: string, entityId: string) {
    return this.prisma.editHistory.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        editedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Check edit permission for a user
   */
  private async checkEditPermission(
    userId: string,
    entityType: string,
    fieldName: string
  ): Promise<EditPermissionCheck> {
    // Get user role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return { canEdit: false, requiresApproval: false, lockReason: 'User not found' };
    }

    // Check edit permissions
    const permission = await this.prisma.editPermission.findFirst({
      where: {
        OR: [
          { roleId: user.role },
          { userId: userId },
        ],
        entityType: entityType,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    if (!permission) {
      // Default: allow edit with approval for managers
      const managerRoles = ['ADMIN', 'FINANCE_HEAD', 'MERCHANDISE_LEAD'];
      const isManager = managerRoles.includes(user.role);

      return {
        canEdit: true,
        requiresApproval: !isManager,
        autoApproveLimit: isManager ? undefined : 0,
      };
    }

    // Check field pattern match
    const fieldPatterns = permission.fieldPattern.split(',').map(p => p.trim());
    const matchesField = fieldPatterns.some(pattern => {
      if (pattern === '*') return true;
      if (pattern.endsWith('*')) {
        return fieldName.startsWith(pattern.slice(0, -1));
      }
      return fieldName === pattern;
    });

    if (!matchesField) {
      return { canEdit: false, requiresApproval: false, lockReason: 'Field not editable' };
    }

    return {
      canEdit: permission.canEdit,
      requiresApproval: !permission.canApprove,
      autoApproveLimit: permission.autoApproveLimit?.toNumber(),
      autoApprovePctLimit: permission.autoApprovePctLimit?.toNumber(),
    };
  }

  /**
   * Calculate variance between old and new values
   */
  private calculateVariance(dto: CreateEditDto): { amount: number; percent: number } {
    if (dto.fieldType !== 'NUMBER' && dto.fieldType !== 'DECIMAL') {
      return { amount: 0, percent: 0 };
    }

    const oldVal = parseFloat(dto.oldValue || '0');
    const newVal = parseFloat(dto.newValue || '0');
    const amount = newVal - oldVal;
    const percent = oldVal !== 0 ? ((newVal - oldVal) / oldVal) * 100 : 0;

    return { amount, percent };
  }

  /**
   * Determine if edit should be auto-approved
   */
  private shouldAutoApprove(
    fieldKey: string,
    variance: { amount: number; percent: number },
    permission: EditPermissionCheck
  ): boolean {
    // Check global auto-approve limits
    const globalLimit = AUTO_APPROVE_LIMITS[fieldKey];
    if (globalLimit) {
      if (globalLimit.percent && Math.abs(variance.percent) > globalLimit.percent) {
        return false;
      }
      if (globalLimit.value && Math.abs(variance.amount) > globalLimit.value) {
        return false;
      }
    }

    // Check user-specific limits
    if (permission.autoApprovePctLimit && Math.abs(variance.percent) > permission.autoApprovePctLimit) {
      return false;
    }
    if (permission.autoApproveLimit && Math.abs(variance.amount) > permission.autoApproveLimit) {
      return false;
    }

    return !permission.requiresApproval;
  }

  /**
   * Calculate cascade effects of an edit
   */
  private async calculateCascade(dto: CreateEditDto): Promise<CascadeInfo | null> {
    const fieldKey = `${dto.entityType}.${dto.fieldName}`;
    const cascadeFields = CASCADE_RULES[fieldKey];

    if (!cascadeFields || cascadeFields.length === 0) {
      return null;
    }

    const affectedFields: CascadeInfo['affectedFields'] = [];
    const recalculations: CascadeInfo['recalculations'] = [];

    for (const targetField of cascadeFields) {
      const [targetEntity, targetFieldName] = targetField.split('.');

      // Calculate the new value based on the formula
      const calculation = await this.performRecalculation(
        dto.entityType,
        dto.entityId,
        targetEntity,
        targetFieldName,
        dto.fieldName,
        dto.newValue
      );

      if (calculation) {
        affectedFields.push({
          entityType: targetEntity,
          entityId: calculation.entityId,
          fieldName: targetFieldName,
          oldValue: calculation.oldValue,
          newValue: calculation.newValue,
        });

        recalculations.push({
          field: targetField,
          formula: calculation.formula,
          result: calculation.newValue,
        });
      }
    }

    return affectedFields.length > 0 ? { affectedFields, recalculations } : null;
  }

  /**
   * Perform recalculation for cascade effect
   */
  private async performRecalculation(
    sourceEntity: string,
    sourceId: string,
    targetEntity: string,
    targetField: string,
    changedField: string,
    newValue: string | null | undefined
  ): Promise<{ entityId: string; oldValue: any; newValue: any; formula: string } | null> {
    // Example: SKUItem margin recalculation
    if (sourceEntity === 'SKUItem' && targetField === 'margin') {
      const sku = await this.prisma.sKUItem.findUnique({
        where: { id: sourceId },
        select: { retailPrice: true, costPrice: true },
      });

      if (sku) {
        const retailPrice = changedField === 'retailPrice'
          ? parseFloat(newValue || '0')
          : sku.retailPrice.toNumber();
        const costPrice = changedField === 'costPrice'
          ? parseFloat(newValue || '0')
          : sku.costPrice.toNumber();

        const oldMargin = sku.retailPrice.toNumber() > 0
          ? ((sku.retailPrice.toNumber() - sku.costPrice.toNumber()) / sku.retailPrice.toNumber()) * 100
          : 0;

        const newMargin = retailPrice > 0
          ? ((retailPrice - costPrice) / retailPrice) * 100
          : 0;

        return {
          entityId: sourceId,
          oldValue: oldMargin.toFixed(2),
          newValue: newMargin.toFixed(2),
          formula: '((retailPrice - costPrice) / retailPrice) * 100',
        };
      }
    }

    // Add more recalculation logic for other fields...

    return null;
  }

  /**
   * Apply the change to the actual entity
   */
  private async applyChangeToEntity(dto: Partial<CreateEditDto>): Promise<void> {
    if (!dto.entityType || !dto.entityId || !dto.fieldName) return;

    const value = dto.newValueJson || dto.newValue;

    // Map entity types to Prisma models
    switch (dto.entityType) {
      case 'SKUItem':
        await this.prisma.sKUItem.update({
          where: { id: dto.entityId },
          data: { [dto.fieldName]: this.parseValue(value, dto.fieldType) },
        });
        break;
      case 'OTBPlan':
        await this.prisma.oTBPlan.update({
          where: { id: dto.entityId },
          data: { [dto.fieldName]: this.parseValue(value, dto.fieldType) },
        });
        break;
      case 'OTBLineItem':
        await this.prisma.oTBLineItem.update({
          where: { id: dto.entityId },
          data: { [dto.fieldName]: this.parseValue(value, dto.fieldType) },
        });
        break;
      case 'BudgetAllocation':
        await this.prisma.budgetAllocation.update({
          where: { id: dto.entityId },
          data: { [dto.fieldName]: this.parseValue(value, dto.fieldType) },
        });
        break;
      default:
        this.logger.warn(`Unknown entity type: ${dto.entityType}`);
    }
  }

  /**
   * Apply cascade changes
   */
  private async applyCascadeChanges(
    cascadeInfo: CascadeInfo,
    userId: string,
    sessionId?: string | null
  ): Promise<void> {
    for (const affected of cascadeInfo.affectedFields) {
      await this.applyChangeToEntity({
        entityType: affected.entityType,
        entityId: affected.entityId,
        fieldName: affected.fieldName,
        newValue: String(affected.newValue),
      });

      // Log cascade changes in edit history
      await this.prisma.editHistory.create({
        data: {
          entityType: affected.entityType,
          entityId: affected.entityId,
          fieldName: affected.fieldName,
          fieldType: 'DECIMAL',
          oldValue: String(affected.oldValue),
          newValue: String(affected.newValue),
          status: 'AUTO_APPROVED',
          requiresApproval: false,
          editSource: 'cascade',
          sessionId: sessionId,
          editedById: userId,
        },
      });
    }
  }

  /**
   * Parse value based on field type
   */
  private parseValue(value: any, fieldType?: string): any {
    if (value === null || value === undefined) return null;

    switch (fieldType) {
      case 'NUMBER':
        return parseInt(value, 10);
      case 'DECIMAL':
        return parseFloat(value);
      case 'BOOLEAN':
        return value === true || value === 'true';
      case 'DATE':
        return new Date(value);
      case 'JSON':
        return typeof value === 'string' ? JSON.parse(value) : value;
      default:
        return value;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
