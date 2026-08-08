import { Types } from 'mongoose';
import { Notification, NotificationType } from './notification.model';
import { ApiError } from '../../utils/ApiError';
import { getIO } from '../../realtime/io';

interface Actor {
  userId: string;
  companyId: string;
}

interface CreateNotificationInput {
  companyId: string;
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string | null;
  meetingId?: string | null;
  channelId?: string | null;
  leaveId?: string | null;
}

/**
 * Creates a notification. Never throws — a failed notification should
 * never break the task action that triggered it. Also skips notifying a
 * user about their own action (e.g. self-assigning a task). If the
 * recipient has a live socket connection, pushes it instantly on top of
 * the row in the DB — the frontend's poll remains a fallback for anyone
 * not currently connected.
 */
export async function notify(input: CreateNotificationInput): Promise<void> {
  if (input.actorId && input.actorId === input.recipientId) return;
  try {
    const notification = await Notification.create({
      companyId: input.companyId,
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      taskId: input.taskId ?? null,
      meetingId: input.meetingId ?? null,
      channelId: input.channelId ?? null,
      leaveId: input.leaveId ?? null,
    });
    getIO()?.to(`user:${input.recipientId}`).emit('notification:new', notification.toJSON());
  } catch {
    // Swallow — notifications are best-effort.
  }
}

export async function listNotifications(actor: Actor, opts: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const query: Record<string, unknown> = { companyId: actor.companyId, recipientId: actor.userId };
  if (opts.unreadOnly) query.isRead = false;

  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('actorId', 'name email'),
    Notification.countDocuments(query),
    Notification.countDocuments({ companyId: actor.companyId, recipientId: actor.userId, isRead: false }),
  ]);

  return { notifications, unreadCount, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function markRead(actor: Actor, notificationId: string) {
  const notification = await Notification.findOne({
    _id: notificationId,
    companyId: actor.companyId,
    recipientId: actor.userId,
  });
  if (!notification) throw ApiError.notFound('Notification not found');
  notification.isRead = true;
  await notification.save();
  return notification;
}

export async function markAllRead(actor: Actor) {
  await Notification.updateMany(
    { companyId: actor.companyId, recipientId: actor.userId, isRead: false },
    { $set: { isRead: true } }
  );
}

// Re-exported so callers elsewhere don't need to import mongoose directly.
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
