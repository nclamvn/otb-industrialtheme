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
import { SkuProposalsService } from './sku-proposals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('sku-proposals')
@ApiBearerAuth()
@Controller('sku-proposals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkuProposalsController {
  constructor(private readonly skuProposalsService: SkuProposalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all SKU proposals' })
  findAll(@Query() query: any) {
    return this.skuProposalsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SKU proposal by ID' })
  findOne(@Param('id') id: string) {
    return this.skuProposalsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new SKU proposal' })
  create(@Body() data: any, @CurrentUser() user: CurrentUserPayload) {
    return this.skuProposalsService.create(data, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update SKU proposal' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.skuProposalsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete SKU proposal' })
  remove(@Param('id') id: string) {
    return this.skuProposalsService.remove(id);
  }

  @Post(':id/submit')
  @Roles('ADMIN', 'BRAND_MANAGER', 'BRAND_PLANNER', 'MERCHANDISE_LEAD')
  @ApiOperation({ summary: 'Submit SKU proposal for approval' })
  submit(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.skuProposalsService.submit(id, user.id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER', 'MERCHANDISE_LEAD')
  @ApiOperation({ summary: 'Approve SKU proposal' })
  approve(
    @Param('id') id: string,
    @Body() data: { comments?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.skuProposalsService.approve(id, user.id, data.comments);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'FINANCE_HEAD', 'BRAND_MANAGER', 'MERCHANDISE_LEAD')
  @ApiOperation({ summary: 'Reject SKU proposal' })
  reject(
    @Param('id') id: string,
    @Body() data: { reason: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.skuProposalsService.reject(id, user.id, data.reason);
  }

  @Post(':id/import')
  @ApiOperation({ summary: 'Import SKU items from Excel data' })
  importItems(
    @Param('id') id: string,
    @Body() data: { items: any[] },
  ) {
    return this.skuProposalsService.importItems(id, data.items);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate all SKU items in proposal' })
  validateItems(@Param('id') id: string) {
    return this.skuProposalsService.validateItems(id);
  }

  @Post(':id/enrich')
  @ApiOperation({ summary: 'Enrich SKU items with AI predictions' })
  enrichItems(
    @Param('id') id: string,
    @Body() data: { itemIds?: string[] },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.skuProposalsService.enrichItems(id, user.id, data.itemIds);
  }
}
