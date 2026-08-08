import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as leaveService from './leave.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const listLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { status, userId } = req.query;
  const requests = await leaveService.listLeaveRequests(actor, {
    status: status as never,
    userId: userId as string | undefined,
  });
  res.status(200).json({ success: true, data: requests });
});

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const userId = (req.query.userId as string | undefined) ?? actor.userId;
  const balance = await leaveService.getBalance(actor, userId);
  res.status(200).json({ success: true, data: balance });
});

export const createLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const leave = await leaveService.createLeaveRequest(actor, req.body);
  res.status(201).json({ success: true, data: leave });
});

export const reviewLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const leave = await leaveService.reviewLeaveRequest(actor, req.params.id, req.body);
  res.status(200).json({ success: true, data: leave });
});

export const cancelLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const leave = await leaveService.cancelLeaveRequest(actor, req.params.id);
  res.status(200).json({ success: true, data: leave });
});
