import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as calendarService from './calendar.service';

export const getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  const actor = { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };

  const { from, to } = req.query as { from: string; to: string };
  const events = await calendarService.getCalendarEvents(actor, { from, to });
  res.status(200).json({ success: true, data: events });
});
