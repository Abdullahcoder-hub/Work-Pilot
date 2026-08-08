const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

/** Local YYYY-MM-DD string for "today", matching the frontend's date-key format. */
function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for the logged-in user, with optional
 *          search / category / priority / completed / filter / sort.
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const { search, category, priority, completed, filter, sort } = req.query;

  const query = { userId: req.user._id };

  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (completed === 'true') query.completed = true;
  if (completed === 'false') query.completed = false;

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  const today = todayString();
  if (filter === 'today') {
    query.dueDate = today;
  } else if (filter === 'important') {
    query.priority = 'High';
    query.completed = false;
  } else if (filter === 'completed') {
    query.completed = true;
  } else if (filter === 'active') {
    query.completed = false;
  } else if (filter === 'overdue') {
    query.completed = false;
    query.dueDate = { $ne: '', $lt: today };
  } else if (filter === 'pinned') {
    query.pinned = true;
    query.completed = false;
  }

  let tasks = await Task.find(query).lean();

  // Sorting is applied in JS (rather than Mongo) so priority ordering and the
  // "pinned tasks float to the top" rule can share the exact same logic the
  // frontend historically used with Local Storage.
  tasks.sort((a, b) => {
    if (a.completed && b.completed) {
      return new Date(b.completedAt || 0) - new Date(a.completedAt || 0);
    }
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    switch (sort) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'priority':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  res.status(200).json({ success: true, count: tasks.length, tasks });
});

/**
 * @route   GET /api/tasks/stats
 * @desc    Dashboard statistics for the logged-in user.
 * @access  Private
 */
const getTaskStats = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ userId: req.user._id }).lean();
  const today = todayString();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const todayCount = tasks.filter((t) => t.dueDate === today).length;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  res.status(200).json({
    success: true,
    stats: { total, pending, completed, today: todayCount, overdue, completionRate },
  });
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }

  const { title, description, category, priority, dueDate } = req.body;

  const task = await Task.create({
    userId: req.user._id,
    title,
    description: description || '',
    category: category || 'Work',
    priority: priority || 'Medium',
    dueDate: dueDate || '',
  });

  res.status(201).json({ success: true, task });
});

/** Shared ownership guard: fetches a task and confirms it belongs to req.user. */
async function findOwnedTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  if (task.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this task');
  }
  return task;
}

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task's editable fields
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }

  const task = await findOwnedTask(req, res);

  if (task.completed) {
    res.status(400);
    throw new Error('Completed tasks cannot be edited');
  }

  const { title, description, category, priority, dueDate } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (category !== undefined) task.category = category;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;

  await task.save();
  res.status(200).json({ success: true, task });
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Permanently delete a task
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req, res);
  await task.deleteOne();
  res.status(200).json({ success: true, message: 'Task deleted', id: req.params.id });
});

/**
 * @route   PATCH /api/tasks/:id/complete
 * @desc    Mark a task as permanently completed (one-way transition)
 * @access  Private
 */
const completeTask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req, res);

  if (task.completed) {
    res.status(400);
    throw new Error('Task is already completed');
  }

  task.completed = true;
  task.completedAt = new Date();
  task.pinned = false;
  await task.save();

  res.status(200).json({ success: true, task });
});

/**
 * @route   PATCH /api/tasks/:id/pin
 * @desc    Toggle the pinned state of an active task
 * @access  Private
 */
const togglePinTask = asyncHandler(async (req, res) => {
  const task = await findOwnedTask(req, res);

  if (task.completed) {
    res.status(400);
    throw new Error('Completed tasks cannot be pinned');
  }

  task.pinned = !task.pinned;
  await task.save();

  res.status(200).json({ success: true, task });
});

/**
 * @route   DELETE /api/tasks
 * @desc    Delete ALL tasks belonging to the logged-in user
 * @access  Private
 */
const clearAllTasks = asyncHandler(async (req, res) => {
  await Task.deleteMany({ userId: req.user._id });
  res.status(200).json({ success: true, message: 'All tasks cleared' });
});

module.exports = {
  getTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  togglePinTask,
  clearAllTasks,
};
