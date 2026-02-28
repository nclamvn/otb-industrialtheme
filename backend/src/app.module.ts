import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { BudgetModule } from './modules/budget/budget.module';
import { PlanningModule } from './modules/planning/planning.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { AiModule } from './modules/ai/ai.module';
import { ApprovalWorkflowModule } from './modules/approval-workflow/approval-workflow.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ImportModule } from './modules/import/import.module';
import { AuditLogModule } from './common/services/audit-log.module';
import { DataRetentionModule } from './modules/data-retention/data-retention.module';
import { NotificationModule } from './modules/notification/notification.module';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    MasterDataModule,
    BudgetModule,
    PlanningModule,
    ProposalModule,
    AiModule,
    ApprovalWorkflowModule,
    AnalyticsModule,
    ImportModule,
    AuditLogModule,
    DataRetentionModule,
    NotificationModule,
  ],
})
export class AppModule {}
