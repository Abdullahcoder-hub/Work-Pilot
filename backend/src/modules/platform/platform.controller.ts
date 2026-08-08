import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as platformService from './platform.service';

export const listCompanies = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await platformService.listCompanies(page, limit);
  res.status(200).json({ success: true, data: result.companies, pagination: result.pagination });
});

export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await platformService.getCompany(req.params.id);
  res.status(200).json({ success: true, data: company });
});

export const setCompanyStatus = asyncHandler(async (req: Request, res: Response) => {
  const company = await platformService.setCompanyStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: company });
});

export const setCompanyPlan = asyncHandler(async (req: Request, res: Response) => {
  const company = await platformService.setCompanyPlan(req.params.id, req.body.plan, req.body.seatLimit);
  res.status(200).json({ success: true, data: company });
});
