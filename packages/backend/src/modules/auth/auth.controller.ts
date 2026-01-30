import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schema.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as RegisterInput;
  const result = await authService.register(data);
  res.status(201).json({ data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as LoginInput;
  const result = await authService.login(data);
  res.json({ data: result });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  const result = await authService.refresh(refreshToken);
  res.json({ data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenInput;
  await authService.logout(refreshToken);
  res.json({ data: { message: 'Logged out successfully' } });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await authService.logoutAll(userId);
  res.json({ data: { message: 'Logged out from all devices' } });
});
