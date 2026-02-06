import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('workflows')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get('approvals')
  @ApiOperation({ summary: 'Get all pending/completed approvals' })
  getApprovals(@Query() query: { type?: string; status?: string; page?: number; limit?: number }) {
    return this.workflowsService.getApprovals(query);
  }

  @Get('approvals/mine')
  @ApiOperation({ summary: 'Get my pending approvals' })
  getMyPendingApprovals(@CurrentUser() user: CurrentUserPayload) {
    return this.workflowsService.getMyPendingApprovals(user.id, user.role);
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  getWorkflow(@Param('id') id: string) {
    return this.workflowsService.getWorkflow(id);
  }

  @Post('workflows/:id/approve')
  @ApiOperation({ summary: 'Approve current workflow step' })
  approveWorkflow(
    @Param('id') id: string,
    @Body() data: { comment?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.workflowsService.actionWorkflowStep(id, user.id, 'APPROVE', data.comment);
  }

  @Post('workflows/:id/reject')
  @ApiOperation({ summary: 'Reject current workflow step' })
  rejectWorkflow(
    @Param('id') id: string,
    @Body() data: { comment: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.workflowsService.actionWorkflowStep(id, user.id, 'REJECT', data.comment);
  }
}
