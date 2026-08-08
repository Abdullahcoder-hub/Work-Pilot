import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as meetingService from './meeting.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const listMeetings = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { from, to, projectId } = req.query;
  const meetings = await meetingService.listMeetings(actor, {
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
    projectId: projectId as string | undefined,
  });
  res.status(200).json({ success: true, data: meetings });
});

export const getMeeting = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const meeting = await meetingService.getMeetingById(actor, req.params.id);
  res.status(200).json({ success: true, data: meeting });
});

export const createMeeting = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const meeting = await meetingService.createMeeting(actor, req.body);
  res.status(201).json({ success: true, data: meeting });
});

export const updateMeeting = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const meeting = await meetingService.updateMeeting(actor, req.params.id, req.body);
  res.status(200).json({ success: true, data: meeting });
});

export const deleteMeeting = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await meetingService.deleteMeeting(actor, req.params.id);
  res.status(200).json({ success: true, message: 'Meeting deleted' });
});
