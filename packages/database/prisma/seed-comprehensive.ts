import {
  PrismaClient,
  UserRole,
  UserStatus,
  BudgetStatus,
  OTBPlanStatus,
  OTBVersionType,
  SKUProposalStatus,
  Gender,
  WorkflowType,
  WorkflowStatus,
  WorkflowStepStatus,
  NotificationType,
  NotificationPriority,
  SizeType,
  KPICategory,
  AggregationType,
  TargetType,
  AIMessageRole,
  AISuggestionType,
  SuggestionPriority,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

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

async function main() {
  console.log('🌱 Seeding COMPREHENSIVE mock data for E2E testing...\n');

  const hashedPassword = await bcrypt.hash('Demo@123', 12);
  const demoPassword = await bcrypt.hash('admin123', 12);

  // ============================================
  // 1. DIVISIONS
  // ============================================
  console.log('📁 Creating divisions...');
  const divisions = await Promise.all([
    prisma.division.upsert({
      where: { code: 'FASHION' },
      update: {},
      create: { name: 'Fashion', code: 'FASHION', description: 'Luxury fashion brands', sortOrder: 1 },
    }),
    prisma.division.upsert({
      where: { code: 'LIFESTYLE' },
      update: {},
      create: { name: 'Lifestyle', code: 'LIFESTYLE', description: 'Premium lifestyle brands', sortOrder: 2 },
    }),
    prisma.division.upsert({
      where: { code: 'SPORTS' },
      update: {},
      create: { name: 'Sports', code: 'SPORTS', description: 'Sports & Athletic brands', sortOrder: 3 },
    }),
  ]);

  const fashionDiv = divisions.find((d) => d.code === 'FASHION')!;
  const lifestyleDiv = divisions.find((d) => d.code === 'LIFESTYLE')!;
  const sportsDiv = divisions.find((d) => d.code === 'SPORTS')!;

  // ============================================
  // 2. BRANDS
  // ============================================
  console.log('🏷️  Creating brands...');
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { code: 'FERR' }, update: {}, create: { name: 'Ferragamo', code: 'FERR', description: 'Italian luxury fashion house', divisionId: fashionDiv.id, sortOrder: 1 } }),
    prisma.brand.upsert({ where: { code: 'BURB' }, update: {}, create: { name: 'Burberry', code: 'BURB', description: 'British luxury fashion house', divisionId: fashionDiv.id, sortOrder: 2 } }),
    prisma.brand.upsert({ where: { code: 'MAXM' }, update: {}, create: { name: 'Max Mara', code: 'MAXM', description: 'Italian fashion house', divisionId: fashionDiv.id, sortOrder: 3 } }),
    prisma.brand.upsert({ where: { code: 'TODS' }, update: {}, create: { name: "Tod's", code: 'TODS', description: 'Italian luxury shoes', divisionId: fashionDiv.id, sortOrder: 4 } }),
    prisma.brand.upsert({ where: { code: 'BOSS' }, update: {}, create: { name: 'Hugo Boss', code: 'BOSS', description: 'German luxury fashion', divisionId: lifestyleDiv.id, sortOrder: 1 } }),
    prisma.brand.upsert({ where: { code: 'POLO' }, update: {}, create: { name: 'Polo Ralph Lauren', code: 'POLO', description: 'American fashion brand', divisionId: lifestyleDiv.id, sortOrder: 2 } }),
    prisma.brand.upsert({ where: { code: 'LAUR' }, update: {}, create: { name: 'Ralph Lauren', code: 'LAUR', description: 'American designer brand', divisionId: lifestyleDiv.id, sortOrder: 3 } }),
    prisma.brand.upsert({ where: { code: 'COLU' }, update: {}, create: { name: 'Columbia', code: 'COLU', description: 'American outdoor brand', divisionId: sportsDiv.id, sortOrder: 1 } }),
    prisma.brand.upsert({ where: { code: 'LACO' }, update: {}, create: { name: 'Lacoste', code: 'LACO', description: 'French sports casual', divisionId: sportsDiv.id, sortOrder: 2 } }),
    prisma.brand.upsert({ where: { code: 'SAMS' }, update: {}, create: { name: 'Samsonite', code: 'SAMS', description: 'Travel & luggage', divisionId: sportsDiv.id, sortOrder: 3 } }),
  ]);

  // ============================================
  // 3. CATEGORIES & SUBCATEGORIES
  // ============================================
  console.log('📂 Creating categories...');
  const categoriesData = [
    { name: 'Bags', code: 'BAGS', subs: ['Tote', 'Crossbody', 'Shoulder', 'Clutch', 'Backpack'] },
    { name: 'Shoes', code: 'SHOES', subs: ['Loafers', 'Sneakers', 'Boots', 'Sandals', 'Heels'] },
    { name: 'Ready-to-Wear', code: 'RTW', subs: ['Jackets', 'Coats', 'Dresses', 'Tops', 'Pants'] },
    { name: 'Accessories', code: 'ACC', subs: ['Belts', 'Scarves', 'Sunglasses', 'Jewelry', 'Watches'] },
    { name: 'Small Leather Goods', code: 'SLG', subs: ['Wallets', 'Card Holders', 'Key Holders', 'Pouches'] },
  ];

  const categories: Record<string, { id: string; code: string }> = {};
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: { name: cat.name, code: cat.code, sortOrder: categoriesData.indexOf(cat) + 1 },
    });
    categories[cat.code] = category;

    for (let i = 0; i < cat.subs.length; i++) {
      const subCode = `${cat.code}-${cat.subs[i].toUpperCase().substring(0, 4)}`;
      await prisma.subcategory.upsert({
        where: { categoryId_code: { categoryId: category.id, code: subCode } },
        update: {},
        create: { name: cat.subs[i], code: subCode, categoryId: category.id, sortOrder: i + 1 },
      });
    }
  }

  // ============================================
  // 4. LOCATIONS
  // ============================================
  console.log('📍 Creating locations...');
  const locations = await Promise.all([
    prisma.salesLocation.upsert({ where: { code: 'HCM-VL' }, update: { storeGroup: 'REX' }, create: { name: 'Vincom Le Thanh Ton', code: 'HCM-VL', type: 'STORE', storeGroup: 'REX', address: 'District 1, HCMC', sortOrder: 1 } }),
    prisma.salesLocation.upsert({ where: { code: 'HCM-SC' }, update: { storeGroup: 'REX' }, create: { name: 'Saigon Centre', code: 'HCM-SC', type: 'STORE', storeGroup: 'REX', address: 'District 1, HCMC', sortOrder: 2 } }),
    prisma.salesLocation.upsert({ where: { code: 'HCM-TK' }, update: { storeGroup: 'TTP' }, create: { name: 'Takashimaya', code: 'HCM-TK', type: 'STORE', storeGroup: 'TTP', address: 'District 1, HCMC', sortOrder: 3 } }),
    prisma.salesLocation.upsert({ where: { code: 'HN-TM' }, update: { storeGroup: 'TTP' }, create: { name: 'Trang Tien Plaza', code: 'HN-TM', type: 'STORE', storeGroup: 'TTP', address: 'Hoan Kiem, Hanoi', sortOrder: 4 } }),
    prisma.salesLocation.upsert({ where: { code: 'HN-LM' }, update: { storeGroup: 'DAFC' }, create: { name: 'Lotte Mall Hanoi', code: 'HN-LM', type: 'STORE', storeGroup: 'DAFC', address: 'Ba Dinh, Hanoi', sortOrder: 5 } }),
    prisma.salesLocation.upsert({ where: { code: 'DN-VM' }, update: { storeGroup: 'DAFC' }, create: { name: 'Vincom Da Nang', code: 'DN-VM', type: 'STORE', storeGroup: 'DAFC', address: 'Hai Chau, Da Nang', sortOrder: 6 } }),
    prisma.salesLocation.upsert({ where: { code: 'ONLINE' }, update: { storeGroup: 'DAFC' }, create: { name: 'E-Commerce', code: 'ONLINE', type: 'ONLINE', storeGroup: 'DAFC', sortOrder: 10 } }),
  ]);

  // ============================================
  // 5. SEASONS
  // ============================================
  console.log('📅 Creating seasons...');
  const seasons = await Promise.all([
    prisma.season.upsert({ where: { code: 'SS25' }, update: { isCurrent: true }, create: { name: 'Spring/Summer 2025', code: 'SS25', seasonGroup: 'SS', year: 2025, startDate: new Date('2025-02-01'), endDate: new Date('2025-07-31'), isCurrent: true } }),
    prisma.season.upsert({ where: { code: 'FW25' }, update: {}, create: { name: 'Fall/Winter 2025', code: 'FW25', seasonGroup: 'FW', year: 2025, startDate: new Date('2025-08-01'), endDate: new Date('2026-01-31') } }),
    prisma.season.upsert({ where: { code: 'SS24' }, update: { isActive: true }, create: { name: 'Spring/Summer 2024', code: 'SS24', seasonGroup: 'SS', year: 2024, startDate: new Date('2024-02-01'), endDate: new Date('2024-07-31'), isActive: true } }),
    prisma.season.upsert({ where: { code: 'FW24' }, update: { isActive: true }, create: { name: 'Fall/Winter 2024', code: 'FW24', seasonGroup: 'FW', year: 2024, startDate: new Date('2024-08-01'), endDate: new Date('2025-01-31'), isActive: true } }),
  ]);

  const ss25 = seasons.find((s) => s.code === 'SS25')!;

  // ============================================
  // 6. USERS
  // ============================================
  console.log('👥 Creating users...');
  const adminUser = await prisma.user.upsert({ where: { email: 'admin@dafc.com' }, update: { id: 'demo-admin' }, create: { id: 'demo-admin', email: 'admin@dafc.com', name: 'Admin User', password: demoPassword, role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
  const plannerUser = await prisma.user.upsert({ where: { email: 'planner@dafc.com' }, update: { id: 'demo-planner' }, create: { id: 'demo-planner', email: 'planner@dafc.com', name: 'OTB Planner', password: demoPassword, role: UserRole.BRAND_PLANNER, status: UserStatus.ACTIVE } });
  const managerUser = await prisma.user.upsert({ where: { email: 'manager@dafc.com' }, update: { id: 'demo-manager' }, create: { id: 'demo-manager', email: 'manager@dafc.com', name: 'Brand Manager', password: demoPassword, role: UserRole.BRAND_MANAGER, status: UserStatus.ACTIVE } });
  await prisma.user.upsert({ where: { email: 'buyer@dafc.com' }, update: { id: 'demo-buyer' }, create: { id: 'demo-buyer', email: 'buyer@dafc.com', name: 'Buyer User', password: demoPassword, role: UserRole.BRAND_PLANNER, status: UserStatus.ACTIVE } });
  const financeHead = await prisma.user.upsert({ where: { email: 'finance.head@dafc.com' }, update: {}, create: { email: 'finance.head@dafc.com', name: 'Nguyen Van Finance', password: hashedPassword, role: UserRole.FINANCE_HEAD, status: UserStatus.ACTIVE } });
  await prisma.user.upsert({ where: { email: 'finance@dafc.com' }, update: {}, create: { email: 'finance@dafc.com', name: 'Tran Thi Finance', password: hashedPassword, role: UserRole.FINANCE_USER, status: UserStatus.ACTIVE } });
  await prisma.user.upsert({ where: { email: 'merchandise@dafc.com' }, update: {}, create: { email: 'merchandise@dafc.com', name: 'Le Van Merchandise', password: hashedPassword, role: UserRole.MERCHANDISE_LEAD, status: UserStatus.ACTIVE } });
  const bodMember = await prisma.user.upsert({ where: { email: 'bod@dafc.com' }, update: {}, create: { email: 'bod@dafc.com', name: 'Pham Thi BOD', password: hashedPassword, role: UserRole.BOD_MEMBER, status: UserStatus.ACTIVE } });

  const ferragamo = brands.find((b) => b.code === 'FERR')!;
  const burberry = brands.find((b) => b.code === 'BURB')!;
  const maxmara = brands.find((b) => b.code === 'MAXM')!;
  const hugoboss = brands.find((b) => b.code === 'BOSS')!;

  await prisma.user.upsert({ where: { email: 'ferragamo.mgr@dafc.com' }, update: {}, create: { email: 'ferragamo.mgr@dafc.com', name: 'Ferragamo Brand Manager', password: hashedPassword, role: UserRole.BRAND_MANAGER, status: UserStatus.ACTIVE, assignedBrands: { connect: [{ id: ferragamo.id }] } } });
  await prisma.user.upsert({ where: { email: 'burberry.mgr@dafc.com' }, update: {}, create: { email: 'burberry.mgr@dafc.com', name: 'Burberry Brand Manager', password: hashedPassword, role: UserRole.BRAND_MANAGER, status: UserStatus.ACTIVE, assignedBrands: { connect: [{ id: burberry.id }] } } });

  const mainLocation = locations.find((l) => l.code === 'HCM-VL')!;

  // ============================================
  // 7. SIZE DEFINITIONS
  // ============================================
  console.log('📏 Creating size definitions...');
  const sizeDefinitions = [
    { sizeCode: 'XS', sizeName: 'Extra Small', sizeOrder: 1, sizeType: SizeType.ALPHA },
    { sizeCode: 'S', sizeName: 'Small', sizeOrder: 2, sizeType: SizeType.ALPHA },
    { sizeCode: 'M', sizeName: 'Medium', sizeOrder: 3, sizeType: SizeType.ALPHA },
    { sizeCode: 'L', sizeName: 'Large', sizeOrder: 4, sizeType: SizeType.ALPHA },
    { sizeCode: 'XL', sizeName: 'Extra Large', sizeOrder: 5, sizeType: SizeType.ALPHA },
    { sizeCode: 'XXL', sizeName: 'Double Extra Large', sizeOrder: 6, sizeType: SizeType.ALPHA },
    { sizeCode: '36', sizeName: 'EU 36', sizeOrder: 1, sizeType: SizeType.NUMERIC, numericEquivalent: '36' },
    { sizeCode: '38', sizeName: 'EU 38', sizeOrder: 2, sizeType: SizeType.NUMERIC, numericEquivalent: '38' },
    { sizeCode: '40', sizeName: 'EU 40', sizeOrder: 3, sizeType: SizeType.NUMERIC, numericEquivalent: '40' },
    { sizeCode: '42', sizeName: 'EU 42', sizeOrder: 4, sizeType: SizeType.NUMERIC, numericEquivalent: '42' },
    { sizeCode: 'OS', sizeName: 'One Size', sizeOrder: 1, sizeType: SizeType.ONE_SIZE },
  ];

  for (const size of sizeDefinitions) {
    await prisma.sizeDefinition.upsert({
      where: { sizeCode: size.sizeCode },
      update: {},
      create: size,
    });
  }

  // ============================================
  // 8. BUDGET ALLOCATIONS
  // ============================================
  console.log('💰 Creating budget allocations...');
  const budgetConfigs = [
    { brand: ferragamo, budget: 2500000, status: BudgetStatus.APPROVED },
    { brand: burberry, budget: 3200000, status: BudgetStatus.APPROVED },
    { brand: maxmara, budget: 1800000, status: BudgetStatus.SUBMITTED },
    { brand: hugoboss, budget: 2100000, status: BudgetStatus.UNDER_REVIEW },
  ];

  const budgets: { id: string; brandId: string }[] = [];
  for (const config of budgetConfigs) {
    const budget = await prisma.budgetAllocation.upsert({
      where: { seasonId_brandId_locationId_version: { seasonId: ss25.id, brandId: config.brand.id, locationId: mainLocation.id, version: 1 } },
      update: { status: config.status },
      create: {
        seasonId: ss25.id, brandId: config.brand.id, locationId: mainLocation.id,
        totalBudget: config.budget, seasonalBudget: config.budget * 0.7, replenishmentBudget: config.budget * 0.3,
        status: config.status, createdById: adminUser.id,
        approvedById: config.status === BudgetStatus.APPROVED ? adminUser.id : null,
        approvedAt: config.status === BudgetStatus.APPROVED ? new Date() : null,
      },
    });
    budgets.push(budget);
  }

  // ============================================
  // 9. OTB PLANS & LINE ITEMS
  // ============================================
  console.log('📊 Creating OTB plans...');
  const otbConfigs = [
    { brand: ferragamo, status: OTBPlanStatus.APPROVED, budget: 2500000 },
    { brand: burberry, status: OTBPlanStatus.UNDER_REVIEW, budget: 3200000 },
    { brand: maxmara, status: OTBPlanStatus.SUBMITTED, budget: 1800000 },
    { brand: hugoboss, status: OTBPlanStatus.DRAFT, budget: 2100000 },
  ];

  const otbPlans: { id: string; brandId: string }[] = [];
  for (const config of otbConfigs) {
    const budgetMatch = budgets.find((b) => b.brandId === config.brand.id);
    if (!budgetMatch) continue;

    const otbPlan = await prisma.oTBPlan.upsert({
      where: { budgetId_version: { budgetId: budgetMatch.id, version: 1 } },
      update: { status: config.status },
      create: {
        budgetId: budgetMatch.id, seasonId: ss25.id, brandId: config.brand.id,
        version: 1, versionType: OTBVersionType.V1_USER, status: config.status,
        totalOTBValue: config.budget, totalSKUCount: randomBetween(100, 200),
        aiConfidenceScore: randomFloat(0.75, 0.95), createdById: plannerUser.id,
        approvedById: config.status === OTBPlanStatus.APPROVED ? managerUser.id : null,
        approvedAt: config.status === OTBPlanStatus.APPROVED ? new Date() : null,
      },
    });
    otbPlans.push(otbPlan);
  }

  // Create OTB Line Items
  console.log('📋 Creating OTB line items...');
  for (const plan of otbPlans) {
    const lineItemsData = [
      { category: 'BAGS', pct: 35, conf: 0.9 },
      { category: 'SHOES', pct: 30, conf: 0.88 },
      { category: 'RTW', pct: 15, conf: 0.82 },
      { category: 'ACC', pct: 12, conf: 0.85 },
      { category: 'SLG', pct: 8, conf: 0.91 },
    ];

    for (const item of lineItemsData) {
      const cat = categories[item.category];
      const histPct = item.pct + randomBetween(-5, 5);
      const value = (2500000 * item.pct) / 100;

      await prisma.oTBLineItem.create({
        data: {
          otbPlanId: plan.id, level: 1, categoryId: cat.id,
          historicalSalesPct: histPct, systemProposedPct: item.pct - randomBetween(1, 3),
          systemConfidence: item.conf, userBuyPct: item.pct, userBuyValue: value,
          varianceFromSystem: randomFloat(-3, 3), varianceFromHist: item.pct - histPct,
        },
      });
    }
  }

  // ============================================
  // 10. SKU PROPOSALS & ITEMS
  // ============================================
  console.log('👗 Creating SKU proposals...');
  const skuStatuses = [SKUProposalStatus.VALIDATED, SKUProposalStatus.ENRICHED, SKUProposalStatus.SUBMITTED, SKUProposalStatus.APPROVED];

  for (let i = 0; i < otbPlans.length; i++) {
    const plan = otbPlans[i];
    const status = skuStatuses[i % skuStatuses.length];
    const totalSKUs = randomBetween(40, 80);

    const skuProposal = await prisma.sKUProposal.create({
      data: {
        otbPlanId: plan.id, seasonId: ss25.id, brandId: plan.brandId, status,
        totalSKUs, validSKUs: totalSKUs - randomBetween(0, 3),
        errorSKUs: randomBetween(0, 2), warningSKUs: randomBetween(0, 3),
        totalValue: randomBetween(800000, 1500000), totalUnits: randomBetween(1000, 2000),
        createdById: plannerUser.id,
      },
    });

    const brand = brands.find((b) => b.id === plan.brandId)!;
    for (let j = 0; j < 10; j++) {
      const cat = categories[['BAGS', 'SHOES', 'RTW', 'ACC', 'SLG'][j % 5]];
      const retail = randomBetween(500, 3000);
      const cost = retail * randomFloat(0.35, 0.45);

      await prisma.sKUItem.create({
        data: {
          proposalId: skuProposal.id, skuCode: `${brand.code}-${j.toString().padStart(3, '0')}`,
          styleName: `${brand.name} Style ${j + 1}`, gender: randomFromArray([Gender.MEN, Gender.WOMEN, Gender.UNISEX]),
          categoryId: cat.id, retailPrice: retail, costPrice: cost, margin: ((retail - cost) / retail) * 100,
          orderQuantity: randomBetween(20, 60), orderValue: retail * randomBetween(20, 60),
          validationStatus: 'VALID', aiDemandScore: randomFloat(60, 95),
        },
      });
    }
  }

  // ============================================
  // 11. WORKFLOWS
  // ============================================
  console.log('🔄 Creating workflows...');
  const workflowTypes = [WorkflowType.BUDGET_APPROVAL, WorkflowType.OTB_APPROVAL, WorkflowType.SKU_APPROVAL];

  for (let i = 0; i < 5; i++) {
    const workflowType = workflowTypes[i % workflowTypes.length];
    const status = randomFromArray([WorkflowStatus.PENDING, WorkflowStatus.IN_PROGRESS, WorkflowStatus.APPROVED]);

    const workflow = await prisma.workflow.create({
      data: {
        type: workflowType, status, totalSteps: 3,
        referenceId: budgets[i % budgets.length].id,
        referenceType: workflowType === WorkflowType.BUDGET_APPROVAL ? 'BUDGET' : 'OTB_PLAN',
        initiatedById: plannerUser.id,
        completedAt: status === WorkflowStatus.APPROVED ? new Date() : null,
      },
    });

    const stepAssignees = [managerUser, financeHead, bodMember];
    const stepNames = ['Brand Manager Review', 'Finance Approval', 'BOD Final Approval'];
    for (let j = 0; j < 3; j++) {
      const stepStatus = status === WorkflowStatus.APPROVED ? WorkflowStepStatus.APPROVED : (j === 0 ? WorkflowStepStatus.IN_PROGRESS : WorkflowStepStatus.PENDING);

      await prisma.workflowStep.create({
        data: {
          workflowId: workflow.id, stepNumber: j + 1, stepName: stepNames[j], status: stepStatus,
          assignedUserId: stepAssignees[j].id,
          actionById: stepStatus === WorkflowStepStatus.APPROVED ? stepAssignees[j].id : null,
          actionAt: stepStatus === WorkflowStepStatus.APPROVED ? new Date() : null,
        },
      });
    }
  }

  // ============================================
  // 12. NOTIFICATIONS
  // ============================================
  console.log('🔔 Creating notifications...');
  const notificationTypes = [NotificationType.BUDGET_SUBMITTED, NotificationType.BUDGET_APPROVED, NotificationType.OTB_SUBMITTED, NotificationType.WORKFLOW_ASSIGNED];

  for (let i = 0; i < 20; i++) {
    await prisma.notification.create({
      data: {
        userId: randomFromArray([adminUser, plannerUser, managerUser]).id,
        type: notificationTypes[i % notificationTypes.length],
        title: `Notification ${i + 1}`, message: `Sample notification message ${i + 1}`,
        priority: randomFromArray([NotificationPriority.LOW, NotificationPriority.MEDIUM, NotificationPriority.HIGH]),
        isRead: Math.random() > 0.5, readAt: Math.random() > 0.5 ? new Date() : null,
      },
    });
  }

  // ============================================
  // 13. STORE PERFORMANCE
  // ============================================
  console.log('📈 Creating store performance data...');
  for (const location of locations.slice(0, 4)) {
    for (let week = 0; week < 8; week++) {
      const periodStart = new Date(ss25.startDate);
      periodStart.setDate(periodStart.getDate() + week * 7);
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);

      const salesQty = randomBetween(50, 200);
      const salesValue = randomBetween(100000, 500000);
      const stockQty = randomBetween(200, 500);
      const stockValue = randomBetween(500000, 1500000);

      await prisma.storePerformance.create({
        data: {
          locationId: location.id, seasonId: ss25.id, periodStart, periodEnd,
          salesQuantity: salesQty, salesValue,
          stockQuantity: stockQty, stockValue,
          sellThru: (salesQty / (salesQty + stockQty)) * 100,
          weeksOfCover: stockQty / Math.max(salesQty / 7, 1),
          margin: randomFloat(45, 60),
        },
      });
    }
  }

  // ============================================
  // 14. KPI DEFINITIONS
  // ============================================
  console.log('🎯 Creating KPI definitions...');
  const kpiDefinitions = [
    { code: 'SELL_THROUGH', name: 'Sell-Through Rate', category: KPICategory.SALES, formula: '(sales_qty / (sales_qty + stock_qty)) * 100', dataSource: 'store_performance', aggregationType: AggregationType.AVERAGE, unit: '%', targetType: TargetType.HIGHER_IS_BETTER, warningThreshold: 55, criticalThreshold: 45 },
    { code: 'STOCK_TURN', name: 'Stock Turnover', category: KPICategory.INVENTORY, formula: 'sales_value / avg_stock_value', dataSource: 'store_performance', aggregationType: AggregationType.AVERAGE, unit: 'x', targetType: TargetType.HIGHER_IS_BETTER, warningThreshold: 3, criticalThreshold: 2 },
    { code: 'MARGIN', name: 'Gross Margin', category: KPICategory.MARGIN, formula: '(revenue - cost) / revenue * 100', dataSource: 'sku_items', aggregationType: AggregationType.AVERAGE, unit: '%', targetType: TargetType.HIGHER_IS_BETTER, warningThreshold: 50, criticalThreshold: 45 },
    { code: 'WOC', name: 'Weeks of Cover', category: KPICategory.INVENTORY, formula: 'stock_qty / (sales_qty / 7)', dataSource: 'store_performance', aggregationType: AggregationType.AVERAGE, unit: 'weeks', targetType: TargetType.RANGE, warningThreshold: 12, criticalThreshold: 16 },
  ];

  for (const kpi of kpiDefinitions) {
    await prisma.kPIDefinition.upsert({
      where: { code: kpi.code },
      update: {},
      create: kpi,
    });
  }

  // ============================================
  // 15. AI CONVERSATIONS & SUGGESTIONS
  // ============================================
  console.log('🤖 Creating AI conversations...');
  const conversation = await prisma.aIConversation.create({
    data: { userId: plannerUser.id, title: 'Budget Planning Assistance', context: JSON.stringify({ seasonId: ss25.id }) },
  });

  await prisma.aIMessage.createMany({
    data: [
      { conversationId: conversation.id, role: AIMessageRole.USER, content: 'Can you help me optimize the budget allocation for Ferragamo SS25?' },
      { conversationId: conversation.id, role: AIMessageRole.ASSISTANT, content: 'Based on historical performance, I recommend increasing the Bags category allocation by 5%.' },
    ],
  });

  await prisma.aISuggestion.create({
    data: {
      userId: plannerUser.id, seasonId: ss25.id, brandId: ferragamo.id,
      type: AISuggestionType.BUY_RECOMMENDATION,
      title: 'Increase Bags Category Buy', description: 'Historical data shows Bags category has 72% sell-through rate.',
      confidence: 0.87, priority: SuggestionPriority.HIGH,
      data: JSON.stringify({ currentPct: 35, recommendedPct: 40 }),
      status: 'PENDING',
    },
  });

  // ============================================
  // 16. COMMENTS
  // ============================================
  console.log('💬 Creating comments...');
  for (const budget of budgets.slice(0, 2)) {
    await prisma.comment.createMany({
      data: [
        { referenceType: 'BUDGET', referenceId: budget.id, authorId: plannerUser.id, content: 'Initial budget allocation.' },
        { referenceType: 'BUDGET', referenceId: budget.id, authorId: managerUser.id, content: 'Approved with adjustments.' },
      ],
    });
  }

  // ============================================
  // 17. AUDIT LOGS
  // ============================================
  console.log('📝 Creating audit logs...');
  const auditActions = ['CREATE', 'UPDATE', 'APPROVE'];

  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        userId: randomFromArray([adminUser, plannerUser, managerUser]).id,
        userEmail: randomFromArray(['admin@dafc.com', 'planner@dafc.com', 'manager@dafc.com']),
        action: randomFromArray(auditActions),
        tableName: randomFromArray(['budgets', 'otb_plans', 'sku_proposals']),
        recordId: budgets[i % budgets.length].id,
        changedFields: ['status', 'totalBudget'],
        oldValue: JSON.parse('{"status": "DRAFT"}'),
        newValue: JSON.parse('{"status": "SUBMITTED"}'),
        ipAddress: '192.168.1.' + randomBetween(1, 255),
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      },
    });
  }

  // ============================================
  // 18. DELIVERY WINDOWS
  // ============================================
  console.log('🚚 Creating delivery windows...');
  const deliveryMonths = ['FEB26', 'MAR26', 'APR26', 'MAY26', 'JUN26'];
  for (let i = 0; i < deliveryMonths.length; i++) {
    await prisma.deliveryWindow.upsert({
      where: { seasonId_code: { seasonId: ss25.id, code: deliveryMonths[i] } },
      update: {},
      create: {
        seasonId: ss25.id, code: deliveryMonths[i],
        name: deliveryMonths[i].replace('26', ' 2026'),
        startDate: new Date(2026, i + 1, 1), endDate: new Date(2026, i + 1, 28),
        sortOrder: i + 1,
      },
    });
  }

  // ============================================
  // 19. COLLECTIONS
  // ============================================
  console.log('📦 Creating collections...');
  for (const brand of brands.slice(0, 5)) {
    await prisma.collection.upsert({ where: { brandId_code: { brandId: brand.id, code: 'SS25-MAIN' } }, update: {}, create: { name: 'SS25 Main Collection', code: 'SS25-MAIN', brandId: brand.id, sortOrder: 1 } });
    await prisma.collection.upsert({ where: { brandId_code: { brandId: brand.id, code: 'SS25-CAPSULE' } }, update: {}, create: { name: 'SS25 Capsule', code: 'SS25-CAPSULE', brandId: brand.id, sortOrder: 2 } });
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ COMPREHENSIVE seeding completed!');
  console.log('\n📋 Demo Accounts (password: admin123):');
  console.log('   - admin@dafc.com (Admin)');
  console.log('   - planner@dafc.com (Brand Planner)');
  console.log('   - manager@dafc.com (Brand Manager)');
  console.log('   - buyer@dafc.com (Buyer)');
  console.log('   - finance.head@dafc.com (Finance Head)');

  console.log('\n📊 Data Created:');
  console.log('   - 3 Divisions, 10 Brands');
  console.log('   - 5 Categories, 25 Subcategories');
  console.log('   - 7 Locations, 4 Seasons');
  console.log('   - 11 Size Definitions');
  console.log('   - 4 Budgets, 4 OTB Plans, 20 Line Items');
  console.log('   - 4 SKU Proposals, 40 SKU Items');
  console.log('   - 5 Workflows, 15 Steps');
  console.log('   - 20 Notifications');
  console.log('   - 32 Store Performance records');
  console.log('   - 4 KPI Definitions');
  console.log('   - AI Conversation & Suggestions');
  console.log('   - 4 Comments, 20 Audit Logs');
  console.log('   - 5 Delivery Windows, 10 Collections');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
