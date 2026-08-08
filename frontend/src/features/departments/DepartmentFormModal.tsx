import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Department, User } from '../../types';
import { useCreateDepartment, useUpdateDepartment } from './useDepartments';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department | null;
  members: User[];
}

export function DepartmentFormModal({ isOpen, onClose, department, members }: DepartmentFormModalProps) {
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const isEditing = !!department;

  const [form, setForm] = useState({ name: '', description: '', headUserId: '' });

  useEffect(() => {
    if (department) {
      setForm({
        name: department.name,
        description: department.description,
        headUserId: typeof department.headUserId === 'object' ? department.headUserId?._id ?? '' : department.headUserId ?? '',
      });
    } else {
      setForm({ name: '', description: '', headUserId: '' });
    }
  }, [department, isOpen]);

  const isSubmitting = createDept.isPending || updateDept.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = { name: form.name, description: form.description, headUserId: form.headUserId || null };
      if (isEditing && department) {
        await updateDept.mutateAsync({ id: department._id, input: payload });
        toast.success('Department updated');
      } else {
        await createDept.mutateAsync(payload);
        toast.success('Department created');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit department' : 'New department'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="dept-name">
            Name
          </label>
          <input
            id="dept-name"
            required
            maxLength={120}
            className="input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="dept-description">
            Description
          </label>
          <textarea
            id="dept-description"
            rows={3}
            maxLength={1000}
            className="input"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="dept-head">
            Department head
          </label>
          <select
            id="dept-head"
            className="input"
            value={form.headUserId}
            onChange={(e) => setForm((p) => ({ ...p, headUserId: e.target.value }))}
          >
            <option value="">No head assigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : isEditing ? 'Save changes' : 'Create department'}
        </button>
      </form>
    </Modal>
  );
}
