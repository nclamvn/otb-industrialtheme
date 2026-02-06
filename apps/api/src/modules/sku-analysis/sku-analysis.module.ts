import { Module } from '@nestjs/common';
import { SKUAnalysisController } from './sku-analysis.controller';
import { SKUAnalysisService } from './sku-analysis.service';

@Module({
  controllers: [SKUAnalysisController],
  providers: [SKUAnalysisService],
  exports: [SKUAnalysisService],
})
export class SKUAnalysisModule {}
