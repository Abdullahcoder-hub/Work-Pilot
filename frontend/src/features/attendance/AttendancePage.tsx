import { useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, LogIn, LogOut, CalendarClock, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { useTodayAttendance, useAttendanceList, useAttendanceSummary, useClockIn, useClockOut, useDeleteAttendance } from './useAttendance';
import { ManualAttendanceModal } from './ManualAttendanceModal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { AttendanceRecord } from '../../types';

const STATUS_BADGE: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700',
  late: 'bg-amber-50 text-amber-700',
  half_day: 'bg-sky-50 text-sky-700',
  absent: 'bg-rose-50 text-rose-700',
};

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function nameOf(entity: AttendanceRecord['userId']): string {
  return typeof entity === 'object' ? entity.name : 'Unknown';
}

export function AttendancePage() {
  const { user, hasRole } = useAuth();
  const isManager = hasRole('company_admin', 'team_lead');
  const [scope, setScope] = useState<'mine' | 'team'>('mine');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: today, isLoading: todayLoading } = useTodayAttendance();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const deleteRecord = useDeleteAttendance();

  const now = new Date();
  const { data: summary } = useAttendanceSummary({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data: records, isLoading: recordsLoading } = useAttendanceList(
    scope === 'team' ? {} : { userId: user?._id }
  );

  async function handleClockIn() {
    try {
      await clockIn.mutateAsync();
      toast.success('Clocked in');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not clock in');
    }
  }

  async function handleClockOut() {
    try {
      await clockOut.mutateAsync();
      toast.success('Clocked out');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not clock out');
    }
  }

  async function handleDelete(record: AttendanceRecord) {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await deleteRecord.mutateAsync(record._id);
      toast.success('Record deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Attendance</h1>
          <p className="mt-0.5 text-sm text-slate-500">Clock in and out, and track your time.</p>
        </div>
        {isManager && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Log attendance
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Clock size={15} /> Today
          </div>
          {todayLoading ? (
            <Spinner />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
                <div>
                  <div className="text-xs text-slate-400">Clock in</div>
                  <div className="font-semibold text-slate-800">{fmtTime(today?.clockIn ?? null)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Clock out</div>
                  <div className="font-semibold text-slate-800">{fmtTime(today?.clockOut ?? null)}</div>
                </div>
                {today && (
                  <span className={clsx('badge', STATUS_BADGE[today.status])}>{today.status.replace('_', ' ')}</span>
                )}
              </div>
              {!today?.clockIn ? (
                <button onClick={handleClockIn} disabled={clockIn.isPending} className="btn-primary w-full">
                  {clockIn.isPending ? <Spinner className="h-4 w-4 text-white" /> : <><LogIn size={16} /> Clock in</>}
                </button>
              ) : !today?.clockOut ? (
                <button onClick={handleClockOut} disabled={clockOut.isPending} className="btn-secondary w-full">
                  {clockOut.isPending ? <Spinner className="h-4 w-4" /> : <><LogOut size={16} /> Clock out</>}
                </button>
              ) : (
                <p className="text-center text-sm text-slate-400">You're done for today.</p>
              )}
            </>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-slate-500">This month</div>
          {summary ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div>
                <div className="text-xl font-semibold text-emerald-600">{summary.present}</div>
                <div className="text-xs text-slate-500">Present</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-amber-600">{summary.late}</div>
                <div className="text-xs text-slate-500">Late</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-sky-600">{summary.halfDay}</div>
                <div className="text-xs text-slate-500">Half day</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-rose-600">{summary.absent}</div>
                <div className="text-xs text-slate-500">Absent</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-slate-800">{summary.totalHours}h</div>
                <div className="text-xs text-slate-500">Total hours</div>
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      </div>

      {isManager && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setScope('mine')}
            className={clsx('btn-secondary !py-1.5 text-xs', scope === 'mine' && '!border-brand-400 !bg-brand-50 !text-brand-700')}
          >
            My history
          </button>
          <button
            onClick={() => setScope('team')}
            className={clsx('btn-secondary !py-1.5 text-xs', scope === 'team' && '!border-brand-400 !bg-brand-50 !text-brand-700')}
          >
            Whole company
          </button>
        </div>
      )}

      {recordsLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !records || records.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No attendance records yet" description="Clock in to start building your history." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {scope === 'team' && <th className="px-4 py-3 font-medium">Person</th>}
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Clock in</th>
                <th className="px-4 py-3 font-medium">Clock out</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {isManager && <th className="px-4 py-3 font-medium">Notes</th>}
                {isManager && <th className="px-4 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record) => (
                <tr key={record._id}>
                  {scope === 'team' && <td className="px-4 py-3 text-slate-700">{nameOf(record.userId)}</td>}
                  <td className="px-4 py-3 text-slate-600">{record.date}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtTime(record.clockIn)}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtTime(record.clockOut)}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', STATUS_BADGE[record.status])}>{record.status.replace('_', ' ')}</span>
                  </td>
                  {isManager && <td className="px-4 py-3 text-slate-500">{record.notes || '—'}</td>}
                  {isManager && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(record)} aria-label="Delete record" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ManualAttendanceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
