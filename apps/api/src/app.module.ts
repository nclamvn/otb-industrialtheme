import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Common
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { BrandsModule } from './modules/master-data/brands/brands.module';
import { CategoriesModule } from './modules/master-data/categories/categories.module';
import { LocationsModule } from './modules/master-data/locations/locations.module';
import { SeasonsModule } from './modules/master-data/seasons/seasons.module';
import { DivisionsModule } from './modules/master-data/divisions/divisions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { OtbPlansModule } from './modules/otb-plans/otb-plans.module';
import { SkuProposalsModule } from './modules/sku-proposals/sku-proposals.module';
import { UsersModule } from './modules/users/users.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { WSSIModule } from './modules/wssi/wssi.module';
import { VersionsModule } from './modules/versions/versions.module';
import { SizeProfilesModule } from './modules/size-profiles/size-profiles.module';
import { PowerBIModule } from './modules/powerbi/powerbi.module';
import { SKUAnalysisModule } from './modules/sku-analysis/sku-analysis.module';
import { ClearanceModule } from './modules/clearance/clearance.module';
import { ReplenishmentModule } from './modules/replenishment/replenishment.module';
import { ForecastingModule } from './modules/forecasting/forecasting.module';
import { FormulasModule } from './modules/formulas/formulas.module';
import { ExcelToolsModule } from './modules/excel-tools/excel-tools.module';
import { AICopilotModule } from './modules/ai-copilot/ai-copilot.module';

// W25 Feature Modules
import { DeliveryModule } from './modules/delivery/delivery.module';
import { CostingModule } from './modules/costing/costing.module';
import { StorePerformanceModule } from './modules/store-performance/store-performance.module';
import { PriceRangeModule } from './modules/price-range/price-range.module';
import { CarryForwardModule } from './modules/carry-forward/carry-forward.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    PrismaModule,

    // Auth
    AuthModule,

    // Health check
    HealthModule,

    // Master Data
    BrandsModule,
    CategoriesModule,
    LocationsModule,
    SeasonsModule,
    DivisionsModule,

    // Business modules
    BudgetsModule,
    OtbPlansModule,
    SkuProposalsModule,

    // Users & Permissions
    UsersModule,

    // Reports
    ReportsModule,

    // Notifications
    NotificationsModule,

    // AI Features
    AiModule,

    // Workflows & Approvals
    WorkflowsModule,

    // Analytics & KPI
    AnalyticsModule,
    KpiModule,

    // Integrations (ERP, S3, Webhooks, API Keys)
    IntegrationsModule,

    // WSSI (Weekly Sales Stock Intake)
    WSSIModule,

    // OTB Version Control
    VersionsModule,

    // Size Profiles
    SizeProfilesModule,

    // Power BI Integration
    PowerBIModule,

    // SKU Analysis
    SKUAnalysisModule,

    // Clearance Optimization
    ClearanceModule,

    // Replenishment (MOC/MOQ)
    ReplenishmentModule,

    // AI Forecasting
    ForecastingModule,

    // Formula Engine (ExcelAI Core)
    FormulasModule,

    // Excel Tools (NL Formula + Data Cleaner)
    ExcelToolsModule,

    // AI Copilot (Phase 3)
    AICopilotModule,

    // W25 Feature Modules
    DeliveryModule,
    CostingModule,
    StorePerformanceModule,
    PriceRangeModule,
    CarryForwardModule,
  ],
  providers: [
    // Global exception filter for Prisma errors
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    // Global response transform interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
