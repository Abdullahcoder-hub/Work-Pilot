import { Router } from 'express';
import { body } from 'express-validator';
import * as companyController from './company.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/me', companyController.getMyCompany);
router.patch(
  '/me',
  authorize('company_admin'),
  [body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Company name must be 2-120 characters')],
  validate,
  companyController.updateMyCompany
);

export default router;
