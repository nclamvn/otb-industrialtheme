import { Module } from '@nestjs/common';
import { WSSIController } from './wssi.controller';
import { WSSIService } from './wssi.service';

@Module({
  controllers: [WSSIController],
  providers: [WSSIService],
  exports: [WSSIService],
})
export class WSSIModule {}
