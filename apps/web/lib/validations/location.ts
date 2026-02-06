import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be at most 10 characters')
    .toUpperCase(),
  type: z.enum(['STORE', 'OUTLET', 'ONLINE']).default('STORE'),
  address: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type LocationFormData = z.infer<typeof locationSchema>;
