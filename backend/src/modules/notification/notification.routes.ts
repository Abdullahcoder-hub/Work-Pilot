import { Router } from 'express';
import { param } from 'express-validator';
import * as notificationController from './notification.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/', notificationController.list);
router.patch('/:id/read', param('id').isMongoId(), validate, notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

export default router;
