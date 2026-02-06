import { z } from 'zod';

export const skuProposalCreateSchema = z.object({
  otbPlanId: z.string().min(1, 'OTB plan is required'),
});

export type SKUProposalCreateData = z.infer<typeof skuProposalCreateSchema>;

export const skuItemSchema = z.object({
  skuCode: z.string().min(1, 'SKU code is required'),
  styleName: z.string().min(1, 'Style name is required'),
  colorCode: z.string().optional(),
  colorName: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  gender: z.enum(['MEN', 'WOMEN', 'UNISEX', 'KIDS']),
  retailPrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  orderQuantity: z.coerce.number().int().min(0),
  sizeBreakdown: z.record(z.number()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export type SKUItemData = z.infer<typeof skuItemSchema>;

export const skuBulkCreateSchema = z.object({
  items: z.array(skuItemSchema),
});

export type SKUBulkCreateData = z.infer<typeof skuBulkCreateSchema>;
