import { Router } from 'express';
import * as projectController from './project.controller';
import {
  createProjectValidation,
  updateProjectValidation,
  projectIdValidation,
  memberMutationValidation,
} from './project.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/', projectController.listProjects);
router.post('/', createProjectValidation, validate, projectController.createProject);
router.get('/:id', projectIdValidation, validate, projectController.getProject);
router.patch('/:id', updateProjectValidation, validate, projectController.updateProject);
router.delete('/:id', projectIdValidation, validate, projectController.deleteProject);

router.post('/:id/members', memberMutationValidation, validate, projectController.addMember);
router.delete('/:id/members', memberMutationValidation, validate, projectController.removeMember);

export default router;
