import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Compass, MailCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { PasswordStrengthHint } from './PasswordStrengthHint';
import * as authApi from './authApi';

export function RegisterPage() {
  const { registerCompany } = useAuth();
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { email } = await registerCompany(form);
      // Deliberately no redirect into the app here — the account exists but
      // can't sign in until this email is verified, even for the admin who
      // just created the workspace.
      setRegisteredEmail(email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!registeredEmail) return;
    setIsResending(true);
    try {
      await authApi.resendVerification(registeredEmail);
      toast.success('Verification email sent again');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend the email');
    } finally {
      setIsResending(false);
    }
  }

  if (registeredEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Compass size={22} />
            </div>
          </div>

          <div className="card space-y-3 p-6">
            <MailCheck className="mx-auto text-brand-500" size={28} />
            <h1 className="text-base font-semibold text-slate-900">Check your email</h1>
            <p className="text-sm text-slate-500">
              We've sent a verification link to <span className="font-medium text-slate-700">{registeredEmail}</span>.
              Your workspace is created, but you — including as company admin — need to verify your email before you
              can sign in.
            </p>
            <button onClick={handleResend} disabled={isResending} className="btn-secondary w-full">
              {isResending ? <Spinner className="h-4 w-4" /> : "Didn't get it? Resend link"}
            </button>
            <Link to="/login" className="block text-sm font-medium text-brand-600 hover:text-brand-700">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Compass size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Create your workspace</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            You'll be set up as the Company Admin — invite your team afterward.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label htmlFor="companyName" className="label">
              Company name
            </label>
            <input
              id="companyName"
              required
              className="input"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label htmlFor="name" className="label">
              Your full name
            </label>
            <input
              id="name"
              required
              className="input"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
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
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="input"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="8+ chars, upper, lower, number, special"
            />
            <p className="mt-1 text-xs text-slate-500">Use at least 8 characters with uppercase, lowercase, a number, and a special character.</p>
            <PasswordStrengthHint password={form.password} />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Create workspace'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
