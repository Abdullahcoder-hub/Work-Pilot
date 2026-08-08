import { Meeting, IMeeting, MeetingStatus } from './meeting.model';
import { User, Role } from '../user/user.model';
import { Project } from '../project/project.model';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notification/notification.service';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const CAN_SEE_ALL_MEETINGS: Role[] = ['company_admin', 'team_lead'];

async function actorName(userId: string): Promise<string> {
  const user = await User.findById(userId).select('name');
  return user?.name ?? 'Someone';
}

async function assertAttendeesBelongToCompany(companyId: string, attendeeIds: string[]) {
  if (attendeeIds.length === 0) return;
  const count = await User.countDocuments({ _id: { $in: attendeeIds }, companyId });
  if (count !== attendeeIds.length) {
    throw ApiError.badRequest('One or more attendees do not belong to this company');
  }
}

async function assertProjectBelongsToCompany(companyId: string, projectId?: string) {
  if (!projectId) return;
  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) throw ApiError.badRequest('Project not found in this company');
}

interface ListMeetingsInput {
  from?: Date;
  to?: Date;
  projectId?: string;
}

export async function listMeetings(actor: Actor, filters: ListMeetingsInput) {
  const query: Record<string, unknown> = { companyId: actor.companyId };

  if (!CAN_SEE_ALL_MEETINGS.includes(actor.role)) {
    query.$or = [{ organizerId: actor.userId }, { attendees: actor.userId }];
  }
  if (filters.projectId) query.projectId = filters.projectId;
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = filters.from;
    if (filters.to) range.$lte = filters.to;
    query.startTime = range;
  }

  return Meeting.find(query)
    .sort({ startTime: 1 })
    .populate('organizerId', 'name email')
    .populate('attendees', 'name email')
    .populate('projectId', 'name color');
}

async function findAccessibleMeeting(actor: Actor, meetingId: string): Promise<IMeeting> {
  const meeting = await Meeting.findOne({ _id: meetingId, companyId: actor.companyId });
  if (!meeting) throw ApiError.notFound('Meeting not found');

  const isOrganizer = meeting.organizerId.toString() === actor.userId;
  const isAttendee = meeting.attendees.some((a) => a.toString() === actor.userId);
  const canSeeAll = CAN_SEE_ALL_MEETINGS.includes(actor.role);

  if (!isOrganizer && !isAttendee && !canSeeAll) {
    throw ApiError.forbidden('You do not have access to this meeting');
  }
  return meeting;
}

export async function getMeetingById(actor: Actor, meetingId: string) {
  const meeting = await findAccessibleMeeting(actor, meetingId);
  return Meeting.findById(meeting._id)
    .populate('organizerId', 'name email')
    .populate('attendees', 'name email')
    .populate('projectId', 'name color');
}

interface CreateMeetingInput {
  title: string;
  description?: string;
  projectId?: string;
  attendees?: string[];
  startTime: Date;
  endTime: Date;
  location?: string;
}

export async function createMeeting(actor: Actor, input: CreateMeetingInput) {
  await assertProjectBelongsToCompany(actor.companyId, input.projectId);
  const attendeeIds = Array.from(new Set(input.attendees ?? []));
  await assertAttendeesBelongToCompany(actor.companyId, attendeeIds);

  const meeting = await Meeting.create({
    companyId: actor.companyId,
    projectId: input.projectId ?? null,
    title: input.title,
    description: input.description ?? '',
    organizerId: actor.userId,
    attendees: attendeeIds,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location ?? '',
  });

  const organizerName = await actorName(actor.userId);
  await Promise.all(
    attendeeIds
      .filter((id) => id !== actor.userId)
      .map((attendeeId) =>
        notify({
          companyId: actor.companyId,
          recipientId: attendeeId,
          actorId: actor.userId,
          type: 'meeting_invite',
          title: 'New meeting invite',
          message: `${organizerName} invited you to "${meeting.title}"`,
          meetingId: meeting._id.toString(),
        })
      )
  );

  return meeting;
}

interface UpdateMeetingInput {
  title?: string;
  description?: string;
  attendees?: string[];
  startTime?: Date;
  endTime?: Date;
  location?: string;
  status?: MeetingStatus;
}

export async function updateMeeting(actor: Actor, meetingId: string, input: UpdateMeetingInput) {
  const meeting = await findAccessibleMeeting(actor, meetingId);
  const isOrganizer = meeting.organizerId.toString() === actor.userId;
  if (!isOrganizer && !CAN_SEE_ALL_MEETINGS.includes(actor.role)) {
    throw ApiError.forbidden('Only the organizer, a team lead, or a company admin can edit this meeting');
  }

  const startTime = input.startTime ?? meeting.startTime;
  const endTime = input.endTime ?? meeting.endTime;
  if (endTime <= startTime) {
    throw ApiError.badRequest('endTime must be after startTime');
  }

  const isReschedule = (input.startTime && input.startTime.getTime() !== meeting.startTime.getTime()) ||
    (input.endTime && input.endTime.getTime() !== meeting.endTime.getTime()) ||
    (input.location !== undefined && input.location !== meeting.location);
  const isCancellation = input.status === 'cancelled' && meeting.status !== 'cancelled';

  if (input.attendees !== undefined) {
    await assertAttendeesBelongToCompany(actor.companyId, input.attendees);
    meeting.attendees = input.attendees as unknown as typeof meeting.attendees;
  }
  if (input.title !== undefined) meeting.title = input.title;
  if (input.description !== undefined) meeting.description = input.description;
  if (input.startTime !== undefined) meeting.startTime = input.startTime;
  if (input.endTime !== undefined) meeting.endTime = input.endTime;
  if (input.location !== undefined) meeting.location = input.location;
  if (input.status !== undefined) meeting.status = input.status;

  await meeting.save();

  const actingName = await actorName(actor.userId);
  const recipients = meeting.attendees.map((a) => a.toString()).filter((id) => id !== actor.userId);

  if (isCancellation) {
    await Promise.all(
      recipients.map((recipientId) =>
        notify({
          companyId: actor.companyId,
          recipientId,
          actorId: actor.userId,
          type: 'meeting_cancelled',
          title: 'Meeting cancelled',
          message: `${actingName} cancelled "${meeting.title}"`,
          meetingId: meeting._id.toString(),
        })
      )
    );
  } else if (isReschedule) {
    await Promise.all(
      recipients.map((recipientId) =>
        notify({
          companyId: actor.companyId,
          recipientId,
          actorId: actor.userId,
          type: 'meeting_updated',
          title: 'Meeting updated',
          message: `${actingName} updated "${meeting.title}"`,
          meetingId: meeting._id.toString(),
        })
      )
    );
  }

  return meeting;
}

export async function deleteMeeting(actor: Actor, meetingId: string) {
  const meeting = await findAccessibleMeeting(actor, meetingId);
  const isOrganizer = meeting.organizerId.toString() === actor.userId;
  if (!isOrganizer && !CAN_SEE_ALL_MEETINGS.includes(actor.role)) {
    throw ApiError.forbidden('Only the organizer, a team lead, or a company admin can delete this meeting');
  }
  await meeting.deleteOne();
}
