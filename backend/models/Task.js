const mongoose = require('mongoose');

const CATEGORIES = ['Study', 'Work', 'Personal', 'Shopping', 'Fitness'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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
    // Stored as a plain YYYY-MM-DD string to match the frontend's <input type="date">
    // and avoid timezone-shift bugs when comparing dates.
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
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

// Speeds up the common "my tasks, newest first" and search queries.
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, title: 'text', description: 'text' });

TaskSchema.statics.CATEGORIES = CATEGORIES;
TaskSchema.statics.PRIORITIES = PRIORITIES;

module.exports = mongoose.model('Task', TaskSchema);
