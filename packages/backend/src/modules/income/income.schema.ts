import { z } from 'zod';

export const createIncomeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  source: z.string().optional(),
  date: z.string().transform((val) => new Date(val)),
  isRecurring: z.boolean().optional().default(false),
  categoryId: z.string().optional(),
});

export const updateIncomeSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().min(1).optional(),
  source: z.string().optional(),
  date: z.string().transform((val) => new Date(val)).optional(),
  isRecurring: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
});

export const incomeQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  source: z.string().optional(),
  categoryId: z.string().optional(),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type IncomeQuery = z.infer<typeof incomeQuerySchema>;
