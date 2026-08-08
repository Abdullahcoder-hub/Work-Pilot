import { body, param, query } from 'express-validator';

export const createMeetingValidation = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('projectId').optional({ checkFalsy: true }).isMongoId(),
  body('attendees').optional().isArray().withMessage('attendees must be an array of user ids'),
  body('attendees.*').optional().isMongoId(),
  body('startTime').isISO8601().withMessage('startTime must be a valid date/time').toDate(),
  body('endTime').isISO8601().withMessage('endTime must be a valid date/time').toDate(),
  body('location').optional().trim().isLength({ max: 300 }),
  body().custom((value) => {
    if (value.startTime && value.endTime && new Date(value.endTime) <= new Date(value.startTime)) {
      throw new Error('endTime must be after startTime');
    }
    return true;
  }),
];

export const updateMeetingValidation = [
  param('id').isMongoId().withMessage('Invalid meeting id'),
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('attendees').optional().isArray(),
  body('attendees.*').optional().isMongoId(),
  body('startTime').optional().isISO8601().toDate(),
  body('endTime').optional().isISO8601().toDate(),
  body('location').optional().trim().isLength({ max: 300 }),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled']),
];

export const meetingIdValidation = [param('id').isMongoId().withMessage('Invalid meeting id')];

export const listMeetingsValidation = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('projectId').optional().isMongoId(),
];
