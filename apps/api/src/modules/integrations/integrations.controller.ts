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
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ============================================
  // API KEYS
  // ============================================

  @Get('api-keys')
  @ApiOperation({ summary: 'Get all API keys' })
  getApiKeys(@CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.getApiKeys(user.id);
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Create new API key' })
  createApiKey(
    @Body() data: { name: string; scopes: string[]; rateLimit?: number; expiresAt?: Date },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.createApiKey(data, user.id);
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Delete API key' })
  deleteApiKey(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.deleteApiKey(id, user.id);
  }

  @Patch('api-keys/:id/toggle')
  @ApiOperation({ summary: 'Enable/disable API key' })
  toggleApiKey(
    @Param('id') id: string,
    @Body() data: { isEnabled: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.toggleApiKey(id, user.id, data.isEnabled);
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  @Get('webhooks')
  @ApiOperation({ summary: 'Get all webhooks' })
  getWebhooks(@CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.getWebhooks(user.id);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create new webhook' })
  createWebhook(
    @Body() data: { name: string; url: string; events: string[]; headers?: Record<string, string> },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.createWebhook(data, user.id);
  }

  @Patch('webhooks/:id')
  @ApiOperation({ summary: 'Update webhook' })
  updateWebhook(
    @Param('id') id: string,
    @Body() data: { name?: string; url?: string; events?: string[]; isEnabled?: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.updateWebhook(id, data, user.id);
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Delete webhook' })
  deleteWebhook(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.deleteWebhook(id, user.id);
  }

  @Post('webhooks/:id/test')
  @ApiOperation({ summary: 'Test webhook' })
  testWebhook(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.testWebhook(id, user.id);
  }

  // ============================================
  // ERP CONNECTIONS
  // ============================================

  @Get('integrations/erp')
  @Roles('ADMIN', 'FINANCE_HEAD')
  @ApiOperation({ summary: 'Get all ERP connections' })
  getERPConnections() {
    return this.integrationsService.getERPConnections();
  }

  @Get('integrations/erp/:id')
  @Roles('ADMIN', 'FINANCE_HEAD')
  @ApiOperation({ summary: 'Get ERP connection by ID' })
  getERPConnection(@Param('id') id: string) {
    return this.integrationsService.getERPConnection(id);
  }

  @Post('integrations/erp')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new ERP connection' })
  createERPConnection(@Body() data: {
    name: string;
    type: string;
    host: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  }) {
    return this.integrationsService.createERPConnection(data);
  }

  @Patch('integrations/erp/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update ERP connection' })
  updateERPConnection(@Param('id') id: string, @Body() data: any) {
    return this.integrationsService.updateERPConnection(id, data);
  }

  @Delete('integrations/erp/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete ERP connection' })
  deleteERPConnection(@Param('id') id: string) {
    return this.integrationsService.deleteERPConnection(id);
  }

  @Get('integrations/erp/:id/mappings')
  @Roles('ADMIN', 'FINANCE_HEAD')
  @ApiOperation({ summary: 'Get ERP field mappings' })
  getERPMappings(@Param('id') id: string) {
    return this.integrationsService.getERPMappings(id);
  }

  @Post('integrations/erp/:id/mappings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Save ERP field mappings' })
  saveERPMappings(@Param('id') id: string, @Body() data: { mappings: any[] }) {
    return this.integrationsService.saveERPMappings(id, data.mappings);
  }

  @Post('integrations/erp/:id/sync')
  @Roles('ADMIN', 'FINANCE_HEAD')
  @ApiOperation({ summary: 'Trigger ERP sync' })
  syncERP(
    @Param('id') id: string,
    @Body() data: { entityType: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.syncERP(id, data.entityType, user.id);
  }

  // ============================================
  // FILE STORAGE (S3)
  // ============================================

  @Post('integrations/s3/presign')
  @ApiOperation({ summary: 'Get presigned URL for upload' })
  getPresignedUrl(
    @Body() data: { filename: string; contentType: string; category: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.getPresignedUrl(data, user.id);
  }

  @Get('integrations/s3/files')
  @ApiOperation({ summary: 'Get uploaded files' })
  getFiles(
    @Query() query: { category?: string; entityType?: string; entityId?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.getFiles(query, user.id);
  }

  @Post('integrations/s3/files')
  @ApiOperation({ summary: 'Register uploaded file' })
  registerFile(
    @Body() data: {
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      key: string;
      bucket: string;
      category: string;
      entityType?: string;
      entityId?: string;
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.integrationsService.registerFile(data, user.id);
  }
}
