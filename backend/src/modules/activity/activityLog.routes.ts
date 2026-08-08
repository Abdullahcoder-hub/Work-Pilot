import { Router } from 'express';
import * as activityController from './activityLog.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get('/', authorize('company_admin', 'team_lead'), activityController.listCompanyActivity);

export default router;
