import { Attendance, AttendanceStatus, LATE_THRESHOLD_HOUR } from './attendance.model';
import { User, Role } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const CAN_MANAGE_ATTENDANCE: Role[] = ['company_admin', 'team_lead'];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeStatus(clockInAt: Date): AttendanceStatus {
  const hourOfDay = clockInAt.getHours() + clockInAt.getMinutes() / 60;
  return hourOfDay > LATE_THRESHOLD_HOUR ? 'late' : 'present';
}

export async function clockIn(actor: Actor) {
  const date = todayString();
  const existing = await Attendance.findOne({ companyId: actor.companyId, userId: actor.userId, date });
  if (existing && existing.clockIn) {
    throw ApiError.conflict('You have already clocked in today');
  }

  const now = new Date();
  if (existing) {
    existing.clockIn = now;
    existing.status = computeStatus(now);
    await existing.save();
    return existing;
  }

  return Attendance.create({
    companyId: actor.companyId,
    userId: actor.userId,
    date,
    clockIn: now,
    status: computeStatus(now),
  });
}

export async function clockOut(actor: Actor) {
  const date = todayString();
  const record = await Attendance.findOne({ companyId: actor.companyId, userId: actor.userId, date });
  if (!record || !record.clockIn) {
    throw ApiError.badRequest('You need to clock in before you can clock out');
  }
  if (record.clockOut) {
    throw ApiError.conflict('You have already clocked out today');
  }

  record.clockOut = new Date();
  // A clock-out before lunch counts as a half day, regardless of what the
  // arrival-time-based status said this morning.
  const hoursWorked = (record.clockOut.getTime() - record.clockIn.getTime()) / 3_600_000;
  if (hoursWorked < 4) {
    record.status = 'half_day';
  }
  await record.save();
  return record;
}

export async function getToday(actor: Actor) {
  return Attendance.findOne({ companyId: actor.companyId, userId: actor.userId, date: todayString() });
}

interface ListAttendanceInput {
  from?: string;
  to?: string;
  userId?: string;
}

export async function listAttendance(actor: Actor, filters: ListAttendanceInput) {
  const query: Record<string, unknown> = { companyId: actor.companyId };

  if (CAN_MANAGE_ATTENDANCE.includes(actor.role)) {
    if (filters.userId) query.userId = filters.userId;
  } else {
    // Employees can only ever see their own history — attendance is
    // sensitive HR data, not something teammates browse.
    query.userId = actor.userId;
  }

  if (filters.from || filters.to) {
    const range: Record<string, string> = {};
    if (filters.from) range.$gte = filters.from;
    if (filters.to) range.$lte = filters.to;
    query.date = range;
  }

  return Attendance.find(query).sort({ date: -1 }).populate('userId', 'name email').populate('markedBy', 'name');
}

interface ManualEntryInput {
  userId: string;
  date: string;
  status: AttendanceStatus;
  clockIn?: string;
  clockOut?: string;
  notes?: string;
}

export async function manualEntry(actor: Actor, input: ManualEntryInput) {
  const targetUser = await User.findOne({ _id: input.userId, companyId: actor.companyId });
  if (!targetUser) throw ApiError.badRequest('That person is not in your company');

  const existing = await Attendance.findOne({ companyId: actor.companyId, userId: input.userId, date: input.date });
  const payload = {
    status: input.status,
    clockIn: input.clockIn ? new Date(input.clockIn) : existing?.clockIn ?? null,
    clockOut: input.clockOut ? new Date(input.clockOut) : existing?.clockOut ?? null,
    notes: input.notes ?? existing?.notes ?? '',
    markedBy: actor.userId,
  };

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  return Attendance.create({
    companyId: actor.companyId,
    userId: input.userId,
    date: input.date,
    ...payload,
  });
}

interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  clockIn?: string;
  clockOut?: string;
  notes?: string;
}

export async function updateAttendance(actor: Actor, recordId: string, input: UpdateAttendanceInput) {
  const record = await Attendance.findOne({ _id: recordId, companyId: actor.companyId });
  if (!record) throw ApiError.notFound('Attendance record not found');

  if (input.status !== undefined) record.status = input.status;
  if (input.clockIn !== undefined) record.clockIn = input.clockIn ? new Date(input.clockIn) : null;
  if (input.clockOut !== undefined) record.clockOut = input.clockOut ? new Date(input.clockOut) : null;
  if (input.notes !== undefined) record.notes = input.notes;
  record.markedBy = actor.userId as unknown as typeof record.markedBy;

  await record.save();
  return record;
}

export async function deleteAttendance(actor: Actor, recordId: string) {
  const record = await Attendance.findOne({ _id: recordId, companyId: actor.companyId });
  if (!record) throw ApiError.notFound('Attendance record not found');
  await record.deleteOne();
}

export interface MonthlySummary {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  totalHours: number;
}

export async function getMonthlySummary(actor: Actor, userId: string, year: number, month: number): Promise<MonthlySummary> {
  if (userId !== actor.userId && !CAN_MANAGE_ATTENDANCE.includes(actor.role)) {
    throw ApiError.forbidden('You can only view your own attendance summary');
  }

  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const records = await Attendance.find({ companyId: actor.companyId, userId, date: { $gte: from, $lte: to } });

  const summary: MonthlySummary = { present: 0, late: 0, halfDay: 0, absent: 0, totalHours: 0 };
  for (const record of records) {
    if (record.status === 'present') summary.present += 1;
    else if (record.status === 'late') summary.late += 1;
    else if (record.status === 'half_day') summary.halfDay += 1;
    else if (record.status === 'absent') summary.absent += 1;

    if (record.clockIn && record.clockOut) {
      summary.totalHours += (record.clockOut.getTime() - record.clockIn.getTime()) / 3_600_000;
    }
  }
  summary.totalHours = Math.round(summary.totalHours * 10) / 10;

  return summary;
}
