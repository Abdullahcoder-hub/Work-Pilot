import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Video, Pencil, Trash2, MapPin, Users, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { useMeetings, useDeleteMeeting } from './useMeetings';
import { MeetingFormModal } from './MeetingFormModal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Meeting } from '../../types';

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-rose-50 text-rose-700',
};

function attendeeNames(meeting: Meeting): string {
  return meeting.attendees
    .map((a) => (typeof a === 'object' ? a.name : null))
    .filter(Boolean)
    .join(', ') || 'No attendees';
}

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeFmt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${dateStr} · ${start.toLocaleTimeString(undefined, timeFmt)} – ${end.toLocaleTimeString(undefined, timeFmt)}`;
}

export function MeetingsPage() {
  const { user, hasRole } = useAuth();
  const { data: meetings, isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const isManager = hasRole('company_admin', 'team_lead');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const list = meetings ?? [];
    return {
      upcoming: list.filter((m) => new Date(m.endTime).getTime() >= now).sort((a, b) => a.startTime.localeCompare(b.startTime)),
      past: list.filter((m) => new Date(m.endTime).getTime() < now).sort((a, b) => b.startTime.localeCompare(a.startTime)),
    };
  }, [meetings]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(meeting: Meeting) {
    setEditing(meeting);
    setModalOpen(true);
  }

  function canManage(meeting: Meeting): boolean {
    const organizerId = typeof meeting.organizerId === 'object' ? meeting.organizerId._id : meeting.organizerId;
    return organizerId === user?._id || isManager;
  }

  async function handleDelete(meeting: Meeting) {
    if (!window.confirm(`Delete "${meeting.title}"? This can't be undone.`)) return;
    try {
      await deleteMeeting.mutateAsync(meeting._id);
      toast.success('Meeting deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function MeetingCard({ meeting }: { meeting: Meeting }) {
    return (
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={clsx('badge', STATUS_BADGE[meeting.status])}>{meeting.status}</span>
              <h3 className="text-sm font-semibold text-slate-800">{meeting.title}</h3>
            </div>
            {meeting.description && <p className="mt-1 text-sm text-slate-500">{meeting.description}</p>}
          </div>
          {canManage(meeting) && (
            <div className="flex gap-1">
              <button onClick={() => openEdit(meeting)} aria-label="Edit meeting" className="rounded p-1 text-slate-400 hover:bg-surface-subtle hover:text-slate-600">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(meeting)} aria-label="Delete meeting" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {formatRange(meeting.startTime, meeting.endTime)}
          </span>
          {meeting.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {meeting.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users size={12} /> {attendeeNames(meeting)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Meetings</h1>
          <p className="mt-0.5 text-sm text-slate-500">Schedule and track meetings with your team.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Schedule meeting
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !meetings || meetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings yet"
          description="Schedule your first meeting to get everyone on the same page."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Schedule meeting
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</h2>
              <div className="space-y-2.5">
                {upcoming.map((m) => (
                  <MeetingCard key={m._id} meeting={m} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Past</h2>
              <div className="space-y-2.5 opacity-70">
                {past.map((m) => (
                  <MeetingCard key={m._id} meeting={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <MeetingFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} meeting={editing} />
    </div>
  );
}
