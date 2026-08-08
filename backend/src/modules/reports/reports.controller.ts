import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as reportsService from './reports.service';

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  const overview = await reportsService.getOverview({ companyId: req.user.companyId });
  res.status(200).json({ success: true, data: overview });
});
