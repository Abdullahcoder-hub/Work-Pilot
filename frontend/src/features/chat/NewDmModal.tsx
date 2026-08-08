import { useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useTeam } from '../team/useTeam';
import { useAuth } from '../auth/AuthContext';

interface NewDmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (userId: string) => void;
}

const ROLE_LABEL: Record<string, string> = {
  company_admin: 'Company Admin',
  team_lead: 'Team Lead',
  employee: 'Employee',
};

export function NewDmModal({ isOpen, onClose, onPick }: NewDmModalProps) {
  const { user } = useAuth();
  const { data: members, isLoading } = useTeam();
  const [search, setSearch] = useState('');

  const candidates = (members ?? [])
    .filter((m) => m._id !== user?._id)
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));

  function handlePick(userId: string) {
    onPick(userId);
    setSearch('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New message">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            className="input pl-8"
            placeholder="Search teammates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-72 space-y-0.5 overflow-y-auto">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading team…</p>
          ) : candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No one matches "{search}"</p>
          ) : (
            candidates.map((m) => (
              <button
                key={m._id}
                onClick={() => handlePick(m._id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-surface-subtle"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{m.name}</div>
                  <div className="truncate text-xs text-slate-500">{ROLE_LABEL[m.role] ?? m.role}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
