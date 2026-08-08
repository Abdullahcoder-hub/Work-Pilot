import { Schema, model, Document, Types } from 'mongoose';

export const ACTIVITY_ACTIONS = [
  'task_created',
  'task_assigned',
  'task_reassigned',
  'status_changed',
  'task_completed',
  'task_reopened',
  'task_approved',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  taskId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: ActivityAction;
  /** Human-readable summary, e.g. "Ali assigned this task to Sara". Pre-built
   * at write time so the timeline never depends on re-deriving text from
   * raw fields later. */
  message: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    message: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ taskId: 1, createdAt: 1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);
