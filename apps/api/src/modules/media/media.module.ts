import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { ImageProcessingService } from './image-processing.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: multer.memoryStorage(), // Use memory storage for processing
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
        files: 50, // Max 50 files per request
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, ImageProcessingService],
  exports: [MediaService, ImageProcessingService],
})
export class MediaModule {}
