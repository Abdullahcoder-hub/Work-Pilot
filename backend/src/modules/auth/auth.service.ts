import { Company, slugify } from '../company/company.model';
import { User, Role } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';
import { generateToken } from '../../utils/generateToken';
import { generateRawToken, hashToken } from '../../utils/token';
import { sendVerificationEmail, sendInviteEmail, sendPasswordResetEmail } from '../../utils/email';
import { env } from '../../config/env';
import crypto from 'crypto';
import { hasStrongPassword } from './auth.validation';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h — verification/invite links
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h — password reset links

interface RegisterCompanyInput {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'company';
  let slug = base;
  let attempt = 1;
  // Small, bounded loop — collisions on a random-ish base are rare.
  while (await Company.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

export async function registerCompany(input: RegisterCompanyInput) {
  if (!hasStrongPassword(input.password)) {
    throw ApiError.badRequest('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const slug = await generateUniqueSlug(input.companyName);
  const company = await Company.create({ name: input.companyName, slug });

  const { raw, hashed } = generateRawToken();

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: 'company_admin' as Role,
    companyId: company._id,
    isEmailVerified: false,
    emailVerificationToken: hashed,
    emailVerificationExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
  });

  const verifyLink = `${env.appUrl}/verify-email?token=${raw}`;
  void sendVerificationEmail(user.email, user.name, verifyLink);

  // Deliberately no login token here: the account exists, but it isn't
  // usable until the person proves they own this email address by
  // clicking the verification link. See login() for the enforcement side.
  return { user, company };
}

interface InviteUserInput {
  inviterRole: Role;
  companyId: string;
  name: string;
  email: string;
  role: Role;
}

const INVITE_PERMISSIONS: Record<Role, Role[]> = {
  super_admin: [],
  company_admin: ['company_admin', 'team_lead', 'employee'],
  team_lead: ['employee'],
  employee: [],
};

export async function inviteUser(input: InviteUserInput) {
  const allowedTargetRoles = INVITE_PERMISSIONS[input.inviterRole];
  if (!allowedTargetRoles.includes(input.role)) {
    throw ApiError.forbidden(`A ${input.inviterRole.replace('_', ' ')} cannot invite a ${input.role.replace('_', ' ')}`);
  }

  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const company = await Company.findById(input.companyId);
  if (!company) {
    throw ApiError.notFound('Company not found');
  }

  const seatCount = await User.countDocuments({ companyId: input.companyId });
  if (seatCount >= company.seatLimit) {
    throw ApiError.forbidden(`Seat limit reached (${company.seatLimit}). Upgrade the plan to invite more users.`);
  }

  // The account is created with an unusable random password — the invited
  // person sets their own via the emailed link (accept-invite), which also
  // verifies their email in the same step.
  const placeholderPassword = crypto.randomBytes(24).toString('base64url');
  const { raw, hashed } = generateRawToken();

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: placeholderPassword,
    role: input.role,
    companyId: input.companyId,
    isEmailVerified: false,
    emailVerificationToken: hashed,
    emailVerificationExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
  });

  const inviteLink = `${env.appUrl}/accept-invite?token=${raw}`;
  void sendInviteEmail(user.email, user.name, company.name, inviteLink);

  return { user };
}

interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');
  }

  const company = user.companyId ? await Company.findById(user.companyId) : null;
  if (company && company.status === 'suspended') {
    throw ApiError.forbidden('Your company workspace has been suspended. Contact support.');
  }

  if (!user.isEmailVerified && user.role !== 'super_admin') {
    throw ApiError.forbidden('Please verify your email before signing in. Check your inbox for the verification link.');
  }

  const valid = await user.comparePassword(input.password);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    companyId: user.companyId ? user.companyId.toString() : null,
  });

  return { token, user };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  const company = user.companyId ? await Company.findById(user.companyId) : null;
  return { user, company };
}

/**
 * Completes an invited user's onboarding: verifies the token from their
 * invite email, sets the password they choose, marks the email verified,
 * and logs them straight in.
 */
export async function acceptInvite(input: { token: string; password: string }) {
  if (!hasStrongPassword(input.password)) {
    throw ApiError.badRequest('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  const hashed = hashToken(input.token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw ApiError.badRequest('This invite link is invalid or has expired. Ask an admin to resend it.');
  }

  user.password = input.password;
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  user.isActive = true;
  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    companyId: user.companyId ? user.companyId.toString() : null,
  });

  return { token, user };
}

/** Looks up the name/email behind an invite or verification token, so the
 * frontend can show "Setting up account for jane@acme.com" before the
 * person has typed anything. */
export async function inspectToken(token: string) {
  const hashed = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('name email');
  if (!user) {
    throw ApiError.badRequest('This link is invalid or has expired.');
  }
  return { name: user.name, email: user.email };
}

export async function verifyEmail(token: string) {
  const hashed = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw ApiError.badRequest('This verification link is invalid or has expired.');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  const authToken = generateToken({
    userId: user._id.toString(),
    role: user.role,
    companyId: user.companyId ? user.companyId.toString() : null,
  });

  return { token: authToken, user };
}

export async function resendVerificationEmail(email: string) {
  const user = await User.findOne({ email });
  // Deliberately silent on "not found" / "already verified" to avoid
  // leaking which emails have accounts — the controller always returns a
  // generic success message.
  if (!user || user.isEmailVerified) return;

  const { raw, hashed } = generateRawToken();
  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await user.save();

  const verifyLink = `${env.appUrl}/verify-email?token=${raw}`;
  void sendVerificationEmail(user.email, user.name, verifyLink);
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email });
  // Same "always succeed silently" reasoning as resendVerificationEmail.
  if (!user) return;

  const { raw, hashed } = generateRawToken();
  user.passwordResetToken = hashed;
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const resetLink = `${env.appUrl}/reset-password?token=${raw}`;
  void sendPasswordResetEmail(user.email, user.name, resetLink);
}

export async function resetPassword(input: { token: string; password: string }) {
  if (!hasStrongPassword(input.password)) {
    throw ApiError.badRequest('Password must include at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  const hashed = hashToken(input.token);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest('This password reset link is invalid or has expired.');
  }

  user.password = input.password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    companyId: user.companyId ? user.companyId.toString() : null,
  });

  return { token, user };
}
