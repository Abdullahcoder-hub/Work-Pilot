import { Task } from '../task/task.model';
import { Meeting } from '../meeting/meeting.model';
import { LeaveRequest } from '../leave/leave.model';
import { Role } from '../user/user.model';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const CAN_SEE_ALL: Role[] = ['company_admin', 'team_lead'];

export type CalendarEvent =
  | {
      id: string;
      kind: 'task';
      title: string;
      date: string; // YYYY-MM-DD
      priority: string;
      completed: boolean;
      projectId: string | null;
      link: string;
    }
  | {
      id: string;
      kind: 'meeting';
      title: string;
      startTime: string;
      endTime: string;
      status: string;
      projectId: string | null;
      link: string;
    }
  | {
      id: string;
      kind: 'leave';
      title: string;
      startDate: string; // YYYY-MM-DD
      endDate: string; // YYYY-MM-DD
      leaveType: string;
      link: string;
    };

interface RangeInput {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

/**
 * Combines a user's visible tasks (by due date), meetings (by start
 * time), and approved leave (by date range) into one list for the
 * calendar grid. Visibility mirrors the source modules exactly — an
 * employee sees their own tasks/meetings/leave; a manager sees
 * everything in the company. Leave follows the same "own data only for
 * employees" rule as the Attendance/Leave pages themselves, for
 * consistency, rather than being broadly visible for team planning.
 */
export async function getCalendarEvents(actor: Actor, range: RangeInput): Promise<CalendarEvent[]> {
  const canSeeAll = CAN_SEE_ALL.includes(actor.role);

  const taskQuery: Record<string, unknown> = {
    companyId: actor.companyId,
    dueDate: { $gte: range.from, $lte: range.to, $ne: '' },
  };
  if (!canSeeAll) {
    taskQuery.$or = [{ createdBy: actor.userId }, { assigneeId: actor.userId }];
  }

  const meetingQuery: Record<string, unknown> = {
    companyId: actor.companyId,
    startTime: { $gte: new Date(`${range.from}T00:00:00.000Z`), $lte: new Date(`${range.to}T23:59:59.999Z`) },
  };
  if (!canSeeAll) {
    meetingQuery.$or = [{ organizerId: actor.userId }, { attendees: actor.userId }];
  }

  const leaveQuery: Record<string, unknown> = {
    companyId: actor.companyId,
    status: 'approved',
    startDate: { $lte: range.to },
    endDate: { $gte: range.from },
  };
  if (!canSeeAll) {
    leaveQuery.userId = actor.userId;
  }

  const [tasks, meetings, leaveRequests] = await Promise.all([
    Task.find(taskQuery).select('title dueDate priority completed projectId'),
    Meeting.find(meetingQuery).select('title startTime endTime status projectId'),
    LeaveRequest.find(leaveQuery).select('leaveType startDate endDate userId').populate('userId', 'name'),
  ]);

  const taskEvents: CalendarEvent[] = tasks.map((t) => ({
    id: t._id.toString(),
    kind: 'task',
    title: t.title,
    date: t.dueDate,
    priority: t.priority,
    completed: t.completed,
    projectId: t.projectId ? t.projectId.toString() : null,
    link: t.projectId ? `/projects/${t.projectId.toString()}` : '/tasks',
  }));

  const meetingEvents: CalendarEvent[] = meetings.map((m) => ({
    id: m._id.toString(),
    kind: 'meeting',
    title: m.title,
    startTime: m.startTime.toISOString(),
    endTime: m.endTime.toISOString(),
    status: m.status,
    projectId: m.projectId ? m.projectId.toString() : null,
    link: '/meetings',
  }));

  const leaveEvents: CalendarEvent[] = leaveRequests.map((l) => {
    const owner = l.userId as unknown as { name?: string } | null;
    const label = canSeeAll && owner?.name ? `${owner.name} — ${l.leaveType} leave` : `${l.leaveType[0].toUpperCase()}${l.leaveType.slice(1)} leave`;
    return {
      id: l._id.toString(),
      kind: 'leave',
      title: label,
      startDate: l.startDate,
      endDate: l.endDate,
      leaveType: l.leaveType,
      link: '/leave',
    };
  });

  return [...taskEvents, ...meetingEvents, ...leaveEvents];
}
