import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { AttendanceStatus } from '../../types';
import { useTeam } from '../team/useTeam';
import { useManualAttendanceEntry } from './useAttendance';

const STATUSES: AttendanceStatus[] = ['present', 'late', 'half_day', 'absent'];

export function ManualAttendanceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: members } = useTeam();
  const manualEntry = useManualAttendanceEntry();

  const [form, setForm] = useState({
    userId: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'present' as AttendanceStatus,
    notes: '',
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.userId) {
      toast.error('Pick a team member');
      return;
    }
    try {
      await manualEntry.mutateAsync(form);
      toast.success('Attendance recorded');
      onClose();
      setForm((p) => ({ ...p, userId: '', notes: '' }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log attendance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="entry-member">
            Team member
          </label>
          <select
            id="entry-member"
            required
            className="input"
            value={form.userId}
            onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
          >
            <option value="">Select someone</option>
            {(members ?? []).map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="entry-date">
              Date
            </label>
            <input
              id="entry-date"
              type="date"
              required
              className="input"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="entry-status">
              Status
            </label>
            <select
              id="entry-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AttendanceStatus }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="entry-notes">
            Notes (optional)
          </label>
          <input
            id="entry-notes"
            className="input"
            placeholder="e.g. approved WFH, doctor's note on file"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

        <button type="submit" disabled={manualEntry.isPending} className="btn-primary w-full">
          {manualEntry.isPending ? <Spinner className="h-4 w-4 text-white" /> : 'Save entry'}
        </button>
      </form>
    </Modal>
  );
}
