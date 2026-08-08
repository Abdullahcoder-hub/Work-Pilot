import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as departmentService from './department.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, companyId: req.user.companyId };
}

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const departments = await departmentService.listDepartments(actor.companyId);
  res.status(200).json({ success: true, data: departments });
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const department = await departmentService.createDepartment(actor, req.body);
  res.status(201).json({ success: true, data: department });
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const department = await departmentService.updateDepartment(actor, req.params.id, req.body);
  res.status(200).json({ success: true, data: department });
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await departmentService.deleteDepartment(actor, req.params.id);
  res.status(200).json({ success: true, message: 'Department deleted' });
});
