import { Schema, model, Document, Types } from 'mongoose';

export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_COLORS = ['brand', 'teal', 'amber', 'rose', 'violet', 'sky'] as const;
export type ProjectColor = (typeof PROJECT_COLORS)[number];

export interface IProject extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  departmentId: Types.ObjectId | null;
  name: string;
  description: string;
  status: ProjectStatus;
  color: ProjectColor;
  ownerId: Types.ObjectId;
  members: Types.ObjectId[];
  startDate: string;
  dueDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'planning',
      index: true,
    },
    color: {
      type: String,
      enum: PROJECT_COLORS,
      default: 'brand',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    startDate: {
      type: String,
      default: '',
      match: [/^$|^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format'],
    },
    dueDate: {
      type: String,
      default: '',
      match: [/^$|^\d{4}-\d{2}-\d{2}$/, 'dueDate must be in YYYY-MM-DD format'],
    },
  },
  { timestamps: true }
);

projectSchema.index({ companyId: 1, createdAt: -1 });
projectSchema.index({ companyId: 1, members: 1 });

export const Project = model<IProject>('Project', projectSchema);
