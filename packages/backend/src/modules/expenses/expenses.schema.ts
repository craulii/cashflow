import { z } from 'zod';

export const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().transform((val) => new Date(val)),
  isRecurring: z.boolean().optional().default(false),
  categoryId: z.string().min(1, 'Category is required'),
});

export const updateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().min(1).optional(),
  date: z.string().transform((val) => new Date(val)).optional(),
  isRecurring: z.boolean().optional(),
  categoryId: z.string().optional(),
});

export const expenseQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  categoryId: z.string().optional(),
  categoryType: z.enum(['FIXED', 'VARIABLE']).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
