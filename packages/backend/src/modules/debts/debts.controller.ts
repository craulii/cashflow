import { Request, Response } from 'express';
import { debtsService } from './debts.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { debtQuerySchema } from './debts.schema.js';
import type { CreateDebtInput, UpdateDebtInput, CreatePaymentInput } from './debts.schema.js';

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = debtQuerySchema.parse(req.query);
  const result = await debtsService.findAll(userId, query);
  res.json({ data: result });
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const debt = await debtsService.findById(id, userId);
  res.json({ data: debt });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreateDebtInput;
  const debt = await debtsService.create(userId, data);
  res.status(201).json({ data: debt });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const data = req.body as UpdateDebtInput;
  const debt = await debtsService.update(id, userId, data);
  res.json({ data: debt });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  await debtsService.delete(id, userId);
  res.json({ data: { message: 'Debt deleted successfully' } });
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const data = req.body as CreatePaymentInput;
  const payment = await debtsService.addPayment(id, userId, data);
  res.status(201).json({ data: payment });
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const payments = await debtsService.getPayments(id, userId);
  res.json({ data: payments });
});

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { paymentId } = req.params;
  await debtsService.deletePayment(paymentId, userId);
  res.json({ data: { message: 'Payment deleted successfully' } });
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const summary = await debtsService.getSummary(userId);
  res.json({ data: summary });
});
