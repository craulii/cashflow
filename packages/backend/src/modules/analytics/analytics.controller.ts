import { Request, Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const dashboard = await analyticsService.getDashboard(userId);
  res.json({ data: dashboard });
});

export const getMonthly = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { year, month } = req.query;

  const now = new Date();
  const y = year ? parseInt(year as string, 10) : now.getFullYear();
  const m = month ? parseInt(month as string, 10) : now.getMonth() + 1;

  const monthly = await analyticsService.getMonthly(userId, y, m);
  res.json({ data: monthly });
});

export const getComparison = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { months } = req.query;

  const m = months ? parseInt(months as string, 10) : 6;
  const comparison = await analyticsService.getComparison(userId, m);
  res.json({ data: comparison });
});

export const getTrends = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { months } = req.query;

  const m = months ? parseInt(months as string, 10) : 12;
  const trends = await analyticsService.getTrends(userId, m);
  res.json({ data: trends });
});
