import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OtbPlansService } from './otb-plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('otb-plans')
@ApiBearerAuth()
@Controller('otb-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OtbPlansController {
  constructor(private readonly otbPlansService: OtbPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all OTB plans' })
  findAll(@Query() query: any) {
    return this.otbPlansService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get OTB plan by ID' })
  findOne(@Param('id') id: string) {
    return this.otbPlansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new OTB plan' })
  create(@Body() data: any, @CurrentUser() user: CurrentUserPayload) {
    return this.otbPlansService.create(data, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update OTB plan' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.otbPlansService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete OTB plan' })
  remove(@Param('id') id: string) {
    return this.otbPlansService.remove(id);
  }

  @Post(':id/submit')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Submit OTB plan for approval' })
  submit(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.otbPlansService.submit(id, user.id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Approve OTB plan' })
  approve(
    @Param('id') id: string,
    @Body() data: { comments?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.otbPlansService.approve(id, user.id, data.comments);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Reject OTB plan' })
  reject(
    @Param('id') id: string,
    @Body() data: { reason: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.otbPlansService.reject(id, user.id, data.reason);
  }

  @Get(':id/sizing')
  @ApiOperation({ summary: 'Get sizing data for OTB plan' })
  getSizing(@Param('id') id: string) {
    return this.otbPlansService.getSizing(id);
  }

  @Post(':id/sizing')
  @ApiOperation({ summary: 'Save sizing data for OTB plan' })
  saveSizing(
    @Param('id') id: string,
    @Body() data: { categoryId: string; gender: string; sizeData: Record<string, number> },
  ) {
    return this.otbPlansService.saveSizing(id, data);
  }

  @Post(':id/ai-proposal')
  @ApiOperation({ summary: 'Generate AI proposal for OTB plan' })
  generateAIProposal(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.otbPlansService.generateAIProposal(id, user.id);
  }
}
