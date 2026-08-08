import { Router } from 'express';
import * as leaveController from './leave.controller';
import { createLeaveValidation, reviewLeaveValidation, leaveIdValidation, listLeaveValidation } from './leave.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/balance', leaveController.getBalance);
router.get('/', listLeaveValidation, validate, leaveController.listLeaveRequests);
router.post('/', createLeaveValidation, validate, leaveController.createLeaveRequest);
router.patch('/:id/review', authorize('company_admin', 'team_lead'), reviewLeaveValidation, validate, leaveController.reviewLeaveRequest);
router.patch('/:id/cancel', leaveIdValidation, validate, leaveController.cancelLeaveRequest);

export default router;
