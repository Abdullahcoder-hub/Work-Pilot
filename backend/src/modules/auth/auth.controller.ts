import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as authService from './auth.service';

export const registerCompany = asyncHandler(async (req: Request, res: Response) => {
  const { companyName, name, email, password } = req.body;
  const { user, company } = await authService.registerCompany({ companyName, name, email, password });
  res.status(201).json({
    success: true,
    data: { user, company },
    message: `We've sent a verification link to ${user.email}. Verify your email to sign in — even as the company admin.`,
  });
});

export const invite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  const { name, email, role } = req.body;
  const { user } = await authService.inviteUser({
    inviterRole: req.user.role,
    companyId: req.user.companyId,
    name,
    email,
    role,
  });
  res.status(201).json({
    success: true,
    data: { user },
    message: `Invite sent to ${email}. They'll verify their email and set their own password.`,
  });
});

export const inspectToken = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.inspectToken(req.params.token);
  res.status(200).json({ success: true, data });
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const { token: authToken, user } = await authService.acceptInvite({ token, password });
  res.status(200).json({ success: true, data: { token: authToken, user } });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const { token: authToken, user } = await authService.verifyEmail(token);
  res.status(200).json({ success: true, data: { token: authToken, user }, message: 'Email verified' });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await authService.resendVerificationEmail(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If an account with that email exists and is unverified, a new verification link has been sent.',
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const { token: authToken, user } = await authService.resetPassword({ token, password });
  res.status(200).json({ success: true, data: { token: authToken, user }, message: 'Password updated' });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { token, user } = await authService.login({ email, password });
  res.status(200).json({ success: true, data: { token, user } });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWT — the client discards the token. A denylist/refresh-token
  // model is a candidate for a later hardening pass if session revocation
  // before expiry becomes a requirement.
  res.status(200).json({ success: true, message: 'Logged out' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { user, company } = await authService.getMe(req.user.userId);
  res.status(200).json({ success: true, data: { user, company } });
});
