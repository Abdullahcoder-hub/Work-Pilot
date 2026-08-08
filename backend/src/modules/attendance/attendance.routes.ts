import { Router } from 'express';
import { query } from 'express-validator';
import * as attendanceController from './attendance.controller';
import {
  listAttendanceValidation,
  manualEntryValidation,
  updateAttendanceValidation,
  attendanceIdValidation,
} from './attendance.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/today', attendanceController.getToday);
router.get('/summary', [query('userId').optional().isMongoId(), query('year').optional().isInt(), query('month').optional().isInt({ min: 1, max: 12 })], validate, attendanceController.getMonthlySummary);
router.get('/', listAttendanceValidation, validate, attendanceController.listAttendance);

router.post('/', authorize('company_admin', 'team_lead'), manualEntryValidation, validate, attendanceController.manualEntry);
router.patch('/:id', authorize('company_admin', 'team_lead'), updateAttendanceValidation, validate, attendanceController.updateAttendance);
router.delete('/:id', authorize('company_admin', 'team_lead'), attendanceIdValidation, validate, attendanceController.deleteAttendance);

export default router;
