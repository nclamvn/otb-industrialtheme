import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VersionsService } from './versions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateVersionDto,
  UpdateVersionDto,
  SubmitVersionDto,
  ApproveVersionDto,
  RejectVersionDto,
  RecordChangeDto,
} from './dto/create-version.dto';

@ApiTags('versions')
@ApiBearerAuth()
@Controller('versions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all OTB plan versions' })
  findAll(@Query() query: any) {
    return this.versionsService.findAll(query);
  }

  @Get('timeline/:otbPlanId')
  @ApiOperation({ summary: 'Get version timeline for an OTB plan' })
  getTimeline(@Param('otbPlanId') otbPlanId: string) {
    return this.versionsService.getVersionTimeline(otbPlanId);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two versions' })
  compare(
    @Query('v1') versionId1: string,
    @Query('v2') versionId2: string,
  ) {
    return this.versionsService.compareVersions(versionId1, versionId2);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get version by ID' })
  findOne(@Param('id') id: string) {
    return this.versionsService.findOne(id);
  }

  @Get(':id/changes')
  @ApiOperation({ summary: 'Get changes for a version' })
  getChanges(@Param('id') id: string) {
    return this.versionsService.getChanges(id);
  }

  @Post()
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Create new version' })
  create(@Body() dto: CreateVersionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.versionsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Update version' })
  update(@Param('id') id: string, @Body() dto: UpdateVersionDto) {
    return this.versionsService.update(id, dto);
  }

  @Post(':id/submit')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Submit version for approval' })
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.submit(id, user.id, dto.comments);
  }

  @Post(':id/review')
  @Roles('ADMIN', 'FINANCE_HEAD')
  @ApiOperation({ summary: 'Mark version as under review' })
  review(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.versionsService.review(id, user.id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Approve version' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.approve(id, user.id, dto.comments);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BOD_MEMBER')
  @ApiOperation({ summary: 'Reject version' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.versionsService.reject(id, user.id, dto.reason);
  }

  @Post(':id/changes')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER')
  @ApiOperation({ summary: 'Record a change for the version' })
  recordChange(@Param('id') id: string, @Body() dto: RecordChangeDto) {
    return this.versionsService.recordChange(id, dto);
  }
}
