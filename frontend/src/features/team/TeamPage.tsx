import { useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Users, ShieldOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTeam, useSetUserActive } from './useTeam';
import { InviteMemberModal } from './InviteMemberModal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

const ROLE_LABEL: Record<string, string> = {
  company_admin: 'Company Admin',
  team_lead: 'Team Lead',
  employee: 'Employee',
  super_admin: 'Super Admin',
};

export function TeamPage() {
  const { user, hasRole } = useAuth();
  const { data: members, isLoading } = useTeam();
  const setActive = useSetUserActive();
  const [inviteOpen, setInviteOpen] = useState(false);

  const canManage = hasRole('company_admin', 'team_lead');

  async function toggleActive(memberId: string, next: boolean) {
    try {
      await setActive.mutateAsync({ userId: memberId, isActive: next });
      toast.success(next ? 'Member reactivated' : 'Member deactivated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Team</h1>
          <p className="mt-0.5 text-sm text-slate-500">Everyone in your company workspace.</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} /> Invite member
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !members || members.length === 0 ? (
        <EmptyState icon={Users} title="No team members yet" description="Invite your first teammate to get started." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member._id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{member.name}</div>
                    <div className="text-xs text-slate-500">{member.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ROLE_LABEL[member.role]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {member.isActive ? 'Active' : 'Deactivated'}
                    </span>
                    {!member.isEmailVerified && (
                      <span className="badge ml-1.5 bg-amber-50 text-amber-700">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : '—'}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {member._id !== user?._id && (
                        <button
                          className="btn-ghost !px-2 !py-1 text-xs"
                          onClick={() => toggleActive(member._id, !member.isActive)}
                        >
                          {member.isActive ? (
                            <>
                              <ShieldOff size={14} /> Deactivate
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} /> Reactivate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteMemberModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
