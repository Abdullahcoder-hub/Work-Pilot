import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { param } from 'express-validator';
import * as authController from './auth.controller';
import {
  registerCompanyValidation,
  inviteUserValidation,
  loginValidation,
  acceptInviteValidation,
  tokenOnlyValidation,
  emailOnlyValidation,
  resetPasswordValidation,
} from './auth.validation';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize, requireCompanyScope } from '../../middleware/authorize';

const router = Router();

// Public auth endpoints are brute-force targets — cap attempts per IP.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' },
});

router.post('/register', authRateLimiter, registerCompanyValidation, validate, authController.registerCompany);
router.post('/login', authRateLimiter, loginValidation, validate, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

// Invite acceptance / email verification / password reset — all public
// (the person isn't logged in yet) and rate-limited like other auth entry points.
router.get('/token/:token', authRateLimiter, param('token').isString().isLength({ min: 10 }), validate, authController.inspectToken);
router.post('/accept-invite', authRateLimiter, acceptInviteValidation, validate, authController.acceptInvite);
router.post('/verify-email', authRateLimiter, tokenOnlyValidation, validate, authController.verifyEmail);
router.post('/resend-verification', authRateLimiter, emailOnlyValidation, validate, authController.resendVerification);
router.post('/forgot-password', authRateLimiter, emailOnlyValidation, validate, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, resetPasswordValidation, validate, authController.resetPassword);

router.post(
  '/invite',
  authenticate,
  requireCompanyScope,
  authorize('company_admin', 'team_lead'),
  inviteUserValidation,
  validate,
  authController.invite
);

export default router;
