import { Module } from '@nestjs/common';
import { StorePerformanceController } from './store-performance.controller';
import { StorePerformanceService } from './store-performance.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StorePerformanceController],
  providers: [StorePerformanceService],
  exports: [StorePerformanceService],
})
export class StorePerformanceModule {}
