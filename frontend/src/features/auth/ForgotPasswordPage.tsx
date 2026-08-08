import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Compass, MailCheck } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import * as authApi from './authApi';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
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
          <h1 className="text-lg font-semibold text-slate-900">Forgot your password?</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Enter your work email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="card space-y-3 p-6 text-center">
            <MailCheck className="mx-auto text-brand-500" size={28} />
            <p className="text-sm text-slate-600">
              If an account exists for <span className="font-medium text-slate-800">{email}</span>, a reset link is
              on its way. Check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <div>
              <label htmlFor="email" className="label">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
