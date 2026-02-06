import { Module } from '@nestjs/common';
import { EditEngineController } from './edit-engine.controller';
import { EditEngineService } from './edit-engine.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EditEngineController],
  providers: [EditEngineService],
  exports: [EditEngineService],
})
export class EditEngineModule {}
