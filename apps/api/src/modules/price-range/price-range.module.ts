import { Module } from '@nestjs/common';
import { PriceRangeController } from './price-range.controller';
import { PriceRangeService } from './price-range.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PriceRangeController],
  providers: [PriceRangeService],
  exports: [PriceRangeService],
})
export class PriceRangeModule {}
