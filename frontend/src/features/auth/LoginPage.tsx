import { FormEvent, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Compass } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { tokenStore } from '../../lib/api';
import * as authApi from './authApi';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setUnverifiedEmail(null);
    try {
      const user = await login(email, password);
      const fallback = user.role === 'super_admin' ? '/platform' : '/dashboard';
      navigate(from || fallback, { replace: true });
    } catch (err) {
      tokenStore.clear();
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
      if (message.toLowerCase().includes('verify your email')) {
        setUnverifiedEmail(email);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      await authApi.resendVerification(unverifiedEmail);
      toast.success('Verification email sent again');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend the email');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Compass size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Sign in to WorkPilot</h1>
          <p className="mt-1 text-sm text-slate-500">Your team's work, in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label htmlFor="email" className="label">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="label">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Sign in'}
          </button>

          {unverifiedEmail && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <p>Your email isn't verified yet.</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="mt-1 font-medium underline underline-offset-2 disabled:opacity-60"
              >
                {isResending ? 'Sending…' : 'Resend verification link'}
              </button>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New to WorkPilot?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create your company workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
