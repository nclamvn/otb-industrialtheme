import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaService } from './media.service';
import {
  UploadMediaDto,
  UploadExternalMediaDto,
  UpdateMediaDto,
  QueryMediaDto,
  ReorderMediaDto,
  BulkUploadDto,
} from './dto/media.dto';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload a single image
   * POST /api/media/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
      }
    },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: any,
  ) {
    return this.mediaService.upload(file, dto, user.id);
  }

  /**
   * Upload from external URL
   * POST /api/media/upload-url
   */
  @Post('upload-url')
  async uploadFromUrl(
    @Body() dto: UploadExternalMediaDto,
    @CurrentUser() user: any,
  ) {
    return this.mediaService.uploadFromUrl(dto, user.id);
  }

  /**
   * Bulk upload multiple images
   * POST /api/media/bulk-upload
   */
  @Post('bulk-upload')
  @UseInterceptors(FilesInterceptor('files', 50, {
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    },
  }))
  async bulkUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: BulkUploadDto,
    @CurrentUser() user: any,
  ) {
    const skuItemIds = Array.isArray(dto.skuItemIds)
      ? dto.skuItemIds
      : JSON.parse(dto.skuItemIds as unknown as string);
    return this.mediaService.bulkUpload(files, skuItemIds, user.id);
  }

  /**
   * Get all media with filters
   * GET /api/media
   */
  @Get()
  async findAll(@Query() query: QueryMediaDto) {
    return this.mediaService.findAll(query);
  }

  /**
   * Get media statistics
   * GET /api/media/stats
   */
  @Get('stats')
  @Roles('ADMIN', 'MERCHANDISE_LEAD')
  async getStats() {
    return this.mediaService.getStats();
  }

  /**
   * Get media by ID
   * GET /api/media/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  /**
   * Get all media for a SKU
   * GET /api/media/sku/:skuItemId
   */
  @Get('sku/:skuItemId')
  async findBySku(@Param('skuItemId') skuItemId: string) {
    return this.mediaService.findBySku(skuItemId);
  }

  /**
   * Get primary media for a SKU
   * GET /api/media/sku/:skuItemId/primary
   */
  @Get('sku/:skuItemId/primary')
  async getPrimaryMedia(@Param('skuItemId') skuItemId: string) {
    return this.mediaService.getPrimaryMedia(skuItemId);
  }

  /**
   * Update media metadata
   * PUT /api/media/:id
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  /**
   * Reorder media for a SKU
   * PUT /api/media/sku/:skuItemId/reorder
   */
  @Put('sku/:skuItemId/reorder')
  async reorder(
    @Param('skuItemId') skuItemId: string,
    @Body() dto: ReorderMediaDto,
  ) {
    return this.mediaService.reorder(skuItemId, dto);
  }

  /**
   * Archive media (soft delete)
   * DELETE /api/media/:id/archive
   */
  @Delete(':id/archive')
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id') id: string) {
    return this.mediaService.archive(id);
  }

  /**
   * Permanently delete media
   * DELETE /api/media/:id
   */
  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.mediaService.delete(id);
  }
}
