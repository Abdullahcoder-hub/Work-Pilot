import { Router } from 'express';
import * as meetingController from './meeting.controller';
import {
  createMeetingValidation,
  updateMeetingValidation,
  meetingIdValidation,
  listMeetingsValidation,
} from './meeting.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/', listMeetingsValidation, validate, meetingController.listMeetings);
router.post('/', createMeetingValidation, validate, meetingController.createMeeting);
router.get('/:id', meetingIdValidation, validate, meetingController.getMeeting);
router.patch('/:id', updateMeetingValidation, validate, meetingController.updateMeeting);
router.delete('/:id', meetingIdValidation, validate, meetingController.deleteMeeting);

export default router;
