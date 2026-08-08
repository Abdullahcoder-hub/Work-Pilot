import { Router } from 'express';
import * as taskController from './task.controller';
import {
  createTaskValidation,
  updateTaskValidation,
  moveTaskValidation,
  taskIdValidation,
  listTasksValidation,
} from './task.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/stats', taskController.getStats);
router.get('/', listTasksValidation, validate, taskController.listTasks);
router.post('/', createTaskValidation, validate, taskController.createTask);
router.get('/:id', taskIdValidation, validate, taskController.getTask);
router.patch('/:id', updateTaskValidation, validate, taskController.updateTask);
router.patch('/:id/move', moveTaskValidation, validate, taskController.moveTask);
router.post('/:id/approve', taskIdValidation, validate, taskController.approveTask);
router.get('/:id/activity', taskIdValidation, validate, taskController.getTaskActivity);
router.delete('/:id', taskIdValidation, validate, taskController.deleteTask);

export default router;
