import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as attendanceService from './attendance.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const clockIn = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const record = await attendanceService.clockIn(actor);
  res.status(200).json({ success: true, data: record });
});

export const clockOut = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const record = await attendanceService.clockOut(actor);
  res.status(200).json({ success: true, data: record });
});

export const getToday = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const record = await attendanceService.getToday(actor);
  res.status(200).json({ success: true, data: record });
});

export const listAttendance = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { from, to, userId } = req.query;
  const records = await attendanceService.listAttendance(actor, {
    from: from as string | undefined,
    to: to as string | undefined,
    userId: userId as string | undefined,
  });
  res.status(200).json({ success: true, data: records });
});

export const manualEntry = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const record = await attendanceService.manualEntry(actor, req.body);
  res.status(201).json({ success: true, data: record });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const record = await attendanceService.updateAttendance(actor, req.params.id, req.body);
  res.status(200).json({ success: true, data: record });
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await attendanceService.deleteAttendance(actor, req.params.id);
  res.status(200).json({ success: true, message: 'Attendance record deleted' });
});

export const getMonthlySummary = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const userId = (req.query.userId as string | undefined) ?? actor.userId;
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const summary = await attendanceService.getMonthlySummary(actor, userId, year, month);
  res.status(200).json({ success: true, data: summary });
});
