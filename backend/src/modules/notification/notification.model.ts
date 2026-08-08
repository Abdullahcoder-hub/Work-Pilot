import { Schema, model, Document, Types } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'task_assigned',
  'task_completed',
  'task_approved',
  'task_status_changed',
  'meeting_invite',
  'meeting_updated',
  'meeting_cancelled',
  'direct_message',
  'leave_approved',
  'leave_rejected',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  /** Who this notification is for. */
  recipientId: Types.ObjectId;
  /** Who triggered it (for avatar/name display). Null for system-generated notifications. */
  actorId: Types.ObjectId | null;
  type: NotificationType;
  title: string;
  message: string;
  taskId: Types.ObjectId | null;
  meetingId: Types.ObjectId | null;
  /** The chat channelId to open (a DM channel like `dm:<id>:<id>`, or a project channel). */
  channelId: string | null;
  leaveId: Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', default: null },
    channelId: { type: String, default: null },
    leaveId: { type: Schema.Types.ObjectId, ref: 'LeaveRequest', default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
