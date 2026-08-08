"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompany = registerCompany;
exports.inviteUser = inviteUser;
exports.login = login;
exports.getMe = getMe;
exports.acceptInvite = acceptInvite;
exports.inspectToken = inspectToken;
exports.verifyEmail = verifyEmail;
exports.resendVerificationEmail = resendVerificationEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const company_model_1 = require("../company/company.model");
const user_model_1 = require("../user/user.model");
const ApiError_1 = require("../../utils/ApiError");
const generateToken_1 = require("../../utils/generateToken");
const token_1 = require("../../utils/token");
const email_1 = require("../../utils/email");
const env_1 = require("../../config/env");
const crypto_1 = __importDefault(require("crypto"));
const auth_validation_1 = require("./auth.validation");
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h — verification/invite links
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h — password reset links
async function generateUniqueSlug(name) {
    const base = (0, company_model_1.slugify)(name) || 'company';
    let slug = base;
    let attempt = 1;
    // Small, bounded loop — collisions on a random-ish base are rare.
    while (await company_model_1.Company.exists({ slug })) {
        attempt += 1;
        slug = `${base}-${attempt}`;
    }
    return slug;
}
async function registerCompany(input) {
    if (!(0, auth_validation_1.hasStrongPassword)(input.password)) {
        throw ApiError_1.ApiError.badRequest('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
    const existing = await user_model_1.User.findOne({ email: input.email });
    if (existing) {
        throw ApiError_1.ApiError.conflict('An account with this email already exists');
    }
    const slug = await generateUniqueSlug(input.companyName);
    const company = await company_model_1.Company.create({ name: input.companyName, slug });
    const { raw, hashed } = (0, token_1.generateRawToken)();
    const user = await user_model_1.User.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: 'company_admin',
        companyId: company._id,
        isEmailVerified: false,
        emailVerificationToken: hashed,
        emailVerificationExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });
    const token = (0, generateToken_1.generateToken)({
        userId: user._id.toString(),
        role: user.role,
        companyId: company._id.toString(),
    });
    const verifyLink = `${env_1.env.appUrl}/verify-email?token=${raw}`;
    void (0, email_1.sendVerificationEmail)(user.email, user.name, verifyLink);
    return { token, user, company };
}
const INVITE_PERMISSIONS = {
    super_admin: [],
    company_admin: ['company_admin', 'team_lead', 'employee'],
    team_lead: ['employee'],
    employee: [],
};
async function inviteUser(input) {
    const allowedTargetRoles = INVITE_PERMISSIONS[input.inviterRole];
    if (!allowedTargetRoles.includes(input.role)) {
        throw ApiError_1.ApiError.forbidden(`A ${input.inviterRole.replace('_', ' ')} cannot invite a ${input.role.replace('_', ' ')}`);
    }
    const existing = await user_model_1.User.findOne({ email: input.email });
    if (existing) {
        throw ApiError_1.ApiError.conflict('An account with this email already exists');
    }
    const company = await company_model_1.Company.findById(input.companyId);
    if (!company) {
        throw ApiError_1.ApiError.notFound('Company not found');
    }
    const seatCount = await user_model_1.User.countDocuments({ companyId: input.companyId });
    if (seatCount >= company.seatLimit) {
        throw ApiError_1.ApiError.forbidden(`Seat limit reached (${company.seatLimit}). Upgrade the plan to invite more users.`);
    }
    // The account is created with an unusable random password — the invited
    // person sets their own via the emailed link (accept-invite), which also
    // verifies their email in the same step.
    const placeholderPassword = crypto_1.default.randomBytes(24).toString('base64url');
    const { raw, hashed } = (0, token_1.generateRawToken)();
    const user = await user_model_1.User.create({
        name: input.name,
        email: input.email,
        password: placeholderPassword,
        role: input.role,
        companyId: input.companyId,
        isEmailVerified: false,
        emailVerificationToken: hashed,
        emailVerificationExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });
    const inviteLink = `${env_1.env.appUrl}/accept-invite?token=${raw}`;
    void (0, email_1.sendInviteEmail)(user.email, user.name, company.name, inviteLink);
    return { user };
}
async function login(input) {
    const user = await user_model_1.User.findOne({ email: input.email }).select('+password');
    if (!user) {
        throw ApiError_1.ApiError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) {
        throw ApiError_1.ApiError.forbidden('This account has been deactivated. Contact your administrator.');
    }
    const company = user.companyId ? await company_model_1.Company.findById(user.companyId) : null;
    if (company && company.status === 'suspended') {
        throw ApiError_1.ApiError.forbidden('Your company workspace has been suspended. Contact support.');
    }
    const valid = await user.comparePassword(input.password);
    if (!valid) {
        throw ApiError_1.ApiError.unauthorized('Invalid email or password');
    }
    user.lastLoginAt = new Date();
    await user.save();
    const token = (0, generateToken_1.generateToken)({
        userId: user._id.toString(),
        role: user.role,
        companyId: user.companyId ? user.companyId.toString() : null,
    });
    return { token, user };
}
async function getMe(userId) {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw ApiError_1.ApiError.notFound('User not found');
    }
    const company = user.companyId ? await company_model_1.Company.findById(user.companyId) : null;
    return { user, company };
}
/**
 * Completes an invited user's onboarding: verifies the token from their
 * invite email, sets the password they choose, marks the email verified,
 * and logs them straight in.
 */
async function acceptInvite(input) {
    if (!(0, auth_validation_1.hasStrongPassword)(input.password)) {
        throw ApiError_1.ApiError.badRequest('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
    const hashed = (0, token_1.hashToken)(input.token);
    const user = await user_model_1.User.findOne({
        emailVerificationToken: hashed,
        emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) {
        throw ApiError_1.ApiError.badRequest('This invite link is invalid or has expired. Ask an admin to resend it.');
    }
    user.password = input.password;
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.isActive = true;
    user.lastLoginAt = new Date();
    await user.save();
    const token = (0, generateToken_1.generateToken)({
        userId: user._id.toString(),
        role: user.role,
        companyId: user.companyId ? user.companyId.toString() : null,
    });
    return { token, user };
}
/** Looks up the name/email behind an invite or verification token, so the
 * frontend can show "Setting up account for jane@acme.com" before the
 * person has typed anything. */
async function inspectToken(token) {
    const hashed = (0, token_1.hashToken)(token);
    const user = await user_model_1.User.findOne({
        emailVerificationToken: hashed,
        emailVerificationExpires: { $gt: new Date() },
    }).select('name email');
    if (!user) {
        throw ApiError_1.ApiError.badRequest('This link is invalid or has expired.');
    }
    return { name: user.name, email: user.email };
}
async function verifyEmail(token) {
    const hashed = (0, token_1.hashToken)(token);
    const user = await user_model_1.User.findOne({
        emailVerificationToken: hashed,
        emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) {
        throw ApiError_1.ApiError.badRequest('This verification link is invalid or has expired.');
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    return { user };
}
async function resendVerificationEmail(email) {
    const user = await user_model_1.User.findOne({ email });
    // Deliberately silent on "not found" / "already verified" to avoid
    // leaking which emails have accounts — the controller always returns a
    // generic success message.
    if (!user || user.isEmailVerified)
        return;
    const { raw, hashed } = (0, token_1.generateRawToken)();
    user.emailVerificationToken = hashed;
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();
    const verifyLink = `${env_1.env.appUrl}/verify-email?token=${raw}`;
    void (0, email_1.sendVerificationEmail)(user.email, user.name, verifyLink);
}
async function forgotPassword(email) {
    const user = await user_model_1.User.findOne({ email });
    // Same "always succeed silently" reasoning as resendVerificationEmail.
    if (!user)
        return;
    const { raw, hashed } = (0, token_1.generateRawToken)();
    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();
    const resetLink = `${env_1.env.appUrl}/reset-password?token=${raw}`;
    void (0, email_1.sendPasswordResetEmail)(user.email, user.name, resetLink);
}
async function resetPassword(input) {
    if (!(0, auth_validation_1.hasStrongPassword)(input.password)) {
        throw ApiError_1.ApiError.badRequest('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
    const hashed = (0, token_1.hashToken)(input.token);
    const user = await user_model_1.User.findOne({
        passwordResetToken: hashed,
        passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');
    if (!user) {
        throw ApiError_1.ApiError.badRequest('This password reset link is invalid or has expired.');
    }
    user.password = input.password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    const token = (0, generateToken_1.generateToken)({
        userId: user._id.toString(),
        role: user.role,
        companyId: user.companyId ? user.companyId.toString() : null,
    });
    return { token, user };
}
