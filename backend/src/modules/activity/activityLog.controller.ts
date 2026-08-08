import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as activityService from './activityLog.service';

export const listCompanyActivity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden('This endpoint requires a company-scoped account');
  const activity = await activityService.listCompanyActivity(req.user.companyId, 50);
  res.status(200).json({ success: true, data: activity });
});
