import { Request, Response } from 'express';
import { categoriesService, CategoryType } from './categories.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schema.js';

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const type = req.query.type as CategoryType | undefined;
  const categories = await categoriesService.findAll(userId, type);
  res.json({ data: categories });
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const category = await categoriesService.findById(id, userId);
  res.json({ data: category });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as CreateCategoryInput;
  const category = await categoriesService.create(userId, data);
  res.status(201).json({ data: category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const data = req.body as UpdateCategoryInput;
  const category = await categoriesService.update(id, userId, data);
  res.json({ data: category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  await categoriesService.delete(id, userId);
  res.json({ data: { message: 'Category deleted successfully' } });
});
