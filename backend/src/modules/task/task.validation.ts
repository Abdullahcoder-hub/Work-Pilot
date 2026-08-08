import { body, param, query } from 'express-validator';
import { CATEGORIES, PRIORITIES, TASK_STATUSES } from './task.model';

export const createTaskValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description max 2000 chars'),
  body('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of ${CATEGORIES.join(', ')}`),
  body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of ${PRIORITIES.join(', ')}`),
  body('status').optional().isIn(TASK_STATUSES).withMessage(`status must be one of ${TASK_STATUSES.join(', ')}`),
  body('projectId').optional({ checkFalsy: true }).isMongoId().withMessage('projectId must be a valid id'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('dueDate must be in YYYY-MM-DD format'),
  body('assigneeId').optional({ checkFalsy: true }).isMongoId().withMessage('assigneeId must be a valid id'),
];

export const updateTaskValidation = [
  param('id').isMongoId().withMessage('Invalid task id'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('category').optional().isIn(CATEGORIES),
  body('priority').optional().isIn(PRIORITIES),
  body('status').optional().isIn(TASK_STATUSES),
  body('projectId').optional({ checkFalsy: true }).isMongoId(),
  body('dueDate')
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('dueDate must be in YYYY-MM-DD format'),
  body('assigneeId').optional({ checkFalsy: true }).isMongoId(),
  body('completed').optional().isBoolean(),
  body('pinned').optional().isBoolean(),
];

export const moveTaskValidation = [
  param('id').isMongoId().withMessage('Invalid task id'),
  body('status').isIn(TASK_STATUSES).withMessage(`status must be one of ${TASK_STATUSES.join(', ')}`),
  body('index').isInt({ min: 0 }).withMessage('index must be a non-negative integer').toInt(),
];

export const taskIdValidation = [param('id').isMongoId().withMessage('Invalid task id')];

export const listTasksValidation = [
  query('category').optional().isIn(CATEGORIES),
  query('priority').optional().isIn(PRIORITIES),
  query('status').optional().isIn(TASK_STATUSES),
  query('projectId').optional().isMongoId(),
  query('completed').optional().isBoolean(),
  query('scope').optional().isIn(['mine', 'assigned', 'all']),
  query('search').optional().trim().isLength({ max: 200 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
];
