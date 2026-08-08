import { Types } from 'mongoose';
import { Task, CATEGORIES, PRIORITIES } from '../task/task.model';
import { Project } from '../project/project.model';
import { User } from '../user/user.model';
import { Attendance } from '../attendance/attendance.model';
import { LeaveRequest, LEAVE_TYPES } from '../leave/leave.model';

interface Actor {
  companyId: string;
}

const TREND_DAYS = 14;

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getTaskOverview(actor: Actor) {
  const companyId = new Types.ObjectId(actor.companyId);
  const today = dateStr(new Date());

  const [total, completed, overdue, byPriorityRaw, byCategoryRaw] = await Promise.all([
    Task.countDocuments({ companyId }),
    Task.countDocuments({ companyId, completed: true }),
    Task.countDocuments({ companyId, completed: false, dueDate: { $ne: '', $lt: today } }),
    Task.aggregate([{ $match: { companyId } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Task.aggregate([{ $match: { companyId } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p, 0])) as Record<string, number>;
  for (const row of byPriorityRaw) byPriority[row._id] = row.count;

  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
  for (const row of byCategoryRaw) byCategory[row._id] = row.count;

  return { total, completed, pending: total - completed, overdue, byPriority, byCategory };
}

export async function getTaskTrend(actor: Actor) {
  const days: { date: string; created: number; completed: number }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (TREND_DAYS - 1));

  for (let i = 0; i < TREND_DAYS; i++) {
    const dayStr = dateStr(cursor);
    const nextDay = new Date(cursor);
    nextDay.setDate(nextDay.getDate() + 1);

    const [created, completedCount] = await Promise.all([
      Task.countDocuments({ companyId: actor.companyId, createdAt: { $gte: cursor, $lt: nextDay } }),
      Task.countDocuments({ companyId: actor.companyId, completed: true, completedAt: { $gte: cursor, $lt: nextDay } }),
    ]);

    days.push({ date: dayStr, created, completed: completedCount });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export async function getProjectStats(actor: Actor) {
  const projects = await Project.find({ companyId: actor.companyId }).select('name color status');

  return Promise.all(
    projects.map(async (project) => {
      const [total, done] = await Promise.all([
        Task.countDocuments({ projectId: project._id }),
        Task.countDocuments({ projectId: project._id, status: 'done' }),
      ]);
      return {
        projectId: project._id.toString(),
        name: project.name,
        color: project.color,
        status: project.status,
        total,
        done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    })
  );
}

export async function getTeamWorkload(actor: Actor) {
  const members = await User.find({ companyId: actor.companyId, isActive: true }).select('name role');

  return Promise.all(
    members.map(async (member) => {
      const [assigned, completed] = await Promise.all([
        Task.countDocuments({ companyId: actor.companyId, assigneeId: member._id }),
        Task.countDocuments({ companyId: actor.companyId, assigneeId: member._id, completed: true }),
      ]);
      return {
        userId: member._id.toString(),
        name: member.name,
        role: member.role,
        assigned,
        completed,
        pending: assigned - completed,
      };
    })
  );
}

export async function getAttendanceOverview(actor: Actor) {
  const now = new Date();
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const to = dateStr(now);

  const records = await Attendance.find({ companyId: actor.companyId, date: { $gte: from, $lte: to } }).select('status');

  const summary = { present: 0, late: 0, halfDay: 0, absent: 0 };
  for (const r of records) {
    if (r.status === 'present') summary.present += 1;
    else if (r.status === 'late') summary.late += 1;
    else if (r.status === 'half_day') summary.halfDay += 1;
    else if (r.status === 'absent') summary.absent += 1;
  }

  return { ...summary, totalRecords: records.length };
}

export async function getLeaveOverview(actor: Actor) {
  const companyId = new Types.ObjectId(actor.companyId);
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [pending, approvedThisMonth, byTypeRaw] = await Promise.all([
    LeaveRequest.countDocuments({ companyId, status: 'pending' }),
    LeaveRequest.countDocuments({ companyId, status: 'approved', startDate: { $gte: monthStart } }),
    LeaveRequest.aggregate([
      { $match: { companyId, status: 'approved' } },
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
    ]),
  ]);

  const byType = Object.fromEntries(LEAVE_TYPES.map((t) => [t, 0])) as Record<string, number>;
  for (const row of byTypeRaw) byType[row._id] = row.count;

  return { pending, approvedThisMonth, byType };
}

export async function getOverview(actor: Actor) {
  const [taskStats, taskTrend, projectStats, teamWorkload, attendance, leave] = await Promise.all([
    getTaskOverview(actor),
    getTaskTrend(actor),
    getProjectStats(actor),
    getTeamWorkload(actor),
    getAttendanceOverview(actor),
    getLeaveOverview(actor),
  ]);

  return { taskStats, taskTrend, projectStats, teamWorkload, attendance, leave };
}
