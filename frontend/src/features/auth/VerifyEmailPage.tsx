import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Compass, CheckCircle2, XCircle } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from './AuthContext';
import * as authApi from './authApi';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { setSession } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('This link is missing a verification token.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(async (result) => {
        // Verifying proves ownership of the email, so we sign the person
        // straight in rather than sending them back to a login form —
        // same pattern as accept-invite and reset-password.
        await setSession(result.token, result.user);
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'This verification link is invalid or has expired.');
      });
  }, [token, setSession]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Compass size={22} />
          </div>
        </div>

        <div className="card space-y-3 p-6">
          {status === 'loading' && (
            <>
              <Spinner className="mx-auto" />
              <p className="text-sm text-slate-500">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="mx-auto text-emerald-500" size={28} />
              <p className="text-sm text-slate-700">Your email is verified — you're signed in.</p>
              <Link to="/dashboard" className="btn-primary mt-2 inline-flex">
                Go to dashboard
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="mx-auto text-rose-500" size={28} />
              <p className="text-sm text-slate-600">{errorMessage}</p>
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
