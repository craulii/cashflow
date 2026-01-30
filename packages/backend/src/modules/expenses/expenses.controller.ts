import { Request, Response } from 'express';
import { expensesService } from './expenses.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { expenseQuerySchema } from './expenses.schema.js';
import type { CreateExpenseInput, UpdateExpenseInput } from './expenses.schema.js';

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = expenseQuerySchema.parse(req.query);
  const result = await expensesService.findAll(userId, query);
  res.json({ data: result });
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const expense = await expensesService.findById(id, userId);
  res.json({ data: expense });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreateExpenseInput;
  const expense = await expensesService.create(userId, data);
  res.status(201).json({ data: expense });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const data = req.body as UpdateExpenseInput;
  const expense = await expensesService.update(id, userId, data);
  res.json({ data: expense });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  await expensesService.delete(id, userId);
  res.json({ data: { message: 'Expense deleted successfully' } });
});

export const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { startDate, endDate } = req.query;

  const result = await expensesService.getByCategory(
    userId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({ data: result });
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { startDate, endDate } = req.query;

  const summary = await expensesService.getSummary(
    userId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({ data: summary });
});
