import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { UpdateUserInput } from './users.schema.js';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await usersService.getProfile(userId);
  res.json({ data: user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body as UpdateUserInput;
  const user = await usersService.updateProfile(userId, data);
  res.json({ data: user });
});
