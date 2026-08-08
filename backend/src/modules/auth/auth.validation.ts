import { body } from 'express-validator';
import { ROLES } from '../user/user.model';

export const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function hasStrongPassword(password: string): boolean {
  return PASSWORD_STRENGTH_REGEX.test(password);
}

function strongPasswordValidation(fieldName: string) {
  return body(fieldName)
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(PASSWORD_STRENGTH_REGEX)
    .withMessage('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
}

export const registerCompanyValidation = [
  body('companyName').trim().isLength({ min: 2, max: 120 }).withMessage('Company name must be 2-120 characters'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  strongPasswordValidation('password'),
];

export const inviteUserValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role')
    .isIn(ROLES.filter((r) => r !== 'super_admin'))
    .withMessage('Role must be one of company_admin, team_lead, employee'),
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const acceptInviteValidation = [
  body('token').isString().isLength({ min: 10 }).withMessage('A valid invite token is required'),
  strongPasswordValidation('password'),
];

export const tokenOnlyValidation = [body('token').isString().isLength({ min: 10 }).withMessage('A valid token is required')];

export const emailOnlyValidation = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token').isString().isLength({ min: 10 }).withMessage('A valid reset token is required'),
  strongPasswordValidation('password'),
];
