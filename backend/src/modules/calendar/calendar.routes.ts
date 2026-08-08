import { Router } from 'express';
import { query } from 'express-validator';
import * as calendarController from './calendar.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  '/',
  [
    query('from').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('from must be YYYY-MM-DD'),
    query('to').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('to must be YYYY-MM-DD'),
  ],
  validate,
  calendarController.getCalendarEvents
);

export default router;
