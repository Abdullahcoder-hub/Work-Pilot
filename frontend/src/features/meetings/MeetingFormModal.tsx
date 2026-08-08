import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Meeting, MeetingStatus } from '../../types';
import { useTeam } from '../team/useTeam';
import { useProjects } from '../projects/useProjects';
import { useCreateMeeting, useUpdateMeeting } from './useMeetings';

/** <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time, no timezone suffix. */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStart(): string {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0);
  return toDatetimeLocal(d.toISOString());
}

function defaultEnd(startLocal: string): string {
  const d = new Date(startLocal);
  d.setMinutes(d.getMinutes() + 30);
  return toDatetimeLocal(d.toISOString());
}

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting?: Meeting | null;
}

export function MeetingFormModal({ isOpen, onClose, meeting }: MeetingFormModalProps) {
  const { data: members } = useTeam();
  const { data: projects } = useProjects();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const isEditing = !!meeting;

  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    attendees: [] as string[],
    startTime: defaultStart(),
    endTime: '',
    location: '',
    status: 'scheduled' as MeetingStatus,
  });

  useEffect(() => {
    if (meeting) {
      setForm({
        title: meeting.title,
        description: meeting.description,
        projectId: typeof meeting.projectId === 'object' ? meeting.projectId?._id ?? '' : meeting.projectId ?? '',
        attendees: meeting.attendees.map((a) => (typeof a === 'object' ? a._id : a)),
        startTime: toDatetimeLocal(meeting.startTime),
        endTime: toDatetimeLocal(meeting.endTime),
        location: meeting.location,
        status: meeting.status,
      });
    } else {
      const start = defaultStart();
      setForm({ title: '', description: '', projectId: '', attendees: [], startTime: start, endTime: defaultEnd(start), location: '', status: 'scheduled' });
    }
  }, [meeting, isOpen]);

  const isSubmitting = createMeeting.isPending || updateMeeting.isPending;

  function toggleAttendee(userId: string) {
    setForm((p) => ({
      ...p,
      attendees: p.attendees.includes(userId) ? p.attendees.filter((a) => a !== userId) : [...p.attendees, userId],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      toast.error('End time must be after start time');
      return;
    }
    try {
      const payload = {
        title: form.title,
        description: form.description,
        projectId: form.projectId || null,
        attendees: form.attendees,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        location: form.location,
      };
      if (isEditing && meeting) {
        await updateMeeting.mutateAsync({ id: meeting._id, input: { ...payload, status: form.status } });
        toast.success('Meeting updated');
      } else {
        await createMeeting.mutateAsync(payload);
        toast.success('Meeting scheduled');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit meeting' : 'Schedule meeting'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="meeting-title">
            Title
          </label>
          <input
            id="meeting-title"
            required
            maxLength={200}
            className="input"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="meeting-description">
            Description
          </label>
          <textarea
            id="meeting-description"
            rows={2}
            maxLength={2000}
            className="input"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="meeting-start">
              Start
            </label>
            <input
              id="meeting-start"
              type="datetime-local"
              required
              className="input"
              value={form.startTime}
              onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="meeting-end">
              End
            </label>
            <input
              id="meeting-end"
              type="datetime-local"
              required
              className="input"
              value={form.endTime}
              onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="meeting-project">
              Project (optional)
            </label>
            <select
              id="meeting-project"
              className="input"
              value={form.projectId}
              onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
            >
              <option value="">No project</option>
              {(projects ?? []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="meeting-location">
              Location / link
            </label>
            <input
              id="meeting-location"
              className="input"
              placeholder="Room 2 or a video-call link"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            />
          </div>
        </div>

        {isEditing && (
          <div>
            <label className="label" htmlFor="meeting-status">
              Status
            </label>
            <select
              id="meeting-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as MeetingStatus }))}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        <div>
          <span className="label">Attendees</span>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {(members ?? []).map((m) => (
              <label key={m._id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-surface-subtle">
                <input
                  type="checkbox"
                  checked={form.attendees.includes(m._id)}
                  onChange={() => toggleAttendee(m._id)}
                  className="h-3.5 w-3.5 rounded border-border text-brand-500 focus:ring-brand-400"
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : isEditing ? 'Save changes' : 'Schedule meeting'}
        </button>
      </form>
    </Modal>
  );
}
