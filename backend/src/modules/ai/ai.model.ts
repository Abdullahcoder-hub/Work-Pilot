import { Schema, model, Document, Types } from 'mongoose';

export const AI_ROLES = ['user', 'assistant'] as const;
export type AiRole = (typeof AI_ROLES)[number];

export const AI_ATTENDANCE_ACTIONS = ['clock_in', 'clock_out'] as const;
export type AiAttendanceAction = (typeof AI_ATTENDANCE_ACTIONS)[number];

export interface IAiMessage extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  role: AiRole;
  content: string;
  /** Which rule-based intent this message resolved to (create_task, clock_in, unknown, ...) — null for user messages. */
  intent: string | null;
  createdTaskId: Types.ObjectId | null;
  completedTaskId: Types.ObjectId | null;
  /** Deletion removes the task, so there's no id left to reference — the title is kept for display instead. */
  deletedTaskTitle: string | null;
  scheduledMeetingId: Types.ObjectId | null;
  /** Chat channelId (a DM thread) a message or file was sent to on the user's behalf. */
  messagedChannelId: string | null;
  sentFileId: Types.ObjectId | null;
  attendanceAction: AiAttendanceAction | null;
  createdAt: Date;
}

const aiMessageSchema = new Schema<IAiMessage>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: AI_ROLES, required: true },
    content: { type: String, required: true, maxlength: 8000 },
    intent: { type: String, default: null },
    createdTaskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    completedTaskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    deletedTaskTitle: { type: String, default: null },
    scheduledMeetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', default: null },
    messagedChannelId: { type: String, default: null },
    sentFileId: { type: Schema.Types.ObjectId, ref: 'File', default: null },
    attendanceAction: { type: String, enum: AI_ATTENDANCE_ACTIONS, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Each person has one running assistant thread — fetched in order.
aiMessageSchema.index({ companyId: 1, userId: 1, createdAt: 1 });

export const AiMessage = model<IAiMessage>('AiMessage', aiMessageSchema);
