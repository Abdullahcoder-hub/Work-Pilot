import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as companyService from './company.service';

export const getMyCompany = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) throw ApiError.forbidden();
  const company = await companyService.getMyCompany({ companyId: req.user.companyId });
  res.status(200).json({ success: true, data: company });
});

export const updateMyCompany = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.companyId) throw ApiError.forbidden();
  const company = await companyService.updateMyCompany({ companyId: req.user.companyId }, req.body);
  res.status(200).json({ success: true, data: company });
});
