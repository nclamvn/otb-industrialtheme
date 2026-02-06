import { z } from 'zod';

export const skuProposalCreateSchema = z.object({
  otbPlanId: z.string().min(1, 'OTB Plan is required'),
  seasonId: z.string().min(1, 'Season is required'),
  brandId: z.string().min(1, 'Brand is required'),
});

export type SKUProposalCreateData = z.infer<typeof skuProposalCreateSchema>;

export const skuItemSchema = z.object({
  skuCode: z.string().min(1, 'SKU Code is required'),
  styleName: z.string().min(1, 'Style Name is required'),
  colorCode: z.string().optional().nullable(),
  colorName: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
  gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional().nullable(),
  retailPrice: z.coerce.number().min(0.01, 'Retail price must be greater than 0'),
  costPrice: z.coerce.number().min(0.01, 'Cost price must be greater than 0'),
  orderQuantity: z.coerce.number().int().min(1, 'Order quantity must be at least 1'),
  sizeBreakdown: z.record(z.number()).optional().nullable(),
  supplierSKU: z.string().optional().nullable(),
  leadTime: z.coerce.number().int().min(0).optional().nullable(),
  moq: z.coerce.number().int().min(0).optional().nullable(),
  countryOfOrigin: z.string().optional().nullable(),
});

export type SKUItemData = z.infer<typeof skuItemSchema>;

export const skuBulkImportSchema = z.object({
  items: z.array(skuItemSchema),
});

export type SKUBulkImportData = z.infer<typeof skuBulkImportSchema>;

export const skuUpdateSchema = skuItemSchema.partial().extend({
  id: z.string(),
});

export type SKUUpdateData = z.infer<typeof skuUpdateSchema>;
