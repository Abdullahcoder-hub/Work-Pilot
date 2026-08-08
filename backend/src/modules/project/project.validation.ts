import { body, param } from 'express-validator';
import { PROJECT_STATUSES, PROJECT_COLORS } from './project.model';

const dateField = (field: string) =>
  body(field)
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${field} must be in YYYY-MM-DD format`);

export const createProjectValidation = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Name must be 2-150 characters'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('departmentId').optional({ checkFalsy: true }).isMongoId(),
  body('status').optional().isIn(PROJECT_STATUSES),
  body('color').optional().isIn(PROJECT_COLORS),
  body('members').optional().isArray().withMessage('members must be an array of user ids'),
  body('members.*').optional().isMongoId(),
  dateField('startDate'),
  dateField('dueDate'),
];

export const updateProjectValidation = [
  param('id').isMongoId().withMessage('Invalid project id'),
  body('name').optional().trim().isLength({ min: 2, max: 150 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('departmentId').optional({ checkFalsy: true }).isMongoId(),
  body('status').optional().isIn(PROJECT_STATUSES),
  body('color').optional().isIn(PROJECT_COLORS),
  dateField('startDate'),
  dateField('dueDate'),
];

export const projectIdValidation = [param('id').isMongoId().withMessage('Invalid project id')];

export const memberMutationValidation = [
  param('id').isMongoId().withMessage('Invalid project id'),
  body('userId').isMongoId().withMessage('userId must be a valid id'),
];
