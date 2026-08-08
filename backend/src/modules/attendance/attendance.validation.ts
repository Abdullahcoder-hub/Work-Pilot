import { body, param, query } from 'express-validator';
import { ATTENDANCE_STATUSES } from './attendance.model';

export const listAttendanceValidation = [
  query('from').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('from must be YYYY-MM-DD'),
  query('to').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('to must be YYYY-MM-DD'),
  query('userId').optional().isMongoId(),
];

export const manualEntryValidation = [
  body('userId').isMongoId().withMessage('userId is required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  body('status').isIn(ATTENDANCE_STATUSES).withMessage(`status must be one of ${ATTENDANCE_STATUSES.join(', ')}`),
  body('clockIn').optional({ checkFalsy: true }).isISO8601().withMessage('clockIn must be a valid date/time'),
  body('clockOut').optional({ checkFalsy: true }).isISO8601().withMessage('clockOut must be a valid date/time'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

export const updateAttendanceValidation = [
  param('id').isMongoId().withMessage('Invalid attendance record id'),
  body('status').optional().isIn(ATTENDANCE_STATUSES),
  body('clockIn').optional({ checkFalsy: true }).isISO8601(),
  body('clockOut').optional({ checkFalsy: true }).isISO8601(),
  body('notes').optional().trim().isLength({ max: 500 }),
];

export const attendanceIdValidation = [param('id').isMongoId().withMessage('Invalid attendance record id')];
