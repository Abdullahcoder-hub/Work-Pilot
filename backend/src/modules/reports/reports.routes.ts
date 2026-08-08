import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope, authorize('company_admin', 'team_lead'));

router.get('/overview', reportsController.getOverview);

export default router;
