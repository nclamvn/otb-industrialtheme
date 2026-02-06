import { z } from 'zod';

export const otbPlanCreateSchema = z.object({
  budgetId: z.string().min(1, 'Budget is required'),
  name: z.string().min(1, 'Name is required').optional(),
  versionType: z.enum(['V0_SYSTEM', 'V1_USER', 'V2_ADJUSTED', 'V3_REVIEWED', 'VA_APPROVED', 'VF_FINAL', 'REVISED']).default('V0_SYSTEM'),
});

export type OTBPlanCreateData = z.infer<typeof otbPlanCreateSchema>;

export const otbLineItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']),
  level: z.coerce.number().int().default(1),
  userUnits: z.coerce.number().int().min(0, 'Units must be non-negative').optional(),
  userBuyValue: z.coerce.number().min(0, 'Buy value must be non-negative'),
  userBuyPct: z.coerce.number().min(0).max(100, 'Buy percentage must be between 0-100'),
  comment: z.string().optional(),
});

export type OTBLineItemData = z.infer<typeof otbLineItemSchema>;

export const otbBulkUpdateSchema = z.object({
  lineItems: z.array(
    z.object({
      id: z.string().optional(),
      categoryId: z.string().min(1),
      gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']),
      level: z.coerce.number().int().default(1),
      userUnits: z.coerce.number().int().min(0).optional(),
      userBuyValue: z.coerce.number().min(0),
      userBuyPct: z.coerce.number().min(0).max(100),
      comment: z.string().optional(),
    })
  ),
});

export type OTBBulkUpdateData = z.infer<typeof otbBulkUpdateSchema>;

export const sizingAnalysisSchema = z.object({
  otbLineItemId: z.string().min(1, 'OTB line item is required'),
  sizeBreakdown: z.record(z.number().min(0).max(100)),
});

export type SizingAnalysisData = z.infer<typeof sizingAnalysisSchema>;
