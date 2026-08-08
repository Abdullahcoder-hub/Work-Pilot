import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Building, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useTeam } from '../team/useTeam';
import { useDepartments, useDeleteDepartment } from './useDepartments';
import { DepartmentFormModal } from './DepartmentFormModal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Department } from '../../types';

function headName(head: Department['headUserId']): string | null {
  if (!head) return null;
  return typeof head === 'object' ? head.name : null;
}

export function DepartmentsPage() {
  const { hasRole } = useAuth();
  const { data: departments, isLoading } = useDepartments();
  const { data: members } = useTeam();
  const deleteDept = useDeleteDepartment();
  const canManage = hasRole('company_admin');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(dept: Department) {
    setEditing(dept);
    setModalOpen(true);
  }

  async function handleDelete(dept: Department) {
    if (!window.confirm(`Delete "${dept.name}"? This can't be undone.`)) return;
    try {
      await deleteDept.mutateAsync(dept._id);
      toast.success('Department deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Departments</h1>
          <p className="mt-0.5 text-sm text-slate-500">How your company is organized.</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New department
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !departments || departments.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No departments yet"
          description={canManage ? 'Create your first department to start organizing projects.' : 'Ask a company admin to set up departments.'}
          action={
            canManage ? (
              <button className="btn-primary" onClick={openCreate}>
                <Plus size={16} /> New department
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div key={dept._id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Building size={18} />
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(dept)} aria-label="Edit department" className="rounded p-1 text-slate-400 hover:bg-surface-subtle hover:text-slate-600">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(dept)} aria-label="Delete department" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-800">{dept.name}</h3>
              {dept.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{dept.description}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{headName(dept.headUserId) ? `Head: ${headName(dept.headUserId)}` : 'No head assigned'}</span>
                <span>{dept.projectCount ?? 0} projects</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <DepartmentFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} department={editing} members={members ?? []} />
    </div>
  );
}
