import { Router } from 'express';
import { param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as fileController from './file.controller';
import { uploadMiddleware } from './file.service';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

// Uploads write to disk and count against storage — cap the rate
// independent of the general API limits.
const uploadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads. Wait a few minutes and try again.' },
});

router.get('/', [query('search').optional().isString(), query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })], validate, fileController.list);

// authenticate/requireCompanyScope run first so uploadMiddleware has
// req.user available to pick the right company's storage directory.
router.post('/upload', uploadRateLimiter, uploadMiddleware, fileController.upload);
router.get('/:id/download', [param('id').isMongoId()], validate, fileController.download);
router.delete('/:id', [param('id').isMongoId()], validate, fileController.remove);

export default router;
