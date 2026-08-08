import { Router } from 'express';
import * as chatController from './chat.controller';
import { listMessagesValidation, sendMessageValidation } from './chat.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/dm-threads', chatController.listDmThreads);
router.get('/:channelId/messages', listMessagesValidation, validate, chatController.listMessages);
router.post('/:channelId/messages', sendMessageValidation, validate, chatController.sendMessage);

export default router;
