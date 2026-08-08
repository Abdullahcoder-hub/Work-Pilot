import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { LeaveType } from '../../types';
import { useCreateLeaveRequest } from './useLeave';

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'casual', label: 'Casual' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'other', label: 'Other' },
];

export function LeaveRequestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createLeave = useCreateLeaveRequest();
  const [form, setForm] = useState({
    leaveType: 'annual' as LeaveType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.endDate < form.startDate) {
      toast.error('End date must be on or after the start date');
      return;
    }
    try {
      await createLeave.mutateAsync(form);
      toast.success('Leave request submitted');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request leave">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="leave-type">
            Leave type
          </label>
          <select
            id="leave-type"
            className="input"
            value={form.leaveType}
            onChange={(e) => setForm((p) => ({ ...p, leaveType: e.target.value as LeaveType }))}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="leave-start">
              Start date
            </label>
            <input
              id="leave-start"
              type="date"
              required
              className="input"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="leave-end">
              End date
            </label>
            <input
              id="leave-end"
              type="date"
              required
              className="input"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="leave-reason">
            Reason (optional)
          </label>
          <textarea
            id="leave-reason"
            rows={3}
            maxLength={500}
            className="input"
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          />
        </div>

        <button type="submit" disabled={createLeave.isPending} className="btn-primary w-full">
          {createLeave.isPending ? <Spinner className="h-4 w-4 text-white" /> : 'Submit request'}
        </button>
      </form>
    </Modal>
  );
}
