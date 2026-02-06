import { Module } from '@nestjs/common';
import { AICopilotController } from './ai-copilot.controller';
import { AICopilotService } from './ai-copilot.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AICopilotController],
  providers: [AICopilotService],
  exports: [AICopilotService],
})
export class AICopilotModule {}
