// ═══════════════════════════════════════════════════════════════════════════════
// Import Sync Service — Sync JSON Store → Prisma Database
// DAFC OTB Platform — Bridge between import staging and production tables
//
// Flow: JSON Store (data/imports/) → Transform → Prisma (PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { queryData, type ImportTarget, type StoredRecord } from './import-data-service';
import { Gender, SKUValidationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  target: ImportTarget;
  synced: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ id: string; error: string }>;
  proposalId?: string; // For products sync
  message: string;
}

export interface SyncOptions {
  sessionId?: string; // Only sync specific session
  dryRun?: boolean;   // Preview without writing
  overwrite?: boolean; // Overwrite existing records
  userId: string;     // User performing sync
  seasonId?: string;  // Target season
  brandId?: string;   // Target brand
}

// ─── Master Data Lookup Cache ────────────────────────────────────────────────

interface LookupCache {
  brands: Map<string, string>;       // name/code → id
  categories: Map<string, string>;   // name/code → id
  subcategories: Map<string, { id: string; categoryId: string }>;
  seasons: Map<string, string>;      // name/code → id
  collections: Map<string, string>;  // name/code → id
}

async function buildLookupCache(): Promise<LookupCache> {
  const [brands, categories, subcategories, seasons, collections] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true } }),
    prisma.category.findMany({ where: { isActive: true } }),
    prisma.subcategory.findMany({ where: { isActive: true }, include: { category: true } }),
    prisma.season.findMany({ where: { isActive: true } }),
    prisma.collection.findMany({ where: { isActive: true } }),
  ]);

  const cache: LookupCache = {
    brands: new Map(),
    categories: new Map(),
    subcategories: new Map(),
    seasons: new Map(),
    collections: new Map(),
  };

  // Index by name and code (case-insensitive)
  for (const b of brands) {
    cache.brands.set(b.name.toLowerCase(), b.id);
    cache.brands.set(b.code.toLowerCase(), b.id);
  }
  for (const c of categories) {
    cache.categories.set(c.name.toLowerCase(), c.id);
    cache.categories.set(c.code.toLowerCase(), c.id);
    // Add common aliases/variations
    const nameWords = c.name.toLowerCase().split(/[\s\-]+/);
    for (const word of nameWords) {
      if (word.length > 2) {
        cache.categories.set(word, c.id);
      }
    }
  }
  for (const s of subcategories) {
    cache.subcategories.set(s.name.toLowerCase(), { id: s.id, categoryId: s.categoryId });
    cache.subcategories.set(s.code.toLowerCase(), { id: s.id, categoryId: s.categoryId });
  }
  for (const s of seasons) {
    cache.seasons.set(s.name.toLowerCase(), s.id);
    cache.seasons.set(s.code.toLowerCase(), s.id);
    // Also index by season group + year (e.g., "SS25", "AW25")
    const shortCode = `${s.seasonGroup}${String(s.year).slice(-2)}`.toLowerCase();
    cache.seasons.set(shortCode, s.id);
  }
  for (const c of collections) {
    cache.collections.set(c.name.toLowerCase(), c.id);
    cache.collections.set(c.code.toLowerCase(), c.id);
  }

  return cache;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseGender(value: unknown): Gender {
  if (!value) return Gender.UNISEX;
  const str = String(value).toUpperCase().trim();
  if (str.includes('WOMEN') || str.includes('FEMALE') || str === 'W' || str === 'F' || str.includes('NỮ')) {
    return Gender.WOMEN;
  }
  if (str.includes('MEN') || str.includes('MALE') || str === 'M' || str.includes('NAM')) {
    return Gender.MEN;
  }
  if (str.includes('KID') || str.includes('CHILD') || str.includes('TRẺ EM')) {
    return Gender.KIDS;
  }
  return Gender.UNISEX;
}

// Category mapping rules for fuzzy matching
const CATEGORY_MAPPINGS: Record<string, string[]> = {
  'bags': ['bag', 'bags', 'túi', 'w bags', 'm bags', 'handbag', 'handbags'],
  'shoes': ['shoe', 'shoes', 'giày', 'footwear', "women's shoes", "men's shoes", 'w shoes', 'm shoes'],
  'ready-to-wear': ['rtw', 'ready to wear', 'outerwear', 'dresses', 'dress', 'tops', 'top', 'bottoms', 'bottom',
    'w outerwear', 'w dresses', 'w tops', 'w bottoms', 'm outerwear', 'm tops', 'm bottoms',
    'jacket', 'coat', 'blazer', 'shirt', 'blouse', 'pants', 'skirt', 'trousers'],
  'accessories': ['acc', 'accessory', 'accessories', 'phụ kiện', 'scarf', 'scarves', 'belt', 'belts',
    'hat', 'hats', 'jewelry', 'sunglasses', 'eyewear', 'tie', 'ties', 'w scarves', 'm scarves'],
  'small leather goods': ['slg', 'small leather', 'wallet', 'wallets', 'card holder', 'card case',
    'key holder', 'w slg', 'm slg', 'ví', 'bóp'],
};

function matchCategory(input: string, cache: LookupCache): string | undefined {
  const normalized = input.toLowerCase().trim();

  // Direct match first
  if (cache.categories.has(normalized)) {
    return cache.categories.get(normalized);
  }

  // Try fuzzy mapping
  for (const [categoryName, aliases] of Object.entries(CATEGORY_MAPPINGS)) {
    for (const alias of aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        const catId = cache.categories.get(categoryName);
        if (catId) return catId;
      }
    }
  }

  // Try partial word match
  const words = normalized.replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  for (const word of words) {
    if (word.length > 2 && cache.categories.has(word)) {
      return cache.categories.get(word);
    }
  }

  return undefined;
}

function parseDecimal(value: unknown): Decimal {
  if (!value) return new Decimal(0);
  const str = String(value)
    .replace(/[^\d.,\-]/g, '')
    .replace(/\./g, '')  // Remove thousand separators
    .replace(',', '.');  // Replace decimal comma
  const num = parseFloat(str);
  return new Decimal(isNaN(num) ? 0 : num);
}

function parseInt2(value: unknown): number {
  if (!value) return 0;
  const str = String(value).replace(/[^\d\-]/g, '');
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
}

function parseSizeBreakdown(record: StoredRecord): object | null {
  // Try to parse size data from various fields
  const size = record.size || record.size_range;
  if (!size) return null;

  // If it looks like JSON, parse it
  if (typeof size === 'string' && size.startsWith('[')) {
    try {
      return JSON.parse(size);
    } catch {
      // Continue to fallback
    }
  }

  // Create simple size breakdown from single size
  if (typeof size === 'string') {
    const sizes = size.split(/[,;\/\s]+/).filter(Boolean);
    const pct = Math.round(100 / sizes.length);
    return sizes.map((s, i) => ({
      size: s.trim(),
      percentage: i === sizes.length - 1 ? 100 - pct * (sizes.length - 1) : pct,
      quantity: parseInt2(record.quantity) || 0,
    }));
  }

  return null;
}

// ─── Sync Products → SKUItem ─────────────────────────────────────────────────

export async function syncProducts(options: SyncOptions): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    target: 'products',
    synced: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    message: '',
  };

  try {
    // 1. Load cache and imported data
    const cache = await buildLookupCache();
    const query = await queryData({
      target: 'products',
      pageSize: 10000,
      filters: options.sessionId ? { _importSessionId: options.sessionId } : undefined,
    });

    if (query.total === 0) {
      result.message = 'Không có dữ liệu sản phẩm để sync';
      result.success = true;
      return result;
    }

    // 2. Determine target season and brand
    let seasonId = options.seasonId;
    let brandId = options.brandId;

    // Try to infer from first record if not provided
    if (!seasonId || !brandId) {
      const firstRecord = query.records[0];
      if (!seasonId && firstRecord.season) {
        seasonId = cache.seasons.get(String(firstRecord.season).toLowerCase());
      }
      if (!brandId && firstRecord.brand) {
        brandId = cache.brands.get(String(firstRecord.brand).toLowerCase());
      }
    }

    // Fallback to first available
    if (!seasonId) {
      const season = await prisma.season.findFirst({ where: { isActive: true, isCurrent: true } });
      seasonId = season?.id;
    }
    if (!brandId) {
      const brand = await prisma.brand.findFirst({ where: { isActive: true } });
      brandId = brand?.id;
    }

    if (!seasonId || !brandId) {
      result.message = 'Không tìm thấy Season hoặc Brand hợp lệ';
      return result;
    }

    // 3. Find or create OTBPlan for this season/brand
    let otbPlan = await prisma.oTBPlan.findFirst({
      where: { seasonId, brandId, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otbPlan) {
      // Need to create budget allocation first
      let budget = await prisma.budgetAllocation.findFirst({
        where: { seasonId, brandId },
        orderBy: { createdAt: 'desc' },
      });

      if (!budget) {
        // Get default location
        const location = await prisma.salesLocation.findFirst({ where: { isActive: true } });
        if (!location) {
          result.message = 'Không tìm thấy Location để tạo Budget';
          return result;
        }

        budget = await prisma.budgetAllocation.create({
          data: {
            season: { connect: { id: seasonId } },
            brand: { connect: { id: brandId } },
            location: { connect: { id: location.id } },
            totalBudget: new Decimal(0),
            currency: 'VND',
            status: 'DRAFT',
            createdBy: { connect: { id: options.userId } },
          },
        });
      }

      otbPlan = await prisma.oTBPlan.create({
        data: {
          budget: { connect: { id: budget.id } },
          season: { connect: { id: seasonId } },
          brand: { connect: { id: brandId } },
          totalOTBValue: new Decimal(0),
          totalSKUCount: 0,
          createdBy: { connect: { id: options.userId } },
          status: 'DRAFT',
        },
      });
    }

    // 4. Create SKUProposal
    const proposal = await prisma.sKUProposal.create({
      data: {
        otbPlanId: otbPlan.id,
        seasonId,
        brandId,
        uploadedFileName: `Import ${new Date().toISOString().split('T')[0]}`,
        uploadedAt: new Date(),
        status: 'DRAFT',
        createdById: options.userId,
      },
    });

    result.proposalId = proposal.id;

    // 5. Process records
    const skuItems: Parameters<typeof prisma.sKUItem.createMany>[0]['data'] = [];
    const processedSKUs = new Set<string>();

    for (const record of query.records) {
      try {
        const skuCode = String(record.sku || record.sku_code || '').trim();
        if (!skuCode) {
          result.skipped++;
          continue;
        }

        // Skip duplicates within this batch
        if (processedSKUs.has(skuCode.toLowerCase())) {
          result.skipped++;
          continue;
        }
        processedSKUs.add(skuCode.toLowerCase());

        // Resolve category using fuzzy matching
        const categoryName = String(record.category || '');
        let categoryId = matchCategory(categoryName, cache);
        let subcategoryId: string | undefined;

        // Try subcategory lookup
        const subcategoryName = String(record.subcategory || '').toLowerCase();
        if (subcategoryName) {
          const subcat = cache.subcategories.get(subcategoryName);
          if (subcat) {
            subcategoryId = subcat.id;
            categoryId = subcat.categoryId;
          }
        }

        // Fallback to first category if not found
        if (!categoryId) {
          const defaultCat = await prisma.category.findFirst({ where: { isActive: true } });
          categoryId = defaultCat?.id;
        }

        if (!categoryId) {
          result.errors++;
          result.errorDetails.push({ id: record._id, error: `Category không tìm thấy: ${categoryName}` });
          continue;
        }

        // Build SKUItem
        const item = {
          proposalId: proposal.id,
          skuCode,
          styleName: String(record.name || record.style_name || skuCode),
          colorCode: record.color ? String(record.color) : null,
          colorName: record.color_name ? String(record.color_name) : null,
          material: record.material ? String(record.material) : null,
          gender: parseGender(record.gender),
          categoryId,
          subcategoryId: subcategoryId || null,
          collectionId: record.collection ? cache.collections.get(String(record.collection).toLowerCase()) : null,
          rail: record.rail ? String(record.rail) : null,
          productType: record.style ? String(record.style) : null,
          theme: record.theme ? String(record.theme) : null,
          retailPrice: parseDecimal(record.retail_price || record.price),
          costPrice: parseDecimal(record.cost_price || record.cost),
          margin: null as Decimal | null,
          orderQuantity: parseInt2(record.quantity || record.qty || 1),
          orderValue: parseDecimal(record.total || record.value),
          sizeBreakdown: parseSizeBreakdown(record),
          supplierSKU: record.supplier_sku ? String(record.supplier_sku) : null,
          countryOfOrigin: record.country ? String(record.country) : null,
          validationStatus: SKUValidationStatus.PENDING,
          composition: record.material ? String(record.material) : null,
          l4Category: record.l4_detail ? String(record.l4_detail) : null,
          carryForward: Boolean(record.carryforward || record.carry_forward),
        };

        // Calculate margin
        if (item.retailPrice.greaterThan(0)) {
          const marginPct = item.retailPrice.minus(item.costPrice).dividedBy(item.retailPrice).times(100);
          item.margin = marginPct.toDecimalPlaces(2);
        }

        // Calculate order value if not provided
        if (!item.orderValue || item.orderValue.equals(0)) {
          item.orderValue = item.retailPrice.times(item.orderQuantity);
        }

        skuItems.push(item);
        result.synced++;
      } catch (err) {
        result.errors++;
        result.errorDetails.push({
          id: record._id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 6. Batch insert if not dry run
    if (!options.dryRun && skuItems.length > 0) {
      await prisma.sKUItem.createMany({
        data: skuItems as Parameters<typeof prisma.sKUItem.createMany>[0]['data'],
        skipDuplicates: true,
      });

      // Calculate totals
      const totalValue = skuItems.reduce((sum, i) => {
        const val = i.orderValue ? new Decimal(i.orderValue.toString()) : new Decimal(0);
        return sum.add(val);
      }, new Decimal(0));
      const totalUnits = skuItems.reduce((sum, i) => sum + (i.orderQuantity || 0), 0);

      // Update proposal counts
      await prisma.sKUProposal.update({
        where: { id: proposal.id },
        data: {
          totalSKUs: skuItems.length,
          validSKUs: skuItems.length,
          totalValue,
          totalUnits,
        },
      });

      // Update OTB plan counts
      await prisma.oTBPlan.update({
        where: { id: otbPlan.id },
        data: {
          totalSKUCount: { increment: skuItems.length },
          totalOTBValue: { increment: totalValue },
        },
      });
    }

    result.success = true;
    result.message = options.dryRun
      ? `[Dry Run] Sẽ sync ${result.synced} SKUs`
      : `Đã sync ${result.synced} SKUs vào proposal ${proposal.id}`;

  } catch (err) {
    result.message = `Lỗi sync: ${err instanceof Error ? err.message : String(err)}`;
  }

  return result;
}

// ─── Sync OTB Budget → OTBLineItem ───────────────────────────────────────────

export async function syncOTBBudget(options: SyncOptions): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    target: 'otb_budget',
    synced: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    message: '',
  };

  try {
    const cache = await buildLookupCache();
    const query = await queryData({
      target: 'otb_budget',
      pageSize: 10000,
      filters: options.sessionId ? { _importSessionId: options.sessionId } : undefined,
    });

    if (query.total === 0) {
      result.message = 'Không có dữ liệu OTB Budget để sync';
      result.success = true;
      return result;
    }

    // Find or create OTB Plan
    let seasonId = options.seasonId;
    let brandId = options.brandId;

    if (!seasonId) {
      const season = await prisma.season.findFirst({ where: { isActive: true, isCurrent: true } });
      seasonId = season?.id;
    }
    if (!brandId) {
      const brand = await prisma.brand.findFirst({ where: { isActive: true } });
      brandId = brand?.id;
    }

    if (!seasonId || !brandId) {
      result.message = 'Không tìm thấy Season hoặc Brand hợp lệ';
      return result;
    }

    // Find or create OTB Plan
    let otbPlan = await prisma.oTBPlan.findFirst({
      where: { seasonId, brandId },
      orderBy: { createdAt: 'desc' },
    });

    if (!otbPlan) {
      const location = await prisma.salesLocation.findFirst({ where: { isActive: true } });
      if (!location) {
        result.message = 'Không tìm thấy Location';
        return result;
      }

      let budget = await prisma.budgetAllocation.findFirst({
        where: { seasonId, brandId },
      });

      if (!budget) {
        budget = await prisma.budgetAllocation.create({
          data: {
            season: { connect: { id: seasonId } },
            brand: { connect: { id: brandId } },
            location: { connect: { id: location.id } },
            totalBudget: new Decimal(0),
            currency: 'VND',
            status: 'DRAFT',
            createdBy: { connect: { id: options.userId } },
          },
        });
      }

      otbPlan = await prisma.oTBPlan.create({
        data: {
          budget: { connect: { id: budget.id } },
          season: { connect: { id: seasonId } },
          brand: { connect: { id: brandId } },
          totalOTBValue: new Decimal(0),
          totalSKUCount: 0,
          createdBy: { connect: { id: options.userId } },
          status: 'DRAFT',
        },
      });
    }

    // Process budget line items
    const lineItems: Parameters<typeof prisma.oTBLineItem.createMany>[0]['data'] = [];
    let totalBudget = new Decimal(0);

    for (const record of query.records) {
      try {
        const categoryName = String(record.category || '');
        const categoryId = matchCategory(categoryName, cache);

        if (!categoryId) {
          // Log skipped category for debugging
          console.log(`[Sync OTB] Skipped - category not found: "${categoryName}"`);
          result.skipped++;
          continue;
        }

        const otbValue = parseDecimal(record.otb_value || record.budget || record.otb);
        const actualValue = parseDecimal(record.actual || record.actual_value);
        const mixPct = parseDecimal(record.mix_percent || record.mix);

        lineItems.push({
          otbPlanId: otbPlan.id,
          level: 3, // Category level
          categoryId,
          subcategoryId: null,
          collectionId: null,
          gender: null,
          systemProposedPct: mixPct.dividedBy(100),
          systemProposedValue: otbValue,
          systemConfidence: 0.85,
          userBuyPct: mixPct.dividedBy(100),
          userBuyValue: otbValue,
          userUnits: 0,
          historicalSalesPct: null,
          historicalSalesValue: actualValue.greaterThan(0) ? actualValue : null,
          historicalUnits: null,
          varianceFromSystem: null,
          varianceFromHist: otbValue.minus(actualValue),
          hasAnomaly: false,
        });

        totalBudget = totalBudget.add(otbValue);
        result.synced++;
      } catch (err) {
        result.errors++;
        result.errorDetails.push({
          id: record._id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Insert line items
    if (!options.dryRun && lineItems.length > 0) {
      // Clear existing line items for this plan if overwrite
      if (options.overwrite) {
        await prisma.oTBLineItem.deleteMany({
          where: { otbPlanId: otbPlan.id },
        });
      }

      await prisma.oTBLineItem.createMany({
        data: lineItems as Parameters<typeof prisma.oTBLineItem.createMany>[0]['data'],
      });

      // Update OTB Plan total
      await prisma.oTBPlan.update({
        where: { id: otbPlan.id },
        data: { totalOTBValue: totalBudget },
      });

      // Update Budget Allocation
      await prisma.budgetAllocation.update({
        where: { id: otbPlan.budgetId },
        data: { totalBudget },
      });
    }

    result.success = true;
    result.message = options.dryRun
      ? `[Dry Run] Sẽ sync ${result.synced} budget lines`
      : `Đã sync ${result.synced} budget lines, tổng: ${totalBudget.toNumber().toLocaleString()} VND`;

  } catch (err) {
    result.message = `Lỗi sync: ${err instanceof Error ? err.message : String(err)}`;
  }

  return result;
}

// ─── Main Sync Entry Point ───────────────────────────────────────────────────

export async function syncImportedData(
  target: ImportTarget,
  options: SyncOptions
): Promise<SyncResult> {
  switch (target) {
    case 'products':
      return syncProducts(options);
    case 'otb_budget':
      return syncOTBBudget(options);
    default:
      return {
        success: false,
        target,
        synced: 0,
        skipped: 0,
        errors: 0,
        errorDetails: [],
        message: `Target "${target}" chưa được hỗ trợ sync`,
      };
  }
}

// ─── Get Sync Status ─────────────────────────────────────────────────────────

export interface SyncStatus {
  target: ImportTarget;
  pendingRecords: number;
  lastSyncAt: string | null;
  syncedProposals: number;
}

export async function getSyncStatus(target: ImportTarget): Promise<SyncStatus> {
  const query = await queryData({ target, pageSize: 1 });

  let syncedProposals = 0;
  if (target === 'products') {
    syncedProposals = await prisma.sKUProposal.count({
      where: { uploadedFileName: { startsWith: 'Import' } },
    });
  }

  return {
    target,
    pendingRecords: query.total,
    lastSyncAt: null, // TODO: track this
    syncedProposals,
  };
}
