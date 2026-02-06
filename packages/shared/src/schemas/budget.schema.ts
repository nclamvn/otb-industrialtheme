import { z } from 'zod';

export const budgetFormSchema = z.object({
  seasonId: z.string().min(1, 'Season is required'),
  brandId: z.string().min(1, 'Brand is required'),
  locationId: z.string().min(1, 'Location is required'),
  totalBudget: z.coerce.number().min(1, 'Total budget must be greater than 0'),
  seasonalBudget: z.coerce.number().optional(),
  replenishmentBudget: z.coerce.number().optional(),
  currency: z.string().default('USD'),
  comments: z.string().optional(),
  assumptions: z.record(z.unknown()).optional(),
});

export type BudgetFormData = z.infer<typeof budgetFormSchema>;

export const budgetUpdateSchema = budgetFormSchema.partial().extend({
  totalBudget: z.coerce.number().min(1, 'Total budget must be greater than 0'),
});

export type BudgetUpdateData = z.infer<typeof budgetUpdateSchema>;
