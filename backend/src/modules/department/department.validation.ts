import { body, param } from 'express-validator';

export const createDepartmentValidation = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('headUserId').optional({ checkFalsy: true }).isMongoId().withMessage('headUserId must be a valid id'),
];

export const updateDepartmentValidation = [
  param('id').isMongoId().withMessage('Invalid department id'),
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('headUserId').optional({ checkFalsy: true }).isMongoId(),
];

export const departmentIdValidation = [param('id').isMongoId().withMessage('Invalid department id')];
