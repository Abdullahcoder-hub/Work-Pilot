import { Router } from 'express';
import { body, param } from 'express-validator';
import * as platformController from './platform.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('super_admin'));

router.get('/companies', platformController.listCompanies);
router.get('/companies/:id', [param('id').isMongoId()], validate, platformController.getCompany);

router.patch(
  '/companies/:id/status',
  [param('id').isMongoId(), body('status').isIn(['active', 'suspended'])],
  validate,
  platformController.setCompanyStatus
);

router.patch(
  '/companies/:id/plan',
  [
    param('id').isMongoId(),
    body('plan').isIn(['free', 'pro', 'enterprise']),
    body('seatLimit').optional().isInt({ min: 1 }),
  ],
  validate,
  platformController.setCompanyPlan
);

export default router;
