import { Schema, model, Types } from 'mongoose';

export const CATEGORIES = ['Study', 'Work', 'Personal', 'Shopping', 'Fitness'] as const;
export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const;
export type TaskCategory = (typeof CATEGORIES)[number];
export type TaskPriority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface ITask {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  projectId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  assigneeId: Types.ObjectId | null;
  /** @deprecated kept for backward compatibility with the pre-tenant schema; mirrors createdBy */
  userId: Types.ObjectId;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  /** Kanban column. Kept in sync with `completed` (done <-> completed=true). */
  status: TaskStatus;
  /** Position within its (projectId, status) column, for drag-and-drop ordering. */
  order: number;
  dueDate: string;
  completed: boolean;
  completedAt: Date | null;
  /** Set by a team lead/company admin after reviewing a completed task. */
  approvedBy: Types.ObjectId | null;
  approvedAt: Date | null;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Retained so the pre-existing frontend/query patterns (`userId`) keep
    // working during the migration window; always kept equal to createdBy.
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Work',
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'Medium',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: String,
      default: '',
      match: [/^$|^\d{4}-\d{2}-\d{2}$/, 'dueDate must be in YYYY-MM-DD format'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

taskSchema.index({ companyId: 1, createdAt: -1 });
taskSchema.index({ companyId: 1, assigneeId: 1 });
taskSchema.index({ projectId: 1, status: 1, order: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export const Task = model<ITask>('Task', taskSchema);
