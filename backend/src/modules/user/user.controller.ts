import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as userService from './user.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) throw ApiError.forbidden();
  const users = await userService.listCompanyUsers(req.user.companyId);
  res.status(200).json({ success: true, data: users });
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) throw ApiError.forbidden();
  const user = await userService.setUserActive(req.user.companyId, req.params.id, req.body.isActive, req.user.userId);
  res.status(200).json({ success: true, data: user });
});

export const updateOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await userService.updateOwnProfile(req.user.userId, req.body);
  res.status(200).json({ success: true, data: user });
});

export const changeOwnPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await userService.changeOwnPassword(req.user.userId, req.body);
  res.status(200).json({ success: true, message: 'Password changed' });
});
