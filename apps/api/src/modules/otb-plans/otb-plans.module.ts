import { Module } from '@nestjs/common';
import { OtbPlansController } from './otb-plans.controller';
import { OtbPlansService } from './otb-plans.service';

@Module({
  controllers: [OtbPlansController],
  providers: [OtbPlansService],
  exports: [OtbPlansService],
})
export class OtbPlansModule {}
