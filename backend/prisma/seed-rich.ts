// ============================================================================
// DAFC OTB Planning — Rich Data Seed
// Populates ALL tables with realistic luxury fashion retail data
// Run: npx ts-node prisma/seed-rich.ts
// ============================================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDec(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('==========================================================');
  console.log('  DAFC OTB — Rich Data Seeder');
  console.log('  Populating all tables with luxury fashion retail data');
  console.log('==========================================================');
  console.log('');

  // ─── 0. READ EXISTING IDS ──────────────────────────────────────────────

  console.log('📖 Reading existing records...');

  const storeREX = await prisma.store.findUniqueOrThrow({ where: { code: 'REX' } });
  const storeTTP = await prisma.store.findUniqueOrThrow({ where: { code: 'TTP' } });
  const brandFER = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'FER' } });
  const brandBUR = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'BUR' } });
  const brandGUC = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'GUC' } });
  const brandPRA = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'PRA' } });

  const collCarryOver = await prisma.collection.findUniqueOrThrow({ where: { name: 'Carry Over' } });
  const collSeasonal  = await prisma.collection.findUniqueOrThrow({ where: { name: 'Seasonal' } });
  const genderF = await prisma.gender.findUniqueOrThrow({ where: { name: 'Female' } });
  const genderM = await prisma.gender.findUniqueOrThrow({ where: { name: 'Male' } });

  const catWomenRtw    = await prisma.category.findFirstOrThrow({ where: { id: 'women_rtw' } });
  const catWomenHardAcc = await prisma.category.findFirstOrThrow({ where: { id: 'women_hard_acc' } });
  const catWomenOthers = await prisma.category.findFirstOrThrow({ where: { id: 'women_others' } });
  const catMenRtw      = await prisma.category.findFirstOrThrow({ where: { id: 'men_rtw' } });
  const catMenAcc      = await prisma.category.findFirstOrThrow({ where: { id: 'men_acc' } });

  const subW_outerwear = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_outerwear' } });
  const subW_tops      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_tops' } });
  const subW_dresses   = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_dresses' } });
  const subW_bags      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_bags' } });
  const subW_slg       = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_slg' } });
  const subW_shoes     = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_shoes' } });
  const subM_outerwear = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_outerwear' } });
  const subM_tops      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_tops' } });
  const subM_bags      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_bags' } });
  const subM_slg       = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_slg' } });

  const userMerch   = await prisma.user.findUniqueOrThrow({ where: { email: 'merch@dafc.com' } });
  const userBuyer   = await prisma.user.findUniqueOrThrow({ where: { email: 'buyer@dafc.com' } });
  const userManager = await prisma.user.findUniqueOrThrow({ where: { email: 'manager@dafc.com' } });
  const userFinance = await prisma.user.findUniqueOrThrow({ where: { email: 'finance@dafc.com' } });

  console.log('  ✅ All existing records loaded\n');

  // ─── 0b. CLEAN AI / ENRICHMENT TABLES (idempotent) ─────────────────────

  console.log('🧹 Cleaning enrichment tables for idempotent re-run...');

  await prisma.salesHistory.deleteMany();
  await prisma.skuPerformance.deleteMany();
  await prisma.attributeTrend.deleteMany();
  await prisma.allocationHistory.deleteMany();
  await prisma.allocationRecommendation.deleteMany();
  await prisma.skuRecommendation.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.riskThreshold.deleteMany();
  await prisma.budgetAlert.deleteMany();
  await prisma.budgetSnapshot.deleteMany();
  await prisma.productAllocation.deleteMany();
  await prisma.proposalProduct.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.planningDetail.deleteMany();
  await prisma.planningVersion.deleteMany();
  await prisma.budgetDetail.deleteMany();
  // Delete only budgets we will recreate (keep existing ones if any)
  await prisma.budget.deleteMany({
    where: {
      budgetCode: {
        in: [
          'BUD-FER-SS-Pre-2026', 'BUD-FER-SS-Main-2026',
          'BUD-BUR-FW-Pre-2026', 'BUD-GUC-SS-Pre-2026',
          'BUD-PRA-FW-Main-2026', 'BUD-FER-FW-Pre-2026',
        ],
      },
    },
  });

  console.log('  ✅ Cleaned\n');

  // ======================================================================
  // 1. ADDITIONAL SKU CATALOG (~35 new SKUs)
  // ======================================================================

  console.log('🏷️  Creating additional SKU catalog entries...');

  const newSkus = [
    // ── FERRAGAMO WOMEN'S RTW ──
    { skuCode: 'FER-W-OW-001', productName: 'GANCINI BELTED COAT', productType: 'W OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'CAMEL', composition: '80% WOOL 20% CASHMERE', srp: 89000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-OW-002', productName: 'DOUBLE-BREASTED TRENCH', productType: 'W OUTERWEAR', theme: 'OCTOBER (10)', color: 'HONEY', composition: '100% COTTON', srp: 75000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-OW-003', productName: 'CAPE PONCHO CASHMERE', productType: 'W OUTERWEAR', theme: 'NOVEMBER (11)', color: 'IVORY', composition: '80% WOOL 20% CASHMERE', srp: 95000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-TP-001', productName: 'SILK BOW BLOUSE', productType: 'W TOPS', theme: 'AUGUST (08)', color: 'DUSTY PINK', composition: '100% SILK', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-TP-002', productName: 'GANCINI KNIT TOP', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'BLACK', composition: '80% WOOL 20% CASHMERE', srp: 28500000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-TP-003', productName: 'PRINTED POPLIN SHIRT', productType: 'W TOPS', theme: 'OCTOBER (10)', color: 'FOREST GREEN', composition: '100% COTTON', srp: 24000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-DR-001', productName: 'WRAP DRESS CREPE', productType: 'W DRESSES', theme: 'SEPTEMBER (09)', color: 'WINE RED', composition: '100% SILK', srp: 52000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-DR-002', productName: 'MIDI DRESS PLISSE', productType: 'W DRESSES', theme: 'OCTOBER (10)', color: 'EMERALD', composition: '100% POLYAMIDE', srp: 48000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-DR-003', productName: 'COCKTAIL DRESS SATIN', productType: 'W DRESSES', theme: 'NOVEMBER (11)', color: 'BURGUNDY', composition: '100% SILK', srp: 65000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // ── FERRAGAMO WOMEN'S BAGS ──
    { skuCode: 'FER-W-BG-001', productName: 'VARA BOW TOTE', productType: 'W BAGS', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 85000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-BG-002', productName: 'TRIFOLIO CROSSBODY', productType: 'W BAGS', theme: 'SEPTEMBER (09)', color: 'DUSTY PINK', composition: '100% LEATHER', srp: 62000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-BG-003', productName: 'GANCINI CLUTCH', productType: 'W BAGS', theme: 'OCTOBER (10)', color: 'WINE RED', composition: '100% LEATHER', srp: 45000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-BG-004', productName: 'STUDIO TOP HANDLE', productType: 'W BAGS', theme: 'NOVEMBER (11)', color: 'HONEY', composition: '100% LEATHER', srp: 98000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-BG-005', productName: 'WANDA MINI BAG', productType: 'W BAGS', theme: 'DECEMBER (12)', color: 'IVORY', composition: 'CANVAS/LEATHER', srp: 42000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    // ── FERRAGAMO WOMEN'S SLG ──
    { skuCode: 'FER-W-SL-001', productName: 'VARA BOW WALLET', productType: 'W SLG', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 18000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SL-002', productName: 'GANCINI CARD HOLDER', productType: 'W SLG', theme: 'SEPTEMBER (09)', color: 'DUSTY PINK', composition: '100% LEATHER', srp: 12000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SL-003', productName: 'ZIP AROUND WALLET', productType: 'W SLG', theme: 'OCTOBER (10)', color: 'BURGUNDY', composition: '100% LEATHER', srp: 22000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // ── FERRAGAMO WOMEN'S SHOES ──
    { skuCode: 'FER-W-SH-001', productName: 'VARA BOW PUMP', productType: 'W SHOES', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 28000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SH-002', productName: 'VARINA BALLET FLAT', productType: 'W SHOES', theme: 'SEPTEMBER (09)', color: 'HONEY', composition: '100% LEATHER', srp: 25000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SH-003', productName: 'GANCINI SANDAL', productType: 'W SHOES', theme: 'OCTOBER (10)', color: 'TAN', composition: '100% LEATHER', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-SH-004', productName: 'PLATFORM LOAFER', productType: 'W SHOES', theme: 'NOVEMBER (11)', color: 'WINE RED', composition: '100% LEATHER', srp: 38000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // ── FERRAGAMO MEN'S ──
    { skuCode: 'FER-M-OW-001', productName: 'GANCINI BOMBER JACKET', productType: 'M OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'NAVY', composition: '100% NYLON', srp: 55000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-OW-002', productName: 'WOOL OVERCOAT', productType: 'M OUTERWEAR', theme: 'OCTOBER (10)', color: 'GREY', composition: '80% WOOL 20% CASHMERE', srp: 78000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-TP-001', productName: 'GANCINI POLO', productType: 'M TOPS', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% COTTON', srp: 22000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-M-TP-002', productName: 'SILK DRESS SHIRT', productType: 'M TOPS', theme: 'SEPTEMBER (09)', color: 'IVORY', composition: '100% SILK', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-M-BG-001', productName: 'REVIVAL BRIEFCASE', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'BLACK', composition: '100% LEATHER', srp: 72000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-BG-002', productName: 'GANCINI BACKPACK', productType: 'M BAGS', theme: 'NOVEMBER (11)', color: 'NAVY', composition: '100% NYLON', srp: 48000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-SL-001', productName: 'GANCINI BIFOLD WALLET', productType: 'M SLG', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 15000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-M-SL-002', productName: 'CARD CASE EMBOSSED', productType: 'M SLG', theme: 'SEPTEMBER (09)', color: 'TAN', composition: '100% LEATHER', srp: 10000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    // ── BURBERRY WOMEN'S ──
    { skuCode: 'BUR-W-OW-001', productName: 'CHECK QUILTED JACKET', productType: 'W OUTERWEAR', theme: 'OCTOBER (10)', color: 'CAMEL', composition: '100% POLYAMIDE', srp: 68000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-W-BG-001', productName: 'POCKET BAG MEDIUM', productType: 'W BAGS', theme: 'SEPTEMBER (09)', color: 'TAN', composition: '100% LEATHER', srp: 78000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-W-BG-002', productName: 'NOTE CROSSBODY', productType: 'W BAGS', theme: 'OCTOBER (10)', color: 'BLACK', composition: 'CANVAS/LEATHER', srp: 52000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-W-SL-001', productName: 'CHECK CONTINENTAL WALLET', productType: 'W SLG', theme: 'AUGUST (08)', color: 'TAN', composition: 'CANVAS/LEATHER', srp: 19000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    // ── BURBERRY MEN'S ──
    { skuCode: 'BUR-M-OW-001', productName: 'QUILTED THERMOREGULATED JACKET', productType: 'M OUTERWEAR', theme: 'NOVEMBER (11)', color: 'BLACK', composition: '100% POLYAMIDE', srp: 62000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-M-TP-001', productName: 'CHECK COTTON POLO', productType: 'M TOPS', theme: 'AUGUST (08)', color: 'NAVY', composition: '100% COTTON', srp: 18000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-M-BG-001', productName: 'CHECK MESSENGER BAG', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'TAN', composition: 'CANVAS/LEATHER', srp: 48000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
  ];

  for (const sku of newSkus) {
    await prisma.skuCatalog.upsert({
      where: { skuCode: sku.skuCode },
      update: {},
      create: sku,
    });
  }
  console.log(`  ✅ ${newSkus.length} additional SKUs created (total ~${15 + newSkus.length})\n`);

  // Reload all SKUs for later use
  const allSkus = await prisma.skuCatalog.findMany();
  const skuMap = new Map(allSkus.map(s => [s.skuCode, s]));

  // ======================================================================
  // 2. BUDGETS (6 new)
  // ======================================================================

  console.log('💰 Creating budgets...');

  const budgetDefs = [
    { budgetCode: 'BUD-FER-SS-Pre-2026',  groupBrandId: brandFER.id, seasonGroupId: 'SS', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 5_000_000_000,  status: 'APPROVED' as const },
    { budgetCode: 'BUD-FER-SS-Main-2026', groupBrandId: brandFER.id, seasonGroupId: 'SS', seasonType: 'main', fiscalYear: 2026, totalBudget: 8_500_000_000,  status: 'APPROVED' as const },
    { budgetCode: 'BUD-BUR-FW-Pre-2026',  groupBrandId: brandBUR.id, seasonGroupId: 'FW', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 6_200_000_000,  status: 'APPROVED' as const },
    { budgetCode: 'BUD-GUC-SS-Pre-2026',  groupBrandId: brandGUC.id, seasonGroupId: 'SS', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 12_000_000_000, status: 'LEVEL1_APPROVED' as const },
    { budgetCode: 'BUD-PRA-FW-Main-2026', groupBrandId: brandPRA.id, seasonGroupId: 'FW', seasonType: 'main', fiscalYear: 2026, totalBudget: 7_800_000_000,  status: 'SUBMITTED' as const },
    { budgetCode: 'BUD-FER-FW-Pre-2026',  groupBrandId: brandFER.id, seasonGroupId: 'FW', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 4_500_000_000,  status: 'APPROVED' as const },
  ];

  const budgets: Record<string, any> = {};
  const budgetDetails: Record<string, { rex: any; ttp: any }> = {};

  for (const bd of budgetDefs) {
    const budget = await prisma.budget.create({
      data: {
        ...bd,
        totalBudget: d(bd.totalBudget),
        createdById: userMerch.id,
      },
    });
    budgets[bd.budgetCode] = budget;

    // Budget Details: REX ~60%, TTP ~40%
    const rexPct = 0.60;
    const ttpPct = 0.40;
    const rexDetail = await prisma.budgetDetail.create({
      data: {
        budgetId: budget.id,
        storeId: storeREX.id,
        budgetAmount: d(Math.round(bd.totalBudget * rexPct)),
      },
    });
    const ttpDetail = await prisma.budgetDetail.create({
      data: {
        budgetId: budget.id,
        storeId: storeTTP.id,
        budgetAmount: d(Math.round(bd.totalBudget * ttpPct)),
      },
    });
    budgetDetails[bd.budgetCode] = { rex: rexDetail, ttp: ttpDetail };
  }

  console.log(`  ✅ ${budgetDefs.length} budgets with ${budgetDefs.length * 2} budget details created\n`);

  // ======================================================================
  // 3. PLANNING VERSIONS + DETAILS
  // ======================================================================

  console.log('📊 Creating planning versions and details...');

  const approvedBudgetCodes = [
    'BUD-FER-SS-Pre-2026', 'BUD-FER-SS-Main-2026',
    'BUD-BUR-FW-Pre-2026', 'BUD-FER-FW-Pre-2026',
  ];

  const planningVersions: Record<string, any> = {};

  for (const code of approvedBudgetCodes) {
    const budget = budgets[code];
    const details = budgetDetails[code];

    for (const storeEntry of [
      { key: 'rex', detail: details.rex, storeCode: 'REX' },
      { key: 'ttp', detail: details.ttp, storeCode: 'TTP' },
    ]) {
      const planCode = `PLN-${code}-${storeEntry.storeCode}-V1`;
      const pv = await prisma.planningVersion.create({
        data: {
          planningCode: planCode,
          budgetDetailId: storeEntry.detail.id,
          versionNumber: 1,
          versionName: `${code} ${storeEntry.storeCode} Version 1`,
          status: 'APPROVED',
          isFinal: true,
          createdById: userMerch.id,
        },
      });
      planningVersions[planCode] = pv;

      const budgetAmt = parseFloat(storeEntry.detail.budgetAmount.toString());

      // ── Collection dimension ──
      const collDetails = [
        { collectionId: collCarryOver.id, pct: 0.40, label: 'Carry Over' },
        { collectionId: collSeasonal.id, pct: 0.60, label: 'Seasonal' },
      ];
      for (const cd of collDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'collection',
            collectionId: cd.collectionId,
            lastSeasonSales: d(Math.round(budgetAmt * cd.pct * 0.92)),
            lastSeasonPct: d(cd.pct * 100),
            systemBuyPct: d(cd.pct * 100),
            userBuyPct: d(cd.pct * 100),
            otbValue: d(Math.round(budgetAmt * cd.pct)),
            variancePct: d(0),
          },
        });
      }

      // ── Gender dimension ──
      const genderDetails = [
        { genderId: genderF.id, pct: 0.60 },
        { genderId: genderM.id, pct: 0.40 },
      ];
      for (const gd of genderDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'gender',
            genderId: gd.genderId,
            lastSeasonSales: d(Math.round(budgetAmt * gd.pct * 0.88)),
            lastSeasonPct: d(gd.pct * 100),
            systemBuyPct: d(gd.pct * 100),
            userBuyPct: d(gd.pct * 100),
            otbValue: d(Math.round(budgetAmt * gd.pct)),
            variancePct: d(0),
          },
        });
      }

      // ── Category dimension ──
      const catDetails = [
        { categoryId: catWomenRtw.id, pct: 0.25 },
        { categoryId: catWomenHardAcc.id, pct: 0.20 },
        { categoryId: catWomenOthers.id, pct: 0.15 },
        { categoryId: catMenRtw.id, pct: 0.22 },
        { categoryId: catMenAcc.id, pct: 0.18 },
      ];
      for (const cat of catDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'category',
            categoryId: cat.categoryId,
            lastSeasonSales: d(Math.round(budgetAmt * cat.pct * 0.90)),
            lastSeasonPct: d(cat.pct * 100),
            systemBuyPct: d(cat.pct * 100),
            userBuyPct: d(cat.pct * 100),
            otbValue: d(Math.round(budgetAmt * cat.pct)),
            variancePct: d(0),
          },
        });
      }

      // ── Sub-category details (for Women's RTW breakdown) ──
      const subCatDetails = [
        { subCategoryId: subW_outerwear.id, categoryId: catWomenRtw.id, pct: 0.10 },
        { subCategoryId: subW_tops.id, categoryId: catWomenRtw.id, pct: 0.08 },
        { subCategoryId: subW_dresses.id, categoryId: catWomenRtw.id, pct: 0.07 },
        { subCategoryId: subW_bags.id, categoryId: catWomenHardAcc.id, pct: 0.12 },
        { subCategoryId: subW_slg.id, categoryId: catWomenHardAcc.id, pct: 0.08 },
        { subCategoryId: subM_outerwear.id, categoryId: catMenRtw.id, pct: 0.09 },
        { subCategoryId: subM_tops.id, categoryId: catMenRtw.id, pct: 0.07 },
        { subCategoryId: subM_bags.id, categoryId: catMenAcc.id, pct: 0.10 },
        { subCategoryId: subM_slg.id, categoryId: catMenAcc.id, pct: 0.05 },
      ];
      for (const sc of subCatDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'category',
            categoryId: sc.categoryId,
            subCategoryId: sc.subCategoryId,
            lastSeasonSales: d(Math.round(budgetAmt * sc.pct * 0.87)),
            lastSeasonPct: d(sc.pct * 100),
            systemBuyPct: d(sc.pct * 100),
            userBuyPct: d(sc.pct * 100),
            otbValue: d(Math.round(budgetAmt * sc.pct)),
            variancePct: d(0),
          },
        });
      }
    }
  }

  const pvCount = Object.keys(planningVersions).length;
  console.log(`  ✅ ${pvCount} planning versions with detailed breakdowns created\n`);

  // ======================================================================
  // 4. PROPOSALS WITH PRODUCTS
  // ======================================================================

  console.log('📋 Creating proposals with products...');

  // Helper to build a product row
  function buildProduct(
    skuCode: string, collection: string, gender: string,
    category: string, subCategory: string,
    unitCostPct: number, orderQty: number, customerTarget: string, sortOrder: number,
  ) {
    const sku = skuMap.get(skuCode);
    if (!sku) throw new Error(`SKU not found: ${skuCode}`);
    const srp = parseFloat(sku.srp.toString());
    const unitCost = Math.round(srp * unitCostPct);
    const totalValue = unitCost * orderQty;
    return {
      skuId: sku.id,
      skuCode: sku.skuCode,
      productName: sku.productName,
      collection,
      gender,
      category,
      subCategory,
      theme: sku.theme,
      color: sku.color,
      composition: sku.composition,
      unitCost: d(unitCost),
      srp: d(srp),
      orderQty,
      totalValue: d(totalValue),
      customerTarget,
      sortOrder,
    };
  }

  // ── Proposal 1: FER SS Pre 2026 - REX Womenswear (APPROVED) ──
  const budFerSSPre = budgets['BUD-FER-SS-Pre-2026'];
  const pvFerSSPreREX = planningVersions['PLN-BUD-FER-SS-Pre-2026-REX-V1'];

  const proposal1Products = [
    buildProduct('FER-W-OW-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 8, 'VIP', 1),
    buildProduct('FER-W-TP-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Tops', 0.42, 12, 'New', 2),
    buildProduct('FER-W-TP-003', 'Carry Over', 'Female', "WOMEN'S RTW", 'W Tops', 0.43, 10, 'Existing', 3),
    buildProduct('FER-W-DR-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 6, 'VIP', 4),
    buildProduct('FER-W-BG-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.47, 10, 'VIP', 5),
    buildProduct('FER-W-BG-002', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.45, 8, 'Existing', 6),
    buildProduct('FER-W-BG-005', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.42, 15, 'New', 7),
    buildProduct('FER-W-SL-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 15, 'New', 8),
    buildProduct('FER-W-SL-002', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 12, 'Existing', 9),
    buildProduct('FER-W-SH-001', 'Carry Over', 'Female', 'OTHERS', "Women's Shoes", 0.43, 10, 'VIP', 10),
    buildProduct('FER-W-SH-002', 'Seasonal', 'Female', 'OTHERS', "Women's Shoes", 0.44, 8, 'Existing', 11),
    buildProduct('8116500', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.46, 5, 'VIP', 12),
  ];

  const p1TotalValue = proposal1Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p1TotalQty = proposal1Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal1 = await prisma.proposal.create({
    data: {
      ticketName: 'FER SS Pre 2026 - REX Womenswear',
      budgetId: budFerSSPre.id,
      planningVersionId: pvFerSSPreREX.id,
      status: 'APPROVED',
      totalSkuCount: proposal1Products.length,
      totalOrderQty: p1TotalQty,
      totalValue: d(p1TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal1Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal1.id, ...prod },
    });
    // Allocations: REX 60%, TTP 40%
    const rexQty = Math.ceil(prod.orderQty * 0.6);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  // ── Proposal 2: FER SS Pre 2026 - TTP Full Range (SUBMITTED) ──
  const pvFerSSPreTTP = planningVersions['PLN-BUD-FER-SS-Pre-2026-TTP-V1'];

  const proposal2Products = [
    buildProduct('FER-W-OW-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 5, 'Existing', 1),
    buildProduct('FER-W-TP-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Tops', 0.42, 8, 'New', 2),
    buildProduct('FER-W-BG-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.47, 6, 'VIP', 3),
    buildProduct('FER-W-SL-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 10, 'New', 4),
    buildProduct('FER-W-SH-001', 'Carry Over', 'Female', 'OTHERS', "Women's Shoes", 0.43, 6, 'Existing', 5),
    buildProduct('FER-M-TP-001', 'Seasonal', 'Male', "MEN'S RTW", 'M Tops', 0.42, 10, 'New', 6),
    buildProduct('FER-M-BG-001', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.46, 4, 'VIP', 7),
    buildProduct('FER-M-SL-001', 'Carry Over', 'Male', 'MEN ACCESSORIES', 'M SLG', 0.40, 12, 'Existing', 8),
    buildProduct('FER-M-SL-002', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M SLG', 0.40, 10, 'New', 9),
    buildProduct('FER-W-DR-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 4, 'VIP', 10),
  ];

  const p2TotalValue = proposal2Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p2TotalQty = proposal2Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal2 = await prisma.proposal.create({
    data: {
      ticketName: 'FER SS Pre 2026 - TTP Full Range',
      budgetId: budFerSSPre.id,
      planningVersionId: pvFerSSPreTTP.id,
      status: 'SUBMITTED',
      totalSkuCount: proposal2Products.length,
      totalOrderQty: p2TotalQty,
      totalValue: d(p2TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal2Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal2.id, ...prod },
    });
    const rexQty = Math.ceil(prod.orderQty * 0.55);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  // ── Proposal 3: BUR FW Pre 2026 - REX Collection (LEVEL1_APPROVED) ──
  const budBurFWPre = budgets['BUD-BUR-FW-Pre-2026'];
  const pvBurFWPreREX = planningVersions['PLN-BUD-BUR-FW-Pre-2026-REX-V1'];

  const proposal3Products = [
    buildProduct('BUR-W-OW-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 6, 'VIP', 1),
    buildProduct('8116500', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.46, 4, 'VIP', 2),
    buildProduct('8116501', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.48, 3, 'VIP', 3),
    buildProduct('BUR-W-BG-001', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.46, 5, 'Existing', 4),
    buildProduct('BUR-W-BG-002', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.44, 8, 'New', 5),
    buildProduct('BUR-W-SL-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 10, 'New', 6),
    buildProduct('BUR-M-OW-001', 'Seasonal', 'Male', "MEN'S RTW", 'M Outerwear', 0.46, 5, 'Existing', 7),
    buildProduct('BUR-M-BG-001', 'Carry Over', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.44, 6, 'New', 8),
  ];

  const p3TotalValue = proposal3Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p3TotalQty = proposal3Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal3 = await prisma.proposal.create({
    data: {
      ticketName: 'BUR FW Pre 2026 - REX Collection',
      budgetId: budBurFWPre.id,
      planningVersionId: pvBurFWPreREX.id,
      status: 'LEVEL1_APPROVED',
      totalSkuCount: proposal3Products.length,
      totalOrderQty: p3TotalQty,
      totalValue: d(p3TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal3Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal3.id, ...prod },
    });
    const rexQty = Math.ceil(prod.orderQty * 0.65);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  // ── Proposal 4: FER SS Main 2026 - REX Premium (DRAFT) ──
  const budFerSSMain = budgets['BUD-FER-SS-Main-2026'];
  const pvFerSSMainREX = planningVersions['PLN-BUD-FER-SS-Main-2026-REX-V1'];

  const proposal4Products = [
    buildProduct('FER-W-OW-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.46, 6, 'VIP', 1),
    buildProduct('FER-W-OW-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 8, 'VIP', 2),
    buildProduct('FER-W-OW-003', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.47, 4, 'VIP', 3),
    buildProduct('FER-W-TP-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Tops', 0.42, 10, 'New', 4),
    buildProduct('FER-W-TP-002', 'Carry Over', 'Female', "WOMEN'S RTW", 'W Tops', 0.43, 8, 'Existing', 5),
    buildProduct('FER-W-DR-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 6, 'VIP', 6),
    buildProduct('FER-W-DR-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 5, 'Existing', 7),
    buildProduct('FER-W-DR-003', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.45, 4, 'VIP', 8),
    buildProduct('FER-W-BG-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.47, 8, 'VIP', 9),
    buildProduct('FER-W-BG-004', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.48, 5, 'VIP', 10),
    buildProduct('FER-W-SL-003', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 12, 'Existing', 11),
    buildProduct('FER-M-OW-001', 'Seasonal', 'Male', "MEN'S RTW", 'M Outerwear', 0.45, 6, 'Existing', 12),
    buildProduct('FER-M-OW-002', 'Seasonal', 'Male', "MEN'S RTW", 'M Outerwear', 0.47, 4, 'VIP', 13),
    buildProduct('FER-M-BG-001', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.46, 5, 'VIP', 14),
    buildProduct('FER-M-BG-002', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.44, 7, 'New', 15),
  ];

  const p4TotalValue = proposal4Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p4TotalQty = proposal4Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal4 = await prisma.proposal.create({
    data: {
      ticketName: 'FER SS Main 2026 - REX Premium',
      budgetId: budFerSSMain.id,
      planningVersionId: pvFerSSMainREX.id,
      status: 'DRAFT',
      totalSkuCount: proposal4Products.length,
      totalOrderQty: p4TotalQty,
      totalValue: d(p4TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal4Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal4.id, ...prod },
    });
    const rexQty = Math.ceil(prod.orderQty * 0.6);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  console.log(`  ✅ 4 proposals created:`);
  console.log(`     P1: ${proposal1Products.length} products, ${(p1TotalValue / 1e9).toFixed(2)}B VND (APPROVED)`);
  console.log(`     P2: ${proposal2Products.length} products, ${(p2TotalValue / 1e9).toFixed(2)}B VND (SUBMITTED)`);
  console.log(`     P3: ${proposal3Products.length} products, ${(p3TotalValue / 1e9).toFixed(2)}B VND (LEVEL1_APPROVED)`);
  console.log(`     P4: ${proposal4Products.length} products, ${(p4TotalValue / 1e9).toFixed(2)}B VND (DRAFT)\n`);

  // ======================================================================
  // 5. APPROVALS
  // ======================================================================

  console.log('✅ Creating approval records...');

  const approvalRecords: Array<{
    entityType: string;
    entityId: string;
    level: number;
    deciderId: string;
    action: 'APPROVED' | 'REJECTED';
    comment: string;
    decidedAt: Date;
  }> = [];

  // Approved budgets: L1 (manager) + L2 (finance)
  for (const code of ['BUD-FER-SS-Pre-2026', 'BUD-FER-SS-Main-2026', 'BUD-BUR-FW-Pre-2026', 'BUD-FER-FW-Pre-2026']) {
    approvalRecords.push(
      {
        entityType: 'budget', entityId: budgets[code].id, level: 1,
        deciderId: userManager.id, action: 'APPROVED',
        comment: 'Budget allocation looks appropriate for the season.',
        decidedAt: daysAgo(rand(14, 21)),
      },
      {
        entityType: 'budget', entityId: budgets[code].id, level: 2,
        deciderId: userFinance.id, action: 'APPROVED',
        comment: 'Approved — within financial guidelines.',
        decidedAt: daysAgo(rand(7, 13)),
      },
    );
  }

  // LEVEL1_APPROVED budget: only L1
  approvalRecords.push({
    entityType: 'budget', entityId: budgets['BUD-GUC-SS-Pre-2026'].id, level: 1,
    deciderId: userManager.id, action: 'APPROVED',
    comment: 'Gucci allocation approved at L1. Pending finance review.',
    decidedAt: daysAgo(5),
  });

  // Approved planning versions
  for (const pvKey of Object.keys(planningVersions)) {
    approvalRecords.push(
      {
        entityType: 'planning', entityId: planningVersions[pvKey].id, level: 1,
        deciderId: userManager.id, action: 'APPROVED',
        comment: 'Planning splits are well balanced.',
        decidedAt: daysAgo(rand(10, 18)),
      },
      {
        entityType: 'planning', entityId: planningVersions[pvKey].id, level: 2,
        deciderId: userFinance.id, action: 'APPROVED',
        comment: 'Approved.',
        decidedAt: daysAgo(rand(5, 9)),
      },
    );
  }

  // Proposal 1 approvals (APPROVED)
  approvalRecords.push(
    {
      entityType: 'proposal', entityId: proposal1.id, level: 1,
      deciderId: userManager.id, action: 'APPROVED',
      comment: 'Excellent SKU selection for REX womenswear. Good mix of carry-over and seasonal.',
      decidedAt: daysAgo(6),
    },
    {
      entityType: 'proposal', entityId: proposal1.id, level: 2,
      deciderId: userFinance.id, action: 'APPROVED',
      comment: 'Total value within budget. Approved for ordering.',
      decidedAt: daysAgo(3),
    },
  );

  // Proposal 3 approvals (LEVEL1_APPROVED)
  approvalRecords.push({
    entityType: 'proposal', entityId: proposal3.id, level: 1,
    deciderId: userManager.id, action: 'APPROVED',
    comment: 'Burberry FW collection looks strong. Good outerwear focus for the season.',
    decidedAt: daysAgo(2),
  });

  for (const ar of approvalRecords) {
    await prisma.approval.create({ data: ar });
  }

  console.log(`  ✅ ${approvalRecords.length} approval records created\n`);

  // ======================================================================
  // 6. SALES HISTORY (~200+ records)
  // ======================================================================

  console.log('📈 Creating sales history records...');

  const seasons = ['SS-Pre-2025', 'FW-Main-2024', 'SS-Pre-2024'];
  const sizeCodes = ['0002', '0004', '0006', '0008', '0010'];
  const sizeLabels: Record<string, string> = {
    '0002': 'XS', '0004': 'S', '0006': 'M', '0008': 'L', '0010': 'XL',
  };

  // Different sell-through profiles by product type
  const sellThroughProfiles: Record<string, { min: number; max: number }> = {
    'W OUTERWEAR': { min: 70, max: 92 },
    'W TOPS':      { min: 65, max: 88 },
    'W DRESSES':   { min: 60, max: 85 },
    'W BAGS':      { min: 75, max: 95 },
    'W SLG':       { min: 70, max: 90 },
    'W SHOES':     { min: 60, max: 82 },
    'M OUTERWEAR': { min: 62, max: 85 },
    'M TOPS':      { min: 58, max: 80 },
    'M BAGS':      { min: 65, max: 88 },
    'M SLG':       { min: 68, max: 88 },
  };

  const salesHistoryData: Array<{
    skuCode: string;
    storeId: string;
    sizeCode: string;
    season: string;
    quantityBought: number;
    quantitySold: number;
    sellThroughPct: Prisma.Decimal;
  }> = [];

  for (const sku of allSkus) {
    const profile = sellThroughProfiles[sku.productType] || { min: 55, max: 80 };
    // Use 4-5 sizes per SKU (bags/SLG only use 3 for "one size" logic)
    const isBagOrSlg = sku.productType.includes('BAGS') || sku.productType.includes('SLG');
    const skuSizes = isBagOrSlg
      ? ['0004', '0006', '0008'] // S, M, L only
      : sizeCodes.slice(0, rand(4, 5));

    for (const season of seasons) {
      for (const store of [storeREX, storeTTP]) {
        for (const size of skuSizes) {
          const bought = rand(5, 30);
          const stPct = randDec(profile.min, profile.max);
          const sold = Math.round(bought * stPct / 100);
          salesHistoryData.push({
            skuCode: sku.skuCode,
            storeId: store.id,
            sizeCode: size,
            season,
            quantityBought: bought,
            quantitySold: sold,
            sellThroughPct: d(stPct),
          });
        }
      }
    }
  }

  // Batch insert
  const BATCH = 100;
  for (let i = 0; i < salesHistoryData.length; i += BATCH) {
    await prisma.salesHistory.createMany({
      data: salesHistoryData.slice(i, i + BATCH),
    });
  }

  console.log(`  ✅ ${salesHistoryData.length} sales history records created\n`);

  // ======================================================================
  // 7. SKU PERFORMANCE (~80+ records)
  // ======================================================================

  console.log('🎯 Creating SKU performance records...');

  const perfData: Array<{
    skuId: string;
    skuCode: string;
    seasonGroup: string;
    fiscalYear: number;
    storeId: string | null;
    quantityBought: number;
    quantitySold: number;
    sellThroughPct: Prisma.Decimal;
    avgSellingPrice: Prisma.Decimal;
    totalRevenue: Prisma.Decimal;
    grossMarginPct: Prisma.Decimal;
    markdownPct: Prisma.Decimal;
    weeksToSellThru: number | null;
    performanceScore: number;
    velocityScore: number;
    marginScore: number;
  }> = [];

  for (const sku of allSkus) {
    const srp = parseFloat(sku.srp.toString());

    for (const sg of ['SS', 'FW']) {
      for (const fy of [2024, 2025]) {
        // Per store + aggregated (null)
        const stores: Array<{ id: string | null; factor: number }> = [
          { id: storeREX.id, factor: 0.6 },
          { id: storeTTP.id, factor: 0.4 },
          { id: null, factor: 1.0 },
        ];

        for (const st of stores) {
          const baseBought = rand(20, 120);
          const bought = Math.round(baseBought * st.factor);
          const stPct = randDec(55, 92);
          const sold = Math.round(bought * stPct / 100);
          const avgPrice = srp * randDec(0.85, 1.0);
          const revenue = sold * avgPrice;
          const grossMargin = randDec(45, 68);
          const markdown = randDec(5, 35);
          const weeks = rand(4, 20);
          const perfScore = rand(35, 95);
          const velScore = rand(30, 90);
          const margScore = rand(40, 85);

          perfData.push({
            skuId: sku.id,
            skuCode: sku.skuCode,
            seasonGroup: sg,
            fiscalYear: fy,
            storeId: st.id,
            quantityBought: bought,
            quantitySold: sold,
            sellThroughPct: d(stPct),
            avgSellingPrice: d(Math.round(avgPrice)),
            totalRevenue: d(Math.round(revenue)),
            grossMarginPct: d(grossMargin),
            markdownPct: d(markdown),
            weeksToSellThru: weeks,
            performanceScore: perfScore,
            velocityScore: velScore,
            marginScore: margScore,
          });
        }
      }
    }
  }

  for (let i = 0; i < perfData.length; i += BATCH) {
    await prisma.skuPerformance.createMany({
      data: perfData.slice(i, i + BATCH),
    });
  }

  console.log(`  ✅ ${perfData.length} SKU performance records created\n`);

  // ======================================================================
  // 8. ATTRIBUTE TRENDS (~60+ records)
  // ======================================================================

  console.log('📊 Creating attribute trend records...');

  const trendData: Array<{
    attributeType: string;
    attributeValue: string;
    category: string | null;
    seasonGroup: string;
    fiscalYear: number;
    totalSkus: number;
    avgSellThrough: Prisma.Decimal;
    avgMargin: Prisma.Decimal;
    trendScore: number;
    yoyGrowth: Prisma.Decimal | null;
  }> = [];

  // Color trends
  const colorTrends = [
    { value: 'BLACK', score: 85, st: 82, margin: 62 },
    { value: 'HONEY', score: 80, st: 78, margin: 58 },
    { value: 'WINE RED', score: 75, st: 74, margin: 56 },
    { value: 'NAVY', score: 70, st: 72, margin: 55 },
    { value: 'IVORY', score: 65, st: 68, margin: 52 },
    { value: 'CAMEL', score: 60, st: 65, margin: 50 },
    { value: 'BURGUNDY', score: 72, st: 73, margin: 54 },
    { value: 'FOREST GREEN', score: 55, st: 60, margin: 48 },
    { value: 'DUSTY PINK', score: 68, st: 70, margin: 53 },
    { value: 'EMERALD', score: 58, st: 62, margin: 49 },
    { value: 'GREY', score: 63, st: 66, margin: 51 },
    { value: 'TAN', score: 66, st: 69, margin: 52 },
  ];

  for (const ct of colorTrends) {
    for (const sg of ['SS', 'FW']) {
      for (const fy of [2024, 2025]) {
        // Overall (null category)
        trendData.push({
          attributeType: 'color',
          attributeValue: ct.value,
          category: null,
          seasonGroup: sg,
          fiscalYear: fy,
          totalSkus: rand(3, 15),
          avgSellThrough: d(ct.st + randDec(-3, 3)),
          avgMargin: d(ct.margin + randDec(-2, 2)),
          trendScore: ct.score + rand(-3, 3),
          yoyGrowth: fy === 2025 ? d(randDec(-10, 20)) : null,
        });
      }
    }
  }

  // Composition trends
  const compTrends = [
    { value: '100% LEATHER', score: 82, st: 80, margin: 65 },
    { value: '80% WOOL 20% CASHMERE', score: 78, st: 76, margin: 60 },
    { value: '100% SILK', score: 73, st: 72, margin: 58 },
    { value: '100% COTTON', score: 65, st: 68, margin: 50 },
    { value: '100% POLYAMIDE', score: 60, st: 62, margin: 48 },
    { value: 'CANVAS/LEATHER', score: 70, st: 71, margin: 55 },
    { value: '100% NYLON', score: 62, st: 64, margin: 49 },
  ];

  for (const ct of compTrends) {
    for (const sg of ['SS', 'FW']) {
      trendData.push({
        attributeType: 'composition',
        attributeValue: ct.value,
        category: null,
        seasonGroup: sg,
        fiscalYear: 2025,
        totalSkus: rand(4, 12),
        avgSellThrough: d(ct.st + randDec(-2, 2)),
        avgMargin: d(ct.margin + randDec(-2, 2)),
        trendScore: ct.score + rand(-2, 2),
        yoyGrowth: d(randDec(-8, 18)),
      });
    }
  }

  // Theme trends
  const themeTrends = [
    { value: 'SEPTEMBER (09)', score: 85 },
    { value: 'OCTOBER (10)', score: 80 },
    { value: 'AUGUST (08)', score: 75 },
    { value: 'NOVEMBER (11)', score: 68 },
    { value: 'DECEMBER (12)', score: 55 },
  ];

  for (const tt of themeTrends) {
    for (const sg of ['SS', 'FW']) {
      trendData.push({
        attributeType: 'theme',
        attributeValue: tt.value,
        category: null,
        seasonGroup: sg,
        fiscalYear: 2025,
        totalSkus: rand(5, 20),
        avgSellThrough: d(randDec(65, 85)),
        avgMargin: d(randDec(48, 62)),
        trendScore: tt.score + rand(-3, 3),
        yoyGrowth: d(randDec(-5, 25)),
      });
    }
  }

  // Product type trends
  const typeTrends = [
    { value: 'W OUTERWEAR', score: 80, cat: "WOMEN'S RTW" },
    { value: 'W TOPS', score: 72, cat: "WOMEN'S RTW" },
    { value: 'W DRESSES', score: 68, cat: "WOMEN'S RTW" },
    { value: 'W BAGS', score: 85, cat: 'WOMEN HARD ACCESSORIES' },
    { value: 'W SLG', score: 65, cat: 'WOMEN HARD ACCESSORIES' },
    { value: 'W SHOES', score: 62, cat: 'OTHERS' },
    { value: 'M OUTERWEAR', score: 72, cat: "MEN'S RTW" },
    { value: 'M TOPS', score: 60, cat: "MEN'S RTW" },
    { value: 'M BAGS', score: 70, cat: 'MEN ACCESSORIES' },
    { value: 'M SLG', score: 58, cat: 'MEN ACCESSORIES' },
  ];

  for (const pt of typeTrends) {
    for (const sg of ['SS', 'FW']) {
      for (const fy of [2024, 2025]) {
        trendData.push({
          attributeType: 'product_type',
          attributeValue: pt.value,
          category: pt.cat,
          seasonGroup: sg,
          fiscalYear: fy,
          totalSkus: rand(3, 12),
          avgSellThrough: d(randDec(60, 88)),
          avgMargin: d(randDec(46, 65)),
          trendScore: pt.score + rand(-4, 4),
          yoyGrowth: fy === 2025 ? d(randDec(-15, 25)) : null,
        });
      }
    }
  }

  for (let i = 0; i < trendData.length; i += BATCH) {
    await prisma.attributeTrend.createMany({
      data: trendData.slice(i, i + BATCH),
    });
  }

  console.log(`  ✅ ${trendData.length} attribute trend records created\n`);

  // ======================================================================
  // 9. ALLOCATION HISTORY (~50+ records)
  // ======================================================================

  console.log('📜 Creating allocation history records...');

  const allocHistData: Array<{
    budgetId: string;
    seasonGroup: string;
    seasonType: string;
    fiscalYear: number;
    dimensionType: string;
    dimensionValue: string;
    allocatedPct: Prisma.Decimal;
    allocatedAmount: Prisma.Decimal;
    actualSales: Prisma.Decimal | null;
    sellThroughPct: Prisma.Decimal | null;
  }> = [];

  const allocYears = [2023, 2024, 2025];
  const allocSeasons: Array<{ sg: string; st: string }> = [
    { sg: 'SS', st: 'Pre' },
    { sg: 'SS', st: 'Main' },
    { sg: 'FW', st: 'Pre' },
    { sg: 'FW', st: 'Main' },
  ];

  // Use the FER SS Pre budget ID as reference (arbitrary — AllocationHistory.budgetId has no FK constraint)
  const refBudgetId = budgets['BUD-FER-SS-Pre-2026'].id;

  for (const fy of allocYears) {
    for (const as of allocSeasons) {
      const baseBudget = rand(3, 10) * 1_000_000_000; // 3B-10B VND

      // Collection dimension
      const coSplit = randDec(35, 42);
      const seSplit = 100 - coSplit;
      const collDims = [
        { value: 'Carry Over', pct: coSplit },
        { value: 'Seasonal', pct: seSplit },
      ];
      for (const cd of collDims) {
        const amt = Math.round(baseBudget * cd.pct / 100);
        const isPast = fy < 2025;
        allocHistData.push({
          budgetId: refBudgetId,
          seasonGroup: as.sg,
          seasonType: as.st,
          fiscalYear: fy,
          dimensionType: 'collection',
          dimensionValue: cd.value,
          allocatedPct: d(cd.pct),
          allocatedAmount: d(amt),
          actualSales: isPast ? d(Math.round(amt * randDec(0.75, 0.95))) : null,
          sellThroughPct: isPast ? d(randDec(68, 88)) : null,
        });
      }

      // Gender dimension
      const fSplit = randDec(55, 63);
      const mSplit = 100 - fSplit;
      const genDims = [
        { value: 'Female', pct: fSplit },
        { value: 'Male', pct: mSplit },
      ];
      for (const gd of genDims) {
        const amt = Math.round(baseBudget * gd.pct / 100);
        const isPast = fy < 2025;
        allocHistData.push({
          budgetId: refBudgetId,
          seasonGroup: as.sg,
          seasonType: as.st,
          fiscalYear: fy,
          dimensionType: 'gender',
          dimensionValue: gd.value,
          allocatedPct: d(gd.pct),
          allocatedAmount: d(amt),
          actualSales: isPast ? d(Math.round(amt * randDec(0.72, 0.92))) : null,
          sellThroughPct: isPast ? d(randDec(65, 85)) : null,
        });
      }

      // Category dimension
      const catDims = [
        { value: "WOMEN'S RTW", pctRange: [22, 28] },
        { value: 'WOMEN HARD ACCESSORIES', pctRange: [18, 22] },
        { value: 'OTHERS', pctRange: [8, 12] },
        { value: "MEN'S RTW", pctRange: [15, 20] },
        { value: 'MEN ACCESSORIES', pctRange: [10, 14] },
      ];

      // Normalize category pcts to sum to 100
      let rawPcts = catDims.map(c => randDec(c.pctRange[0], c.pctRange[1]));
      const rawSum = rawPcts.reduce((s, v) => s + v, 0);
      rawPcts = rawPcts.map(p => parseFloat((p * 100 / rawSum).toFixed(2)));
      // Adjust last to ensure sum = 100
      rawPcts[rawPcts.length - 1] = parseFloat((100 - rawPcts.slice(0, -1).reduce((s, v) => s + v, 0)).toFixed(2));

      for (let ci = 0; ci < catDims.length; ci++) {
        const pct = rawPcts[ci];
        const amt = Math.round(baseBudget * pct / 100);
        const isPast = fy < 2025;
        allocHistData.push({
          budgetId: refBudgetId,
          seasonGroup: as.sg,
          seasonType: as.st,
          fiscalYear: fy,
          dimensionType: 'category',
          dimensionValue: catDims[ci].value,
          allocatedPct: d(pct),
          allocatedAmount: d(amt),
          actualSales: isPast ? d(Math.round(amt * randDec(0.70, 0.93))) : null,
          sellThroughPct: isPast ? d(randDec(62, 90)) : null,
        });
      }
    }
  }

  for (let i = 0; i < allocHistData.length; i += BATCH) {
    await prisma.allocationHistory.createMany({
      data: allocHistData.slice(i, i + BATCH),
    });
  }

  console.log(`  ✅ ${allocHistData.length} allocation history records created\n`);

  // ======================================================================
  // 10. BUDGET ALERTS (~10 alerts)
  // ======================================================================

  console.log('🚨 Creating budget alerts...');

  const alertData = [
    // Critical: Over budget
    {
      budgetId: budgets['BUD-FER-SS-Pre-2026'].id,
      alertType: 'over_budget',
      severity: 'critical',
      title: 'Budget Overspend Alert',
      message: 'Ferragamo SS Pre-2026 committed proposals exceed allocated budget by 8.5%. Current committed: 5,425,000,000 VND vs budget: 5,000,000,000 VND. Review and adjust proposals immediately.',
      metricValue: d(5_425_000_000),
      threshold: d(5_000_000_000),
      category: null,
      isRead: false,
    },
    {
      budgetId: budgets['BUD-FER-SS-Main-2026'].id,
      alertType: 'over_budget',
      severity: 'critical',
      title: 'Budget Threshold Exceeded',
      message: 'Ferragamo SS Main-2026 REX store allocation is at 105% utilization. Proposals total 5,355,000,000 VND against store budget of 5,100,000,000 VND.',
      metricValue: d(5_355_000_000),
      threshold: d(5_100_000_000),
      category: null,
      isRead: true,
    },
    // Warning: Pace warning
    {
      budgetId: budgets['BUD-BUR-FW-Pre-2026'].id,
      alertType: 'pace_warning',
      severity: 'warning',
      title: 'Slow Commitment Pace',
      message: 'Burberry FW Pre-2026 has only 34% of budget committed with 60% of the buying window elapsed. Consider accelerating proposal submissions.',
      metricValue: d(34),
      threshold: d(50),
      category: null,
      isRead: false,
    },
    {
      budgetId: budgets['BUD-FER-SS-Pre-2026'].id,
      alertType: 'category_imbalance',
      severity: 'warning',
      title: 'Category Imbalance Detected',
      message: "WOMEN HARD ACCESSORIES allocation is 32% of total, significantly above the planned 20%. MEN'S RTW is under-represented at 12% vs planned 22%.",
      metricValue: d(32),
      threshold: d(25),
      category: 'WOMEN HARD ACCESSORIES',
      isRead: false,
    },
    {
      budgetId: budgets['BUD-FER-FW-Pre-2026'].id,
      alertType: 'category_imbalance',
      severity: 'warning',
      title: 'Category Under-Representation',
      message: "OTHERS category (shoes, accessories) has 0% allocation. Historical average is 12-15%. Consider adding shoe proposals.",
      metricValue: d(0),
      threshold: d(10),
      category: 'OTHERS',
      isRead: true,
    },
    // Info: Under-utilized
    {
      budgetId: budgets['BUD-FER-FW-Pre-2026'].id,
      alertType: 'under_utilized',
      severity: 'info',
      title: 'Budget Under-Utilized',
      message: 'Ferragamo FW Pre-2026 has 72% of budget still available. 1,260,000,000 VND committed of 4,500,000,000 VND total.',
      metricValue: d(28),
      threshold: d(40),
      category: null,
      isRead: false,
    },
    {
      budgetId: budgets['BUD-GUC-SS-Pre-2026'].id,
      alertType: 'under_utilized',
      severity: 'info',
      title: 'No Proposals Submitted',
      message: 'Gucci SS Pre-2026 budget of 12,000,000,000 VND has no proposals submitted yet. Budget approval is pending finance review.',
      metricValue: d(0),
      threshold: d(10),
      category: null,
      isRead: false,
    },
    {
      budgetId: budgets['BUD-PRA-FW-Main-2026'].id,
      alertType: 'under_utilized',
      severity: 'info',
      title: 'Budget Pending Approval',
      message: 'Prada FW Main-2026 budget is still in SUBMITTED status. No proposals can be created until budget is approved.',
      metricValue: d(0),
      threshold: d(0),
      category: null,
      isRead: true,
    },
    // Additional pace warning
    {
      budgetId: budgets['BUD-FER-SS-Main-2026'].id,
      alertType: 'pace_warning',
      severity: 'warning',
      title: 'Commitment Pace Below Target',
      message: 'FER SS Main-2026 REX has only 1 draft proposal. Target is 3+ proposals at this stage. Buyer team should prioritize additional selections.',
      metricValue: d(1),
      threshold: d(3),
      category: null,
      isRead: false,
    },
  ];

  for (const alert of alertData) {
    await prisma.budgetAlert.create({ data: alert });
  }

  console.log(`  ✅ ${alertData.length} budget alerts created\n`);

  // ======================================================================
  // 11. BUDGET SNAPSHOTS (~20 snapshots)
  // ======================================================================

  console.log('📸 Creating budget snapshots...');

  const snapshotBudgets = [
    { code: 'BUD-FER-SS-Pre-2026', total: 5_000_000_000, startUtil: 0.30, endUtil: 0.65 },
    { code: 'BUD-FER-SS-Main-2026', total: 8_500_000_000, startUtil: 0.10, endUtil: 0.52 },
  ];

  const snapshotData: Array<{
    budgetId: string;
    snapshotDate: Date;
    totalCommitted: Prisma.Decimal;
    totalPlanned: Prisma.Decimal;
    utilizationPct: Prisma.Decimal;
  }> = [];

  for (const sb of snapshotBudgets) {
    const budget = budgets[sb.code];
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const progress = (13 - dayOffset) / 13; // 0 to 1
      const utilPct = sb.startUtil + (sb.endUtil - sb.startUtil) * progress;
      const committed = Math.round(sb.total * utilPct);
      const planned = Math.round(sb.total * (utilPct + randDec(0.05, 0.15)));
      const snapDate = new Date();
      snapDate.setDate(snapDate.getDate() - dayOffset);
      snapDate.setHours(0, 0, 0, 0);

      snapshotData.push({
        budgetId: budget.id,
        snapshotDate: snapDate,
        totalCommitted: d(committed),
        totalPlanned: d(Math.min(planned, sb.total)),
        utilizationPct: d(parseFloat((utilPct * 100).toFixed(2))),
      });
    }
  }

  for (const snap of snapshotData) {
    await prisma.budgetSnapshot.create({ data: snap });
  }

  console.log(`  ✅ ${snapshotData.length} budget snapshots created\n`);

  // ======================================================================
  // SUMMARY
  // ======================================================================

  console.log('==========================================================');
  console.log('  SEED COMPLETE — Summary');
  console.log('==========================================================');
  console.log(`  SKUs:               ${allSkus.length} total (${newSkus.length} new)`);
  console.log(`  Budgets:            ${budgetDefs.length} (with ${budgetDefs.length * 2} budget details)`);
  console.log(`  Planning Versions:  ${pvCount} (with ${pvCount * 16} planning details)`);
  console.log(`  Proposals:          4 (with ${proposal1Products.length + proposal2Products.length + proposal3Products.length + proposal4Products.length} products)`);
  console.log(`  Product Allocations: ${(proposal1Products.length + proposal2Products.length + proposal3Products.length + proposal4Products.length) * 2}`);
  console.log(`  Approvals:          ${approvalRecords.length}`);
  console.log(`  Sales History:      ${salesHistoryData.length}`);
  console.log(`  SKU Performance:    ${perfData.length}`);
  console.log(`  Attribute Trends:   ${trendData.length}`);
  console.log(`  Allocation History: ${allocHistData.length}`);
  console.log(`  Budget Alerts:      ${alertData.length}`);
  console.log(`  Budget Snapshots:   ${snapshotData.length}`);
  console.log('==========================================================');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Rich seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
