import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Compass } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from './AuthContext';
import * as authApi from './authApi';
import { PasswordStrengthHint } from './PasswordStrengthHint';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await authApi.resetPassword({ token, password });
      await setSession(result.token, result.user);
      toast.success('Password updated — you are now signed in');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset link is invalid or has expired');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
        <div className="card w-full max-w-sm p-6 text-center">
          <p className="text-sm text-slate-600">
            This link is missing a reset token. Please use the link from your email, or{' '}
            <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
              request a new one
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Compass size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Set a new password</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label htmlFor="password" className="label">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars, upper, lower, number, special"
            />
            <p className="mt-1 text-xs text-slate-500">Use at least 8 characters with uppercase, lowercase, a number, and a special character.</p>
            <PasswordStrengthHint password={password} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
