import { Module } from '@nestjs/common';
import { PowerBIController } from './powerbi.controller';
import { PowerBIService } from './powerbi.service';

@Module({
  controllers: [PowerBIController],
  providers: [PowerBIService],
  exports: [PowerBIService],
})
export class PowerBIModule {}
