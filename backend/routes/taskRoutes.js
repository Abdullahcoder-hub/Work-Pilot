const express = require('express');
const { body } = require('express-validator');
const {
  getTasks,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  togglePinTask,
  clearAllTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const Task = require('../models/Task');

const router = express.Router();

// Every task route requires a logged-in user.
router.use(protect);

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('category')
    .optional()
    .isIn(Task.CATEGORIES)
    .withMessage(`Category must be one of: ${Task.CATEGORIES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(Task.PRIORITIES)
    .withMessage(`Priority must be one of: ${Task.PRIORITIES.join(', ')}`),
  body('dueDate')
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('dueDate must be in YYYY-MM-DD format'),
];

router.get('/', getTasks);
router.get('/stats', getTaskStats);
router.post('/', taskValidation, createTask);
router.delete('/', clearAllTasks);
router.put('/:id', taskValidation, updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', completeTask);
router.patch('/:id/pin', togglePinTask);

module.exports = router;
