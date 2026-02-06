import { Module } from '@nestjs/common';
import { ClearanceController } from './clearance.controller';
import { ClearanceService } from './clearance.service';
import { ClearanceOptimizerService } from './clearance-optimizer.service';

@Module({
  controllers: [ClearanceController],
  providers: [ClearanceService, ClearanceOptimizerService],
  exports: [ClearanceService, ClearanceOptimizerService],
})
export class ClearanceModule {}
