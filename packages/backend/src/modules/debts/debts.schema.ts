import { z } from 'zod';

export const createDebtSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  interestRate: z.number().min(0).optional(),
  minimumPayment: z.number().positive().optional(),
  dueDate: z.string().transform((val) => new Date(val)).optional(),
  startDate: z.string().transform((val) => new Date(val)),
  categoryId: z.string().optional(),
});

export const updateDebtSchema = z.object({
  name: z.string().min(1).optional(),
  totalAmount: z.number().positive().optional(),
  interestRate: z.number().min(0).optional().nullable(),
  minimumPayment: z.number().positive().optional().nullable(),
  dueDate: z.string().transform((val) => new Date(val)).optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  date: z.string().transform((val) => new Date(val)),
  note: z.string().optional(),
});

export const debtQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  isPaidOff: z.string().optional().transform((val) => val === 'true'),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type DebtQuery = z.infer<typeof debtQuerySchema>;
