// ============================================================================
// Database Seed — Replaces all hardcoded constants.js data
// Run: npx prisma db seed   or   npm run prisma:seed
// ============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── ROLES ────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'System Administrator',
        permissions: ['*'],
      },
    }),
    prisma.role.upsert({
      where: { name: 'buyer' },
      update: {},
      create: {
        name: 'buyer',
        description: 'Buyer — creates proposals, manages SKU selection',
        permissions: [
          'budget:read',
          'planning:read',
          'proposal:read', 'proposal:write', 'proposal:submit',
          'master:read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'merchandiser' },
      update: {},
      create: {
        name: 'merchandiser',
        description: 'Merchandiser — creates budgets and planning',
        permissions: [
          'budget:read', 'budget:write', 'budget:submit',
          'planning:read', 'planning:write', 'planning:submit',
          'proposal:read',
          'master:read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'merch_manager' },
      update: {},
      create: {
        name: 'merch_manager',
        description: 'Merchandising Manager — Level 1 Approver',
        permissions: [
          'budget:read', 'budget:write', 'budget:submit', 'budget:approve_l1',
          'planning:read', 'planning:write', 'planning:approve_l1',
          'proposal:read', 'proposal:approve_l1',
          'master:read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { name: 'finance_director' },
      update: {},
      create: {
        name: 'finance_director',
        description: 'Finance Director — Level 2 Approver',
        permissions: [
          'budget:read', 'budget:approve_l2',
          'planning:read', 'planning:approve_l2',
          'proposal:read', 'proposal:approve_l2',
          'master:read',
        ],
      },
    }),
  ]);

  const adminRole = roles[0];
  const buyerRole = roles[1];
  const merchRole = roles[2];
  const merchMgrRole = roles[3];
  const finDirRole = roles[4];

  console.log(`  ✅ ${roles.length} roles created`);

  // ─── STORES ───────────────────────────────────────────────────────────
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { code: 'REX' },
      update: {},
      create: { code: 'REX', name: 'REX', region: 'HCMC' },
    }),
    prisma.store.upsert({
      where: { code: 'TTP' },
      update: {},
      create: { code: 'TTP', name: 'TTP', region: 'HCMC' },
    }),
  ]);
  console.log(`  ✅ ${stores.length} stores created`);

  // ─── GROUP BRANDS ─────────────────────────────────────────────────────
  const brands = await Promise.all([
    prisma.groupBrand.upsert({
      where: { code: 'FER' },
      update: {},
      create: {
        code: 'FER', name: 'Ferragamo', groupId: 'A',
        colorConfig: { gradient: 'from-rose-400 to-rose-600' },
        sortOrder: 1,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'BUR' },
      update: {},
      create: {
        code: 'BUR', name: 'Burberry', groupId: 'A',
        colorConfig: { gradient: 'from-amber-400 to-amber-600' },
        sortOrder: 2,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'GUC' },
      update: {},
      create: {
        code: 'GUC', name: 'Gucci', groupId: 'A',
        colorConfig: { gradient: 'from-emerald-400 to-emerald-600' },
        sortOrder: 3,
      },
    }),
    prisma.groupBrand.upsert({
      where: { code: 'PRA' },
      update: {},
      create: {
        code: 'PRA', name: 'Prada', groupId: 'B',
        colorConfig: { gradient: 'from-purple-400 to-purple-600' },
        sortOrder: 4,
      },
    }),
  ]);
  console.log(`  ✅ ${brands.length} brands created`);

  // ─── COLLECTIONS ──────────────────────────────────────────────────────
  const collections = await Promise.all([
    prisma.collection.upsert({ where: { name: 'Carry Over' }, update: {}, create: { name: 'Carry Over' } }),
    prisma.collection.upsert({ where: { name: 'Seasonal' }, update: {}, create: { name: 'Seasonal' } }),
  ]);
  console.log(`  ✅ ${collections.length} collections created`);

  // ─── GENDERS ──────────────────────────────────────────────────────────
  const genders = await Promise.all([
    prisma.gender.upsert({ where: { name: 'Female' }, update: {}, create: { name: 'Female' } }),
    prisma.gender.upsert({ where: { name: 'Male' }, update: {}, create: { name: 'Male' } }),
  ]);
  const [female, male] = genders;
  console.log(`  ✅ ${genders.length} genders created`);

  // ─── CATEGORIES + SUB-CATEGORIES ──────────────────────────────────────
  // Female categories
  const womenRtw = await prisma.category.upsert({
    where: { id: 'women_rtw' },
    update: {},
    create: { id: 'women_rtw', name: "WOMEN'S RTW", genderId: female.id },
  });
  const womenHardAcc = await prisma.category.upsert({
    where: { id: 'women_hard_acc' },
    update: {},
    create: { id: 'women_hard_acc', name: 'WOMEN HARD ACCESSORIES', genderId: female.id },
  });
  const womenOthers = await prisma.category.upsert({
    where: { id: 'women_others' },
    update: {},
    create: { id: 'women_others', name: 'OTHERS', genderId: female.id },
  });

  // Male categories
  const menRtw = await prisma.category.upsert({
    where: { id: 'men_rtw' },
    update: {},
    create: { id: 'men_rtw', name: "MEN'S RTW", genderId: male.id },
  });
  const menAcc = await prisma.category.upsert({
    where: { id: 'men_acc' },
    update: {},
    create: { id: 'men_acc', name: 'MEN ACCESSORIES', genderId: male.id },
  });

  // Sub-categories
  const subCategories = await Promise.all([
    // Women RTW
    prisma.subCategory.upsert({ where: { id: 'w_outerwear' }, update: {}, create: { id: 'w_outerwear', name: 'W Outerwear', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_tailoring' }, update: {}, create: { id: 'w_tailoring', name: 'W Tailoring', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_dresses' }, update: {}, create: { id: 'w_dresses', name: 'W Dresses', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_tops' }, update: {}, create: { id: 'w_tops', name: 'W Tops', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_body' }, update: {}, create: { id: 'w_body', name: 'W Body', categoryId: womenRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_bottoms' }, update: {}, create: { id: 'w_bottoms', name: 'W Bottoms', categoryId: womenRtw.id } }),
    // Women Hard Accessories
    prisma.subCategory.upsert({ where: { id: 'w_bags' }, update: {}, create: { id: 'w_bags', name: 'W Bags', categoryId: womenHardAcc.id } }),
    prisma.subCategory.upsert({ where: { id: 'w_slg' }, update: {}, create: { id: 'w_slg', name: 'W SLG', categoryId: womenHardAcc.id } }),
    // Women Others
    prisma.subCategory.upsert({ where: { id: 'w_shoes' }, update: {}, create: { id: 'w_shoes', name: "Women's Shoes", categoryId: womenOthers.id } }),
    // Men RTW
    prisma.subCategory.upsert({ where: { id: 'm_outerwear' }, update: {}, create: { id: 'm_outerwear', name: 'M Outerwear', categoryId: menRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_tops' }, update: {}, create: { id: 'm_tops', name: 'M Tops', categoryId: menRtw.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_bottoms' }, update: {}, create: { id: 'm_bottoms', name: 'M Bottoms', categoryId: menRtw.id } }),
    // Men Accessories
    prisma.subCategory.upsert({ where: { id: 'm_bags' }, update: {}, create: { id: 'm_bags', name: 'M Bags', categoryId: menAcc.id } }),
    prisma.subCategory.upsert({ where: { id: 'm_slg' }, update: {}, create: { id: 'm_slg', name: 'M SLG', categoryId: menAcc.id } }),
  ]);
  console.log(`  ✅ 5 categories + ${subCategories.length} sub-categories created`);

  // ─── SKU CATALOG ──────────────────────────────────────────────────────
  // Matching SKU_CATALOG from the current frontend SKUProposalScreen.jsx
  const skus = [
    { skuCode: '8116333', productName: 'FITZROVIA DK SHT', productType: 'W OUTERWEAR', theme: 'AUGUST (08)', color: 'WINE RED', composition: '100% COTTON', srp: 87900000 },
    { skuCode: '8113543', productName: 'FLORISTON S', productType: 'W OUTERWEAR', theme: 'AUGUST (08)', color: 'MAHOGANY', composition: '100% POLYAMIDE (NYLON)', srp: 65900000 },
    { skuCode: '8115960', productName: 'OLDHAM CHK', productType: 'W OUTERWEAR', theme: 'AUGUST (08)', color: 'POPPY IP CHECK', composition: '100% COTTON', srp: 71900000 },
    { skuCode: '8116500', productName: 'KENSINGTON TRENCH', productType: 'W OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'HONEY', composition: '100% COTTON', srp: 95000000 },
    { skuCode: '8116501', productName: 'CHELSEA COAT', productType: 'W OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'BLACK', composition: '80% WOOL 20% CASHMERE', srp: 120000000 },
    { skuCode: '8114202', productName: 'GILLIAN WCHK', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'TRUFFLE IP CHECK', composition: '70% WOOL 30% CASHMERE', srp: 49900000 },
    { skuCode: '8115254', productName: 'GEORGETTE WCHK', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'TRUFFLE IP CHECK', composition: '70% WOOL 30% CASHMERE', srp: 58900000 },
    { skuCode: '8115640', productName: 'SCARLETT EKD', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'CAMEL', composition: '70% WOOL 30% CASHMERE', srp: 44900000 },
    { skuCode: '8115700', productName: 'VICTORIA BLOUSE', productType: 'W TOPS', theme: 'OCTOBER (10)', color: 'IVORY', composition: '100% SILK', srp: 38000000 },
    { skuCode: '8115701', productName: 'EMMA SHIRT', productType: 'W TOPS', theme: 'OCTOBER (10)', color: 'WHITE', composition: '100% COTTON', srp: 28000000 },
    { skuCode: '9201001', productName: 'HERITAGE TOTE', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'BLACK', composition: '100% LEATHER', srp: 65000000 },
    { skuCode: '9201002', productName: 'MESSENGER BAG', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'TAN', composition: '100% LEATHER', srp: 55000000 },
    { skuCode: '9201003', productName: 'BACKPACK CLASSIC', productType: 'M BAGS', theme: 'NOVEMBER (11)', color: 'NAVY', composition: '100% NYLON', srp: 42000000 },
    { skuCode: '9101001', productName: 'LOLA BAG', productType: 'W BAGS', theme: 'AUGUST (08)', color: 'BURGUNDY', composition: '100% LEATHER', srp: 78000000 },
    { skuCode: '9101002', productName: 'TB BAG SMALL', productType: 'W BAGS', theme: 'SEPTEMBER (09)', color: 'BLACK', composition: '100% LEATHER', srp: 95000000 },
  ];

  for (const sku of skus) {
    await prisma.skuCatalog.upsert({
      where: { skuCode: sku.skuCode },
      update: {},
      create: sku,
    });
  }
  console.log(`  ✅ ${skus.length} SKUs created`);

  // ─── DEFAULT USERS ────────────────────────────────────────────────────
  const password = await bcrypt.hash('dafc@2026', 12);
  const storeIds = stores.map(s => s.id);
  const brandIds = brands.map(b => b.id);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@dafc.com' },
      update: {},
      create: {
        email: 'admin@dafc.com', name: 'System Admin',
        passwordHash: password, roleId: adminRole.id,
        storeAccess: storeIds, brandAccess: brandIds,
      },
    }),
    prisma.user.upsert({
      where: { email: 'buyer@dafc.com' },
      update: {},
      create: {
        email: 'buyer@dafc.com', name: 'Nguyen Van Buyer',
        passwordHash: password, roleId: buyerRole.id,
        storeAccess: storeIds, brandAccess: brandIds,
      },
    }),
    prisma.user.upsert({
      where: { email: 'merch@dafc.com' },
      update: {},
      create: {
        email: 'merch@dafc.com', name: 'Tran Thi Merch',
        passwordHash: password, roleId: merchRole.id,
        storeAccess: storeIds, brandAccess: brandIds,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@dafc.com' },
      update: {},
      create: {
        email: 'manager@dafc.com', name: 'Le Van Manager',
        passwordHash: password, roleId: merchMgrRole.id,
        storeAccess: storeIds, brandAccess: brandIds,
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance@dafc.com' },
      update: {},
      create: {
        email: 'finance@dafc.com', name: 'Pham Director',
        passwordHash: password, roleId: finDirRole.id,
        storeAccess: storeIds, brandAccess: brandIds,
      },
    }),
  ]);
  console.log(`  ✅ ${users.length} users created (password: dafc@2026)`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
