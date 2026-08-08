import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as aiController from './ai.controller';
import { chatValidation } from './ai.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { requireCompanyScope } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, requireCompanyScope);

// The assistant runs entirely on this server (no external API calls), so
// this isn't about cost — it's a basic guard against someone hammering
// the endpoint.
const chatRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI Assistant requests. Wait a few minutes and try again.' },
});

router.get('/history', aiController.getHistory);
router.delete('/history', aiController.clearHistory);
router.post('/chat', chatRateLimiter, chatValidation, validate, aiController.chat);

export default router;
