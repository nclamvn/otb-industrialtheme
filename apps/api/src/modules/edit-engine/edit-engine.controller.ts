import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EditEngineService } from './edit-engine.service';
import {
  CreateEditDto,
  BulkEditDto,
  ApproveEditDto,
  RejectEditDto,
  QueryEditHistoryDto,
  UndoEditDto,
} from './dto/edit.dto';

@Controller('edit-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EditEngineController {
  constructor(private readonly editEngineService: EditEngineService) {}

  /**
   * Apply a single edit
   * POST /api/edit-engine/apply
   */
  @Post('apply')
  async applyEdit(
    @Body() dto: CreateEditDto,
    @CurrentUser() user: any,
  ) {
    return this.editEngineService.applyEdit(dto, user.id);
  }

  /**
   * Apply multiple edits in batch
   * POST /api/edit-engine/bulk
   */
  @Post('bulk')
  async applyBulkEdits(
    @Body() dto: BulkEditDto,
    @CurrentUser() user: any,
  ) {
    return this.editEngineService.applyBulkEdits(dto, user.id);
  }

  /**
   * Get edit history
   * GET /api/edit-engine/history
   */
  @Get('history')
  async getEditHistory(@Query() query: QueryEditHistoryDto) {
    return this.editEngineService.getEditHistory(query);
  }

  /**
   * Get entity timeline
   * GET /api/edit-engine/timeline/:entityType/:entityId
   */
  @Get('timeline/:entityType/:entityId')
  async getEntityTimeline(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.editEngineService.getEntityTimeline(entityType, entityId);
  }

  /**
   * Get pending edits for approval
   * GET /api/edit-engine/pending
   */
  @Get('pending')
  @Roles('ADMIN', 'FINANCE_HEAD', 'MERCHANDISE_LEAD', 'BRAND_MANAGER')
  async getPendingEdits(@CurrentUser() user: any) {
    return this.editEngineService.getPendingEdits(user.id);
  }

  /**
   * Approve a pending edit
   * PUT /api/edit-engine/approve
   */
  @Put('approve')
  @Roles('ADMIN', 'FINANCE_HEAD', 'MERCHANDISE_LEAD', 'BRAND_MANAGER')
  async approveEdit(
    @Body() dto: ApproveEditDto,
    @CurrentUser() user: any,
  ) {
    return this.editEngineService.approveEdit(dto, user.id);
  }

  /**
   * Reject a pending edit
   * PUT /api/edit-engine/reject
   */
  @Put('reject')
  @Roles('ADMIN', 'FINANCE_HEAD', 'MERCHANDISE_LEAD', 'BRAND_MANAGER')
  async rejectEdit(
    @Body() dto: RejectEditDto,
    @CurrentUser() user: any,
  ) {
    return this.editEngineService.rejectEdit(dto, user.id);
  }

  /**
   * Undo a previously applied edit
   * POST /api/edit-engine/undo
   */
  @Post('undo')
  async undoEdit(
    @Body() dto: UndoEditDto,
    @CurrentUser() user: any,
  ) {
    return this.editEngineService.undoEdit(dto, user.id);
  }
}
