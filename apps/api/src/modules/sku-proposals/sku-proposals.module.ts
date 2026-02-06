import { Module } from '@nestjs/common';
import { SkuProposalsController } from './sku-proposals.controller';
import { SkuProposalsService } from './sku-proposals.service';

@Module({
  controllers: [SkuProposalsController],
  providers: [SkuProposalsService],
  exports: [SkuProposalsService],
})
export class SkuProposalsModule {}
