import { Request, Response } from 'express';
import { incomeService } from './income.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { incomeQuerySchema } from './income.schema.js';
import type { CreateIncomeInput, UpdateIncomeInput } from './income.schema.js';

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = incomeQuerySchema.parse(req.query);
  const result = await incomeService.findAll(userId, query);
  res.json({ data: result });
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const income = await incomeService.findById(id, userId);
  res.json({ data: income });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreateIncomeInput;
  const income = await incomeService.create(userId, data);
  res.status(201).json({ data: income });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const data = req.body as UpdateIncomeInput;
  const income = await incomeService.update(id, userId, data);
  res.json({ data: income });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  await incomeService.delete(id, userId);
  res.json({ data: { message: 'Income deleted successfully' } });
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { startDate, endDate } = req.query;

  const summary = await incomeService.getSummary(
    userId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({ data: summary });
});
