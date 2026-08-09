import { LeaveRequest, ILeaveRequest, LeaveType, LeaveStatus, LEAVE_TYPES } from './leave.model';
import { HydratedDocument } from 'mongoose';
import { User, Role } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notification/notification.service';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const CAN_REVIEW_LEAVE: Role[] = ['company_admin', 'team_lead'];

/**
 * Annual allowance per leave type, in days. 'unpaid' and 'other' are
 * uncapped — there's no meaningful limit to enforce on unpaid time off,
 * and 'other' covers cases (bereavement, jury duty, etc.) a fixed company
 * policy shouldn't block outright. A future Settings page is the natural
 * place to make these per-company configurable instead of a constant.
 */
const LEAVE_ALLOWANCE: Partial<Record<LeaveType, number>> = {
  annual: 15,
  sick: 10,
  casual: 8,
};

function daysInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

async function usedDaysThisYear(companyId: string, userId: string, leaveType: LeaveType): Promise<number> {
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const yearEnd = `${new Date().getFullYear()}-12-31`;
  const approved = await LeaveRequest.find({
    companyId,
    userId,
    leaveType,
    status: 'approved',
    startDate: { $lte: yearEnd },
    endDate: { $gte: yearStart },
  });
  return approved.reduce((sum, r) => sum + daysInclusive(r.startDate, r.endDate), 0);
}

export interface LeaveBalance {
  leaveType: LeaveType;
  allocated: number | null; // null = uncapped
  used: number;
  remaining: number | null;
}

export async function getBalance(actor: Actor, userId: string): Promise<LeaveBalance[]> {
  if (userId !== actor.userId && !CAN_REVIEW_LEAVE.includes(actor.role)) {
    throw ApiError.forbidden('You can only view your own leave balance');
  }

  return Promise.all(
    LEAVE_TYPES.map(async (leaveType) => {
      const allocated = LEAVE_ALLOWANCE[leaveType] ?? null;
      const used = await usedDaysThisYear(actor.companyId, userId, leaveType);
      return { leaveType, allocated, used, remaining: allocated === null ? null : Math.max(0, allocated - used) };
    })
  );
}

interface ListLeaveInput {
  status?: LeaveStatus;
  userId?: string;
}

export async function listLeaveRequests(actor: Actor, filters: ListLeaveInput) {
  const query: Record<string, unknown> = { companyId: actor.companyId };

  if (CAN_REVIEW_LEAVE.includes(actor.role)) {
    if (filters.userId) query.userId = filters.userId;
  } else {
    query.userId = actor.userId;
  }
  if (filters.status) query.status = filters.status;

  return LeaveRequest.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'name email')
    .populate('reviewedBy', 'name');
}

interface CreateLeaveInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export async function createLeaveRequest(actor: Actor, input: CreateLeaveInput) {
  const overlapping = await LeaveRequest.findOne({
    companyId: actor.companyId,
    userId: actor.userId,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: input.endDate },
    endDate: { $gte: input.startDate },
  });
  if (overlapping) {
    throw ApiError.conflict('You already have a pending or approved leave request that overlaps these dates');
  }

  const requestedDays = daysInclusive(input.startDate, input.endDate);
  const allocated = LEAVE_ALLOWANCE[input.leaveType];
  if (allocated !== undefined) {
    const used = await usedDaysThisYear(actor.companyId, actor.userId, input.leaveType);
    if (used + requestedDays > allocated) {
      throw ApiError.badRequest(
        `This request needs ${requestedDays} day(s), but only ${Math.max(0, allocated - used)} of your ${allocated} annual ${input.leaveType} days remain`
      );
    }
  }

  return LeaveRequest.create({
    companyId: actor.companyId,
    userId: actor.userId,
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason ?? '',
  });
}

async function findVisibleLeave(actor: Actor, leaveId: string): Promise<HydratedDocument<ILeaveRequest>> {
  const leave = await LeaveRequest.findOne({ _id: leaveId, companyId: actor.companyId });
  if (!leave) throw ApiError.notFound('Leave request not found');

  const isOwner = leave.userId.toString() === actor.userId;
  if (!isOwner && !CAN_REVIEW_LEAVE.includes(actor.role)) {
    throw ApiError.forbidden('You do not have access to this leave request');
  }
  return leave as HydratedDocument<ILeaveRequest>;
}

interface ReviewLeaveInput {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

export async function reviewLeaveRequest(actor: Actor, leaveId: string, input: ReviewLeaveInput) {
  if (!CAN_REVIEW_LEAVE.includes(actor.role)) {
    throw ApiError.forbidden('Only a team lead or company admin can review leave requests');
  }

  const leave = await LeaveRequest.findOne({ _id: leaveId, companyId: actor.companyId });
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') {
    throw ApiError.badRequest(`This request was already ${leave.status}`);
  }

  leave.status = input.status;
  leave.reviewedBy = actor.userId as unknown as typeof leave.reviewedBy;
  leave.reviewedAt = new Date();
  leave.reviewNote = input.reviewNote ?? '';
  await leave.save();

  const reviewerName = (await User.findById(actor.userId).select('name'))?.name ?? 'A manager';
  await notify({
    companyId: actor.companyId,
    recipientId: leave.userId.toString(),
    actorId: actor.userId,
    type: input.status === 'approved' ? 'leave_approved' : 'leave_rejected',
    title: input.status === 'approved' ? 'Leave request approved' : 'Leave request rejected',
    message:
      input.status === 'approved'
        ? `${reviewerName} approved your ${leave.leaveType} leave (${leave.startDate} – ${leave.endDate})`
        : `${reviewerName} rejected your ${leave.leaveType} leave request`,
    leaveId: leave._id.toString(),
  });

  return leave;
}

export async function cancelLeaveRequest(actor: Actor, leaveId: string) {
  const leave = await findVisibleLeave(actor, leaveId);
  const isOwner = leave.userId.toString() === actor.userId;

  if (leave.status === 'cancelled' || leave.status === 'rejected') {
    throw ApiError.badRequest(`This request is already ${leave.status}`);
  }
  if (leave.status === 'approved' && leave.startDate < new Date().toISOString().slice(0, 10)) {
    throw ApiError.badRequest('Cannot cancel leave that has already started');
  }
  if (!isOwner && !CAN_REVIEW_LEAVE.includes(actor.role)) {
    throw ApiError.forbidden('You do not have access to this leave request');
  }

  leave.status = 'cancelled';
  await leave.save();
  return leave;
}
