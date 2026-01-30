import { z } from 'zod';

export const categoryTypeEnum = z.enum(['FIXED', 'VARIABLE', 'DEBT', 'INCOME']);

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: categoryTypeEnum,
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const categoryQuerySchema = z.object({
  type: categoryTypeEnum.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
