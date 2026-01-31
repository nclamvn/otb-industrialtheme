/**
 * Advanced Mock Data Seeder
 * Run after seed-comprehensive.ts
 * Covers: WSSI, Forecasts, Reports, Scenarios, Dashboards, etc.
 */

import { PrismaClient, Gender, SizeType } from '@prisma/client';

const prisma = new PrismaClient();

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🚀 Seeding ADVANCED mock data...\n');

  // Get existing data
  const users = await prisma.user.findMany({ take: 10 });
  const brands = await prisma.brand.findMany({ include: { division: true } });
  const categories = await prisma.category.findMany();
  const locations = await prisma.salesLocation.findMany();
  const seasons = await prisma.season.findMany();
  const budgets = await prisma.budgetAllocation.findMany({ take: 10 });
  const sizeDefinitions = await prisma.sizeDefinition.findMany();

  if (users.length === 0 || brands.length === 0) {
    console.log('❌ Please run seed-comprehensive.ts first!');
    return;
  }

  const adminUser = users.find((u) => u.email === 'admin@dafc.com') || users[0];
  const plannerUser = users.find((u) => u.email === 'planner@dafc.com') || users[1];
  const ss25 = seasons.find((s) => s.code === 'SS25') || seasons[0];
  const ss24 = seasons.find((s) => s.code === 'SS24');

  // ============================================
  // 1. WSSI RECORDS (Weekly Sales Stock Intake)
  // ============================================
  console.log('📊 Creating WSSI records...');

  for (const brand of brands.slice(0, 5)) {
    for (const location of locations.slice(0, 3)) {
      // Create 12 weeks of WSSI data
      for (let week = 1; week <= 12; week++) {
        const weekStart = new Date(ss25.startDate);
        weekStart.setDate(weekStart.getDate() + (week - 1) * 7);

        const salesPlan = randomBetween(50000, 200000);
        const salesActual = salesPlan * randomFloat(0.8, 1.2);
        const stockBOW = randomBetween(200000, 500000);
        const intake = randomBetween(30000, 100000);
        const stockEOW = stockBOW + intake - salesActual;

        await prisma.wSSIRecord.upsert({
          where: {
            seasonId_brandId_divisionId_locationId_weekNumber: {
              seasonId: ss25.id,
              brandId: brand.id,
              divisionId: brand.divisionId,
              locationId: location.id,
              weekNumber: week,
            },
          },
          update: {},
          create: {
            seasonId: ss25.id,
            brandId: brand.id,
            divisionId: brand.divisionId,
            locationId: location.id,
            weekNumber: week,
            weekStartDate: weekStart,
            weekEndDate: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
            // Sales
            salesPlanUnits: Math.floor(salesPlan / 100),
            salesPlanValue: salesPlan,
            salesActualUnits: Math.floor(salesActual / 100),
            salesActualValue: salesActual,
            salesVarianceUnits: Math.floor((salesActual - salesPlan) / 100),
            salesVarianceValue: salesActual - salesPlan,
            salesVariancePct: ((salesActual - salesPlan) / salesPlan) * 100,
            // Stock
            stockBOWUnits: Math.floor(stockBOW / 100),
            stockBOWValue: stockBOW,
            stockEOWUnits: Math.floor(stockEOW / 100),
            stockEOWValue: stockEOW,
            // Intake
            intakePlanUnits: Math.floor(intake / 100),
            intakePlanValue: intake,
            intakeActualUnits: Math.floor(intake * randomFloat(0.9, 1.1) / 100),
            intakeActualValue: intake * randomFloat(0.9, 1.1),
            // KPIs
            sellThroughRate: randomFloat(55, 80),
            weeksOfCover: randomFloat(6, 14),
            stockToSalesRatio: stockEOW / salesActual,
            gmroii: randomFloat(1.5, 3.5),
            // Forecast
            forecastAccuracy: randomFloat(80, 98),
            reforecastValue: salesPlan * randomFloat(0.95, 1.05),
            createdById: plannerUser.id,
          },
        });
      }
    }
  }

  // ============================================
  // 2. WSSI ALERTS
  // ============================================
  console.log('⚠️  Creating WSSI alerts...');

  const wssiRecords = await prisma.wSSIRecord.findMany({ take: 20 });
  const alertTypes = ['LOW_STOCK', 'HIGH_STOCK', 'SALES_BELOW_TARGET', 'INTAKE_DELAY', 'WOC_CRITICAL'];

  for (const record of wssiRecords.slice(0, 10)) {
    await prisma.wSSIAlert.create({
      data: {
        wssiRecordId: record.id,
        alertType: randomFromArray(alertTypes),
        severity: randomFromArray(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        title: `Alert for Week ${record.weekNumber}`,
        message: `Performance variance detected. Current sell-through: ${record.sellThroughRate?.toFixed(1)}%`,
        threshold: randomFloat(50, 70),
        actualValue: record.sellThroughRate || 0,
        isAcknowledged: Math.random() > 0.7,
        acknowledgedAt: Math.random() > 0.7 ? new Date() : null,
        acknowledgedById: Math.random() > 0.7 ? adminUser.id : null,
      },
    });
  }

  // ============================================
  // 3. WSSI THRESHOLDS
  // ============================================
  console.log('📏 Creating WSSI thresholds...');

  for (const brand of brands.slice(0, 3)) {
    await prisma.wSSIThreshold.upsert({
      where: {
        brandId_divisionId_metric: {
          brandId: brand.id,
          divisionId: brand.divisionId,
          metric: 'SELL_THROUGH',
        },
      },
      update: {},
      create: {
        brandId: brand.id,
        divisionId: brand.divisionId,
        metric: 'SELL_THROUGH',
        warningMin: 55,
        warningMax: 75,
        criticalMin: 45,
        criticalMax: 85,
      },
    });

    await prisma.wSSIThreshold.upsert({
      where: {
        brandId_divisionId_metric: {
          brandId: brand.id,
          divisionId: brand.divisionId,
          metric: 'WEEKS_OF_COVER',
        },
      },
      update: {},
      create: {
        brandId: brand.id,
        divisionId: brand.divisionId,
        metric: 'WEEKS_OF_COVER',
        warningMin: 6,
        warningMax: 12,
        criticalMin: 4,
        criticalMax: 16,
      },
    });
  }

  // ============================================
  // 4. FORECASTS
  // ============================================
  console.log('🔮 Creating forecasts...');

  for (const brand of brands.slice(0, 4)) {
    const forecast = await prisma.forecast.create({
      data: {
        seasonId: ss25.id,
        brandId: brand.id,
        createdById: plannerUser.id,
        name: `${brand.name} SS25 Demand Forecast`,
        description: 'AI-generated demand forecast based on historical data',
        forecastType: randomFromArray(['DEMAND', 'SALES', 'STOCK']),
        status: randomFromArray(['DRAFT', 'ACTIVE', 'ARCHIVED']),
        confidenceScore: randomFloat(0.75, 0.95),
        methodology: 'ARIMA with seasonal adjustments',
        parameters: JSON.stringify({
          seasonality: 'weekly',
          trendFactor: 1.05,
          historicalPeriods: 52,
        }),
      },
    });

    // Create forecast config
    await prisma.forecastConfig.create({
      data: {
        forecastId: forecast.id,
        modelType: randomFromArray(['ARIMA', 'PROPHET', 'LSTM', 'ENSEMBLE']),
        parameters: JSON.stringify({
          seasonality: true,
          trendComponent: true,
          holidayEffects: true,
        }),
        trainingStartDate: new Date('2023-01-01'),
        trainingEndDate: new Date('2024-12-31'),
        forecastHorizon: 26,
        confidenceLevel: 0.95,
      },
    });

    // Create forecast runs
    for (let i = 0; i < 3; i++) {
      const run = await prisma.forecastRun.create({
        data: {
          forecastId: forecast.id,
          runNumber: i + 1,
          status: i === 2 ? 'COMPLETED' : 'ARCHIVED',
          startedAt: randomDate(new Date('2024-12-01'), new Date('2025-01-15')),
          completedAt: randomDate(new Date('2025-01-15'), new Date()),
          metrics: JSON.stringify({
            mape: randomFloat(5, 15),
            rmse: randomFloat(1000, 5000),
            mae: randomFloat(800, 4000),
          }),
        },
      });

      // Create run results
      for (let week = 1; week <= 12; week++) {
        await prisma.forecastRunResult.create({
          data: {
            forecastRunId: run.id,
            periodStart: new Date(2025, 1, week * 7),
            periodEnd: new Date(2025, 1, week * 7 + 6),
            predictedValue: randomBetween(80000, 250000),
            lowerBound: randomBetween(60000, 200000),
            upperBound: randomBetween(100000, 300000),
            confidenceScore: randomFloat(0.7, 0.95),
          },
        });
      }
    }
  }

  // ============================================
  // 5. SCENARIOS (What-If Analysis)
  // ============================================
  console.log('🎭 Creating scenarios...');

  const scenarioTypes = [
    { name: 'Optimistic Growth', factor: 1.15 },
    { name: 'Conservative', factor: 0.95 },
    { name: 'Economic Downturn', factor: 0.85 },
    { name: 'Promotional Push', factor: 1.25 },
  ];

  for (const scenarioType of scenarioTypes) {
    const baseBudget = budgets[0];
    if (!baseBudget) continue;

    await prisma.scenario.create({
      data: {
        seasonId: ss25.id,
        createdById: plannerUser.id,
        name: scenarioType.name,
        description: `${scenarioType.name} scenario with ${((scenarioType.factor - 1) * 100).toFixed(0)}% adjustment`,
        status: randomFromArray(['DRAFT', 'ACTIVE', 'ARCHIVED']),
        baselineData: JSON.stringify({
          totalBudget: baseBudget.totalBudget,
          seasonalBudget: baseBudget.seasonalBudget,
        }),
        adjustments: JSON.stringify({
          factor: scenarioType.factor,
          categories: {
            BAGS: scenarioType.factor * randomFloat(0.95, 1.05),
            SHOES: scenarioType.factor * randomFloat(0.95, 1.05),
            RTW: scenarioType.factor * randomFloat(0.95, 1.05),
          },
        }),
        results: JSON.stringify({
          projectedRevenue: Number(baseBudget.totalBudget) * scenarioType.factor,
          projectedMargin: randomFloat(50, 60),
          riskScore: scenarioType.factor > 1 ? 'MEDIUM' : 'LOW',
        }),
      },
    });
  }

  // ============================================
  // 6. REPORTS
  // ============================================
  console.log('📄 Creating reports...');

  const reportTypes = [
    { name: 'Weekly Sales Summary', type: 'SALES' },
    { name: 'Budget vs Actual', type: 'BUDGET' },
    { name: 'Stock Analysis', type: 'STOCK' },
    { name: 'OTB Performance', type: 'OTB' },
    { name: 'SKU Sell-Through', type: 'SKU' },
  ];

  for (const reportType of reportTypes) {
    const report = await prisma.report.create({
      data: {
        name: reportType.name,
        description: `Automated ${reportType.name} report`,
        type: reportType.type,
        createdById: adminUser.id,
        parameters: JSON.stringify({
          seasonId: ss25.id,
          dateRange: 'LAST_30_DAYS',
          groupBy: 'BRAND',
        }),
        schedule: randomFromArray(['DAILY', 'WEEKLY', 'MONTHLY', null]),
        lastRunAt: randomDate(new Date('2025-01-01'), new Date()),
        isPublic: Math.random() > 0.5,
      },
    });

    // Create report executions
    for (let i = 0; i < 5; i++) {
      await prisma.reportExecution.create({
        data: {
          reportId: report.id,
          executedById: adminUser.id,
          status: i === 4 ? 'RUNNING' : 'COMPLETED',
          startedAt: randomDate(new Date('2025-01-01'), new Date()),
          completedAt: i === 4 ? null : randomDate(new Date('2025-01-01'), new Date()),
          rowCount: randomBetween(100, 5000),
          fileUrl: i === 4 ? null : `/reports/${report.id}/execution-${i + 1}.xlsx`,
          fileSize: randomBetween(50000, 500000),
        },
      });
    }
  }

  // ============================================
  // 7. DASHBOARD WIDGETS
  // ============================================
  console.log('📊 Creating dashboard widgets...');

  const widgetTypes = [
    { type: 'KPI_CARD', title: 'Total Revenue', size: 'small' },
    { type: 'KPI_CARD', title: 'Sell-Through Rate', size: 'small' },
    { type: 'KPI_CARD', title: 'Stock Value', size: 'small' },
    { type: 'KPI_CARD', title: 'Active SKUs', size: 'small' },
    { type: 'CHART', title: 'Sales Trend', size: 'large' },
    { type: 'CHART', title: 'Category Mix', size: 'medium' },
    { type: 'TABLE', title: 'Top Performers', size: 'large' },
    { type: 'CHART', title: 'Stock Movement', size: 'medium' },
  ];

  for (let i = 0; i < widgetTypes.length; i++) {
    const widget = widgetTypes[i];
    await prisma.dashboardWidget.create({
      data: {
        userId: adminUser.id,
        type: widget.type,
        title: widget.title,
        config: JSON.stringify({
          size: widget.size,
          dataSource: widget.type === 'KPI_CARD' ? 'kpi' : widget.type === 'CHART' ? 'analytics' : 'table',
          refreshInterval: 300,
        }),
        position: i,
        isVisible: true,
      },
    });
  }

  // ============================================
  // 8. SIZE PROFILES
  // ============================================
  console.log('📐 Creating size profiles...');

  const alphaSizes = sizeDefinitions.filter((s) => s.sizeType === SizeType.ALPHA);

  for (const category of categories.slice(0, 3)) {
    for (const gender of [Gender.MEN, Gender.WOMEN]) {
      const profile = await prisma.sizeProfile.create({
        data: {
          categoryId: category.id,
          gender,
          seasonId: ss25.id,
          profileType: 'CATEGORY',
          basedOnUnits: randomBetween(5000, 20000),
          createdById: plannerUser.id,
        },
      });

      // Create size profile items (distribution)
      const distributions = gender === Gender.WOMEN
        ? [5, 15, 30, 28, 15, 7] // Women: S/M heavy
        : [3, 12, 25, 30, 20, 10]; // Men: M/L heavy

      for (let i = 0; i < alphaSizes.length && i < distributions.length; i++) {
        await prisma.sizeProfileItem.create({
          data: {
            profileId: profile.id,
            sizeDefinitionId: alphaSizes[i].id,
            percentage: distributions[i],
            quantity: Math.floor((profile.basedOnUnits * distributions[i]) / 100),
          },
        });
      }
    }
  }

  // ============================================
  // 9. PREDICTIVE ALERTS
  // ============================================
  console.log('🔔 Creating predictive alerts...');

  const alertConfigs = [
    { type: 'STOCKOUT_RISK', title: 'Potential Stockout', severity: 'HIGH' },
    { type: 'OVERSTOCK_RISK', title: 'Overstock Warning', severity: 'MEDIUM' },
    { type: 'DEMAND_SPIKE', title: 'Demand Surge Predicted', severity: 'LOW' },
    { type: 'TREND_CHANGE', title: 'Trend Shift Detected', severity: 'MEDIUM' },
  ];

  for (const brand of brands.slice(0, 4)) {
    for (const config of alertConfigs) {
      await prisma.predictiveAlert.create({
        data: {
          userId: plannerUser.id,
          seasonId: ss25.id,
          brandId: brand.id,
          alertType: config.type,
          title: `${brand.name}: ${config.title}`,
          description: `AI-detected ${config.type.toLowerCase().replace('_', ' ')} for ${brand.name} in the next 4 weeks.`,
          severity: config.severity,
          confidence: randomFloat(0.7, 0.95),
          predictedDate: randomDate(new Date(), new Date('2025-06-30')),
          impactValue: randomBetween(50000, 500000),
          recommendations: JSON.stringify([
            'Review inventory levels',
            'Adjust replenishment orders',
            'Consider promotional activities',
          ]),
          status: randomFromArray(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']),
        },
      });
    }
  }

  // ============================================
  // 10. AI GENERATED PLANS
  // ============================================
  console.log('🤖 Creating AI generated plans...');

  for (const brand of brands.slice(0, 3)) {
    await prisma.aIGeneratedPlan.create({
      data: {
        userId: plannerUser.id,
        seasonId: ss25.id,
        brandId: brand.id,
        planType: randomFromArray(['BUDGET', 'OTB', 'ASSORTMENT']),
        name: `AI Optimized Plan for ${brand.name}`,
        description: 'Machine learning optimized allocation based on historical performance',
        status: randomFromArray(['DRAFT', 'REVIEWED', 'APPLIED']),
        confidence: randomFloat(0.8, 0.95),
        parameters: JSON.stringify({
          optimizationGoal: 'MAXIMIZE_SELL_THROUGH',
          constraints: ['BUDGET_LIMIT', 'MIN_MARGIN'],
          historicalPeriods: 4,
        }),
        generatedData: JSON.stringify({
          categoryAllocations: {
            BAGS: randomFloat(30, 40),
            SHOES: randomFloat(25, 35),
            RTW: randomFloat(15, 25),
            ACC: randomFloat(10, 15),
            SLG: randomFloat(5, 10),
          },
          expectedMetrics: {
            sellThrough: randomFloat(65, 80),
            margin: randomFloat(52, 58),
            roi: randomFloat(1.2, 1.5),
          },
        }),
        appliedAt: Math.random() > 0.5 ? new Date() : null,
      },
    });
  }

  // ============================================
  // 11. SAVED FILTERS
  // ============================================
  console.log('💾 Creating saved filters...');

  const filterConfigs = [
    { name: 'High Performers', entity: 'SKU', filters: { sellThrough: { gte: 70 } } },
    { name: 'Low Stock Alert', entity: 'STOCK', filters: { woc: { lte: 4 } } },
    { name: 'Pending Approvals', entity: 'WORKFLOW', filters: { status: 'PENDING' } },
    { name: 'Fashion Division', entity: 'BRAND', filters: { division: 'FASHION' } },
  ];

  for (const config of filterConfigs) {
    await prisma.savedFilter.create({
      data: {
        userId: adminUser.id,
        name: config.name,
        entityType: config.entity,
        filters: JSON.stringify(config.filters),
        isDefault: Math.random() > 0.7,
      },
    });
  }

  // ============================================
  // 12. RECENT SEARCHES
  // ============================================
  console.log('🔍 Creating recent searches...');

  const searches = ['Ferragamo bags', 'SS25 budget', 'Low stock items', 'Pending approvals', 'Sales trend'];

  for (const user of users.slice(0, 3)) {
    for (const query of searches) {
      await prisma.recentSearch.create({
        data: {
          userId: user.id,
          query,
          entityType: randomFromArray(['SKU', 'BUDGET', 'OTB', 'REPORT']),
          resultCount: randomBetween(5, 100),
        },
      });
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ ADVANCED seeding completed successfully!');
  console.log('\n📊 Additional Data Created:');
  console.log('   - 180+ WSSI Records (weekly data)');
  console.log('   - 10 WSSI Alerts');
  console.log('   - 6 WSSI Thresholds');
  console.log('   - 4 Forecasts with Runs & Results');
  console.log('   - 4 Scenarios (What-If)');
  console.log('   - 5 Reports with Executions');
  console.log('   - 8 Dashboard Widgets');
  console.log('   - 6 Size Profiles with Items');
  console.log('   - 16 Predictive Alerts');
  console.log('   - 3 AI Generated Plans');
  console.log('   - 4 Saved Filters');
  console.log('   - 15 Recent Searches');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
