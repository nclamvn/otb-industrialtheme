import { z } from 'zod';

export const otbPlanCreateSchema = z.object({
  budgetId: z.string().min(1, 'Budget is required'),
  seasonId: z.string().min(1, 'Season is required'),
  brandId: z.string().min(1, 'Brand is required'),
  versionType: z.string().optional(),
  versionName: z.string().optional(),
  comments: z.string().optional(),
});

export type OTBPlanCreateData = z.infer<typeof otbPlanCreateSchema>;

export const otbPlanUpdateSchema = z.object({
  versionName: z.string().optional(),
  comments: z.string().optional(),
  executiveSummary: z.string().optional(),
});

export type OTBPlanUpdateData = z.infer<typeof otbPlanUpdateSchema>;

export const otbLineItemSchema = z.object({
  id: z.string().optional(),
  level: z.number().int().min(1).max(4),
  collectionId: z.string().optional().nullable(),
  gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),
  sizeGroup: z.string().optional().nullable(),
  userBuyPct: z.coerce.number().min(0).max(100),
  userBuyValue: z.coerce.number().min(0),
  userUnits: z.coerce.number().int().min(0).optional().nullable(),
  comment: z.string().optional().nullable(),
  isLocked: z.boolean().default(false),
});

export type OTBLineItemData = z.infer<typeof otbLineItemSchema>;

export const otbBulkUpdateSchema = z.object({
  items: z.array(otbLineItemSchema),
});

export type OTBBulkUpdateData = z.infer<typeof otbBulkUpdateSchema>;

export const sizingAnalysisSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional().nullable(),
  gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']),
  locationId: z.string().optional().nullable(),
  sizeData: z.array(
    z.object({
      size: z.string(),
      historicalPct: z.number().min(0).max(100),
      currentPct: z.number().min(0).max(100),
      recommendedPct: z.number().min(0).max(100).optional(),
      stockoutRate: z.number().min(0).max(100).optional(),
    })
  ),
});

export type SizingAnalysisData = z.infer<typeof sizingAnalysisSchema>;
