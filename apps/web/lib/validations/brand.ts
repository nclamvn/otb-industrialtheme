import { z } from 'zod';

export const brandSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be at most 10 characters')
    .toUpperCase(),
  divisionId: z.string().min(1, 'Division is required'),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type BrandFormData = z.infer<typeof brandSchema>;
