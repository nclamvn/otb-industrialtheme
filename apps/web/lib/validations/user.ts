import { z } from 'zod';
import { UserRole, UserStatus } from '@/types';

// Define role and status values for Zod validation
const USER_ROLES = [
  'ADMIN',
  'FINANCE_HEAD',
  'FINANCE_USER',
  'BRAND_MANAGER',
  'BRAND_PLANNER',
  'MERCHANDISE_LEAD',
  'BOD_MEMBER',
] as const;

const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;

export const userSchema = z.object({
  email: z.string().email('Must be a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
  role: z.enum(USER_ROLES).default('BRAND_PLANNER'),
  status: z.enum(USER_STATUSES).default('ACTIVE'),
  assignedBrandIds: z.array(z.string()).optional(),
});

export const createUserSchema = userSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = userSchema.extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
});

export type UserFormData = z.infer<typeof userSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
