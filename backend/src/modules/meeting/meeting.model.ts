import { Schema, model, Document, Types } from 'mongoose';

export const MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  projectId: Types.ObjectId | null;
  title: string;
  description: string;
  organizerId: Types.ObjectId;
  attendees: Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  /** Physical room, or a video-call link — free text either way. */
  location: string;
  status: MeetingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    title: { type: String, required: [true, 'Meeting title is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 2000 },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attendees: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, trim: true, default: '', maxlength: 300 },
    status: { type: String, enum: MEETING_STATUSES, default: 'scheduled', index: true },
  },
  { timestamps: true }
);

meetingSchema.index({ companyId: 1, startTime: 1 });
meetingSchema.index({ companyId: 1, attendees: 1 });

export const Meeting = model<IMeeting>('Meeting', meetingSchema);
