import { Module } from '@nestjs/common';
import { CarryForwardController } from './carry-forward.controller';
import { CarryForwardService } from './carry-forward.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CarryForwardController],
  providers: [CarryForwardService],
  exports: [CarryForwardService],
})
export class CarryForwardModule {}
