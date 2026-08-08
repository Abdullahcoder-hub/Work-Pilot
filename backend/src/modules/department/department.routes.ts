import { Router } from 'express';
import * as departmentController from './department.controller';
import {
  createDepartmentValidation,
  updateDepartmentValidation,
  departmentIdValidation,
} from './department.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/', departmentController.listDepartments);

router.post(
  '/',
  authorize('company_admin'),
  createDepartmentValidation,
  validate,
  departmentController.createDepartment
);

router.patch(
  '/:id',
  authorize('company_admin'),
  updateDepartmentValidation,
  validate,
  departmentController.updateDepartment
);

router.delete(
  '/:id',
  authorize('company_admin'),
  departmentIdValidation,
  validate,
  departmentController.deleteDepartment
);

export default router;
