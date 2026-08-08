import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Role } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { useInviteUser } from './useTeam';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'employee', label: 'Employee' },
];

export function InviteMemberModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { hasRole } = useAuth();
  const invite = useInviteUser();
  const [form, setForm] = useState<{ name: string; email: string; role: Role }>({
    name: '',
    email: '',
    role: 'employee',
  });
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  // Team leads may only invite employees.
  const availableRoles = hasRole('company_admin') ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === 'employee');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const result = await invite.mutateAsync(form);
      setInvitedEmail(result.user.email);
      toast.success(`Invite sent to ${result.user.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite user');
    }
  }

  function handleClose() {
    setForm({ name: '', email: '', role: 'employee' });
    setInvitedEmail(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite team member">
      {invitedEmail ? (
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto text-brand-500" size={28} />
          <p className="text-sm text-slate-600">
            We emailed <span className="font-medium text-slate-800">{invitedEmail}</span> a link to verify their
            address and set their own password. They'll show up here as soon as they finish setting up.
          </p>
          <button className="btn-secondary w-full" onClick={handleClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="invite-name">
              Full name
            </label>
            <input
              id="invite-name"
              required
              autoFocus
              autoComplete="name"
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="invite-email">
              Work email
            </label>
            <input
              id="invite-email"
              type="email"
              autoComplete="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              className="input"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={invite.isPending} className="btn-primary w-full">
            {invite.isPending ? <Spinner className="h-4 w-4 text-white" /> : 'Send invite'}
          </button>
        </form>
      )}
    </Modal>
  );
}
