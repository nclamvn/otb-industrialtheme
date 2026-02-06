import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PowerBIService } from './powerbi.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  PowerBIReportType,
  EmbedTokenRequestDto,
  CreatePowerBIReportDto,
  UpdatePowerBIReportDto,
} from './dto/powerbi.dto';

@ApiTags('powerbi')
@ApiBearerAuth()
@Controller('powerbi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PowerBIController {
  constructor(private readonly powerbiService: PowerBIService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get Power BI configuration status' })
  getConfig() {
    return this.powerbiService.getConfig();
  }

  @Get('reports')
  @ApiOperation({ summary: 'List all registered Power BI reports' })
  @ApiQuery({ name: 'type', required: false, enum: PowerBIReportType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAllReports(
    @Query('type') type?: PowerBIReportType,
    @Query('isActive') isActive?: string,
  ) {
    return this.powerbiService.findAllReports({
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get a specific report by ID' })
  findOneReport(@Param('id') id: string) {
    return this.powerbiService.findOneReport(id);
  }

  @Post('reports')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Register a new Power BI report' })
  createReport(@Body() dto: CreatePowerBIReportDto) {
    return this.powerbiService.createReport(dto);
  }

  @Put('reports/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a registered report' })
  updateReport(@Param('id') id: string, @Body() dto: UpdatePowerBIReportDto) {
    return this.powerbiService.updateReport(id, dto);
  }

  @Delete('reports/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a registered report' })
  deleteReport(@Param('id') id: string) {
    return this.powerbiService.deleteReport(id);
  }

  @Post('embed-token')
  @ApiOperation({ summary: 'Generate embed token for a Power BI report' })
  generateEmbedToken(
    @Body() dto: EmbedTokenRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.powerbiService.generateEmbedToken(dto, user.id);
  }

  @Get('workspace/reports')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List reports from Power BI workspace' })
  @ApiQuery({ name: 'groupId', required: false })
  listWorkspaceReports(@Query('groupId') groupId?: string) {
    return this.powerbiService.listWorkspaceReports(groupId);
  }

  @Post('datasets/:datasetId/refresh')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Trigger dataset refresh in Power BI' })
  @ApiQuery({ name: 'groupId', required: false })
  refreshDataset(
    @Param('datasetId') datasetId: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.powerbiService.refreshDataset(datasetId, groupId);
  }
}
