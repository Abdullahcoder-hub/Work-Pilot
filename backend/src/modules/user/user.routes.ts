import { Router } from 'express';
import { body, param } from 'express-validator';
import * as userController from './user.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/', userController.listUsers);

router.patch(
  '/me',
  [body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')],
  validate,
  userController.updateOwnProfile
);

router.post(
  '/me/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  userController.changeOwnPassword
);

router.patch(
  '/:id/status',
  authorize('company_admin', 'team_lead'),
  [param('id').isMongoId(), body('isActive').isBoolean()],
  validate,
  userController.setUserActive
);

export default router;
