import { api } from '../../lib/api';
import { ApiResponse, Company, Role, User } from '../../types';

export interface RegisterCompanyPayload {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface InviteUserPayload {
  name: string;
  email: string;
  role: Role;
}

export async function registerCompany(payload: RegisterCompanyPayload) {
  const { data } = await api.post<ApiResponse<{ user: User; company: Company }>>('/auth/register', payload);
  return { user: data.data.user, company: data.data.company, message: data.message };
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', payload);
  return data.data;
}

export async function getMe() {
  const { data } = await api.get<ApiResponse<{ user: User; company: Company | null }>>('/auth/me');
  return data.data;
}

export async function inviteUser(payload: InviteUserPayload) {
  const { data } = await api.post<ApiResponse<{ user: User }>>('/auth/invite', payload);
  return { user: data.data.user, message: data.message };
}

export async function inspectToken(token: string) {
  const { data } = await api.get<ApiResponse<{ name: string; email: string }>>(`/auth/token/${token}`);
  return data.data;
}

export async function acceptInvite(payload: { token: string; password: string }) {
  const { data } = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/accept-invite', payload);
  return data.data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/verify-email', { token });
  return data.data;
}

export async function resendVerification(email: string) {
  const { data } = await api.post<ApiResponse<null>>('/auth/resend-verification', { email });
  return data.message;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
  return data.message;
}

export async function resetPassword(payload: { token: string; password: string }) {
  const { data } = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/reset-password', payload);
  return data.data;
}
