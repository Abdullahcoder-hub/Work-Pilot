import { body, param, query } from 'express-validator';
import { LEAVE_TYPES } from './leave.model';

export const createLeaveValidation = [
  body('leaveType').isIn(LEAVE_TYPES).withMessage(`leaveType must be one of ${LEAVE_TYPES.join(', ')}`),
  body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('startDate must be YYYY-MM-DD'),
  body('endDate').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('endDate must be YYYY-MM-DD'),
  body('reason').optional().trim().isLength({ max: 500 }),
  body().custom((value) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      throw new Error('endDate must be on or after startDate');
    }
    return true;
  }),
];

export const reviewLeaveValidation = [
  param('id').isMongoId().withMessage('Invalid leave request id'),
  body('status').isIn(['approved', 'rejected']).withMessage('status must be approved or rejected'),
  body('reviewNote').optional().trim().isLength({ max: 500 }),
];

export const leaveIdValidation = [param('id').isMongoId().withMessage('Invalid leave request id')];

export const listLeaveValidation = [
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']),
  query('userId').optional().isMongoId(),
];
