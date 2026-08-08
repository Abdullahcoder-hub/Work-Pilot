import { Schema, model, Document, Types } from 'mongoose';

export const ATTENDANCE_STATUSES = ['present', 'late', 'half_day', 'absent'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** Clock-in after this hour (local server time) is marked 'late' instead of 'present'. */
export const LATE_THRESHOLD_HOUR = 9.5; // 9:30 AM

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  /** YYYY-MM-DD — one record per user per calendar day. */
  date: string;
  clockIn: Date | null;
  clockOut: Date | null;
  status: AttendanceStatus;
  notes: string;
  /** Set when a manager creates/edits the record instead of the employee clocking in themselves. */
  markedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'],
    },
    clockIn: { type: Date, default: null },
    clockOut: { type: Date, default: null },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: 'present' },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// One attendance record per person per day.
attendanceSchema.index({ companyId: 1, userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, date: 1 });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
