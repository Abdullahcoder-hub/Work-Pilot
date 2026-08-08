import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { User as UserIcon, Lock, Building2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { useMyCompanySettings, useUpdateMyCompany, useUpdateProfile, useChangePassword } from './useSettings';
import { Spinner } from '../../components/ui/Spinner';

const ROLE_LABEL: Record<string, string> = {
  company_admin: 'Company Admin',
  team_lead: 'Team Lead',
  employee: 'Employee',
  super_admin: 'Super Admin',
};

function ProfileTab() {
  const { user, updateUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState(user?.name ?? '');
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateProfile.mutateAsync(name);
      updateUser({ name: updated.name });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update profile');
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: passwordForm.current, newPassword: passwordForm.next });
      toast.success('Password changed');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change password');
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveName} className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Profile</h2>
        <div>
          <label className="label" htmlFor="settings-name">
            Full name
          </label>
          <input id="settings-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
        </div>
        <div>
          <span className="label">Email</span>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
        <div>
          <span className="label">Role</span>
          <p className="text-sm text-slate-500">{user ? ROLE_LABEL[user.role] : ''}</p>
        </div>
        <button type="submit" disabled={updateProfile.isPending || name === user?.name} className="btn-primary">
          {updateProfile.isPending ? <Spinner className="h-4 w-4 text-white" /> : 'Save changes'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Change password</h2>
        <div>
          <label className="label" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            className="input"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              minLength={8}
              className="input"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              minLength={8}
              className="input"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
              required
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">Use at least 8 characters with uppercase, lowercase, a number, and a special character.</p>
        <button type="submit" disabled={changePassword.isPending} className="btn-secondary">
          {changePassword.isPending ? <Spinner className="h-4 w-4" /> : <><Lock size={14} /> Change password</>}
        </button>
      </form>
    </div>
  );
}

function CompanyTab() {
  const { updateCompany } = useAuth();
  const { data: company, isLoading } = useMyCompanySettings();
  const updateMyCompany = useUpdateMyCompany();
  const [name, setName] = useState('');

  if (isLoading || !company) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const currentName = name || company.name;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateMyCompany.mutateAsync(currentName);
      updateCompany({ name: updated.name });
      toast.success('Company updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update company');
    }
  }

  const seatPercent = Math.min(100, Math.round((company.seatsUsed / company.seatLimit) * 100));

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Company</h2>
        <div>
          <label className="label" htmlFor="company-name">
            Company name
          </label>
          <input id="company-name" className="input" value={currentName} onChange={(e) => setName(e.target.value)} maxLength={120} required />
        </div>
        <button type="submit" disabled={updateMyCompany.isPending || currentName === company.name} className="btn-primary">
          {updateMyCompany.isPending ? <Spinner className="h-4 w-4 text-white" /> : 'Save changes'}
        </button>
      </form>

      <div className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Plan &amp; usage</h2>
        <div className="flex items-center gap-3">
          <span className="badge bg-brand-50 capitalize text-brand-700">{company.plan}</span>
          <span className={clsx('badge', company.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
            {company.status}
          </span>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>Seats used</span>
            <span>
              {company.seatsUsed} / {company.seatLimit}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
            <div className={clsx('h-full rounded-full', seatPercent >= 100 ? 'bg-rose-500' : 'bg-brand-500')} style={{ width: `${seatPercent}%` }} />
          </div>
        </div>
        <p className="text-xs text-slate-400">To change your plan or seat limit, contact your platform administrator.</p>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { hasRole } = useAuth();
  const isCompanyAdmin = hasRole('company_admin');
  const [tab, setTab] = useState<'profile' | 'company'>('profile');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Manage your account and company preferences.</p>
      </div>

      {isCompanyAdmin && (
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => setTab('profile')}
            className={clsx('btn-secondary !py-1.5 text-xs', tab === 'profile' && '!border-brand-400 !bg-brand-50 !text-brand-700')}
          >
            <UserIcon size={13} /> Profile
          </button>
          <button
            onClick={() => setTab('company')}
            className={clsx('btn-secondary !py-1.5 text-xs', tab === 'company' && '!border-brand-400 !bg-brand-50 !text-brand-700')}
          >
            <Building2 size={13} /> Company
          </button>
        </div>
      )}

      <div className="max-w-lg">{tab === 'profile' ? <ProfileTab /> : <CompanyTab />}</div>
    </div>
  );
}
