import { Schema, model, Types } from 'mongoose';

export const LEAVE_TYPES = ['annual', 'sick', 'casual', 'unpaid', 'other'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface ILeaveRequest {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  leaveType: LeaveType;
  /** YYYY-MM-DD, inclusive on both ends. */
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  reviewNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const dateFieldPattern: [RegExp, string] = [/^\d{4}-\d{2}-\d{2}$/, 'must be in YYYY-MM-DD format'];

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: String, required: true, match: dateFieldPattern },
    endDate: { type: String, required: true, match: dateFieldPattern },
    reason: { type: String, trim: true, default: '', maxlength: 500 },
    status: { type: String, enum: LEAVE_STATUSES, default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ companyId: 1, userId: 1, startDate: 1 });
leaveRequestSchema.index({ companyId: 1, status: 1 });

export const LeaveRequest = model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
