import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Compass } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from './AuthContext';
import * as authApi from './authApi';
import { PasswordStrengthHint } from './PasswordStrengthHint';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [lookup, setLookup] = useState<{ name: string; email: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLookupError('This invite link is missing a token.');
      return;
    }
    authApi
      .inspectToken(token)
      .then(setLookup)
      .catch((err) => setLookupError(err instanceof Error ? err.message : 'This invite link is invalid or has expired.'));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await authApi.acceptInvite({ token, password });
      await setSession(result.token, result.user);
      toast.success('Welcome to WorkPilot!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'This invite link is invalid or has expired');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Compass size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Set up your account</h1>
          {lookup && <p className="mt-1 text-center text-sm text-slate-500">{lookup.email}</p>}
        </div>

        {lookupError ? (
          <div className="card space-y-3 p-6 text-center">
            <p className="text-sm text-slate-600">{lookupError}</p>
            <p className="text-sm text-slate-500">
              Ask whoever invited you to send a fresh invite, or{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                sign in
              </Link>{' '}
              if you already have a password.
            </p>
          </div>
        ) : !lookup ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <p className="text-sm text-slate-600">
              Hi <span className="font-medium text-slate-800">{lookup.name}</span> — choose a password to finish
              setting up your account. This also verifies your email.
            </p>
            <div>
              <label htmlFor="password" className="label">
                Password
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
              {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Create my account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
