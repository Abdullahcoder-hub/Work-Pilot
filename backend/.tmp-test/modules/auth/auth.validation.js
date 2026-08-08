"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordValidation = exports.emailOnlyValidation = exports.tokenOnlyValidation = exports.acceptInviteValidation = exports.loginValidation = exports.inviteUserValidation = exports.registerCompanyValidation = exports.PASSWORD_STRENGTH_REGEX = void 0;
exports.hasStrongPassword = hasStrongPassword;
const express_validator_1 = require("express-validator");
const user_model_1 = require("../user/user.model");
exports.PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
function hasStrongPassword(password) {
    return exports.PASSWORD_STRENGTH_REGEX.test(password);
}
function strongPasswordValidation(fieldName) {
    return (0, express_validator_1.body)(fieldName)
        .isString()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(exports.PASSWORD_STRENGTH_REGEX)
        .withMessage('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
}
exports.registerCompanyValidation = [
    (0, express_validator_1.body)('companyName').trim().isLength({ min: 2, max: 120 }).withMessage('Company name must be 2-120 characters'),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    strongPasswordValidation('password'),
];
exports.inviteUserValidation = [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    (0, express_validator_1.body)('role')
        .isIn(user_model_1.ROLES.filter((r) => r !== 'super_admin'))
        .withMessage('Role must be one of company_admin, team_lead, employee'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.acceptInviteValidation = [
    (0, express_validator_1.body)('token').isString().isLength({ min: 10 }).withMessage('A valid invite token is required'),
    strongPasswordValidation('password'),
];
exports.tokenOnlyValidation = [(0, express_validator_1.body)('token').isString().isLength({ min: 10 }).withMessage('A valid token is required')];
exports.emailOnlyValidation = [
    (0, express_validator_1.body)('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];
exports.resetPasswordValidation = [
    (0, express_validator_1.body)('token').isString().isLength({ min: 10 }).withMessage('A valid reset token is required'),
    strongPasswordValidation('password'),
];
