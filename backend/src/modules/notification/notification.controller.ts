import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as notificationService from './notification.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden('This endpoint requires a company-scoped account');
  return { userId: req.user.userId, companyId: req.user.companyId };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { page, limit, unreadOnly } = req.query;
  const result = await notificationService.listNotifications(actor, {
    page: page as unknown as number | undefined,
    limit: limit as unknown as number | undefined,
    unreadOnly: unreadOnly === 'true',
  });
  res.status(200).json({
    success: true,
    data: result.notifications,
    unreadCount: result.unreadCount,
    pagination: result.pagination,
  });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const notification = await notificationService.markRead(actor, req.params.id);
  res.status(200).json({ success: true, data: notification });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await notificationService.markAllRead(actor);
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});
