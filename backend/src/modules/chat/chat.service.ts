import { Types } from 'mongoose';
import { ChatMessage } from './chat.model';
import { Project } from '../project/project.model';
import { User, Role } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';
import { getIO } from '../../realtime/io';
import { notify } from '../notification/notification.service';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const CAN_SEE_ALL_PROJECTS: Role[] = ['company_admin', 'team_lead'];
const GENERAL_CHANNEL = 'general';
const DM_PREFIX = 'dm:';

/**
 * Direct-message channels don't need their own collection — they're just
 * a channelId shaped as `dm:<userIdA>:<userIdB>` with the two ids always
 * sorted alphabetically, so both participants independently compute the
 * exact same channelId without a lookup. Reuses all the existing message
 * storage/pagination/broadcast machinery built for group channels.
 */
export function buildDmChannelId(userIdA: string, userIdB: string): string {
  return `${DM_PREFIX}${[userIdA, userIdB].sort().join(':')}`;
}

function parseDmChannelId(channelId: string): [string, string] | null {
  if (!channelId.startsWith(DM_PREFIX)) return null;
  const parts = channelId.slice(DM_PREFIX.length).split(':');
  if (parts.length !== 2 || !parts.every((p) => Types.ObjectId.isValid(p))) return null;
  return [parts[0], parts[1]];
}

/** For a DM channel, the other participant relative to `userId` — or null if userId isn't in it. */
function otherDmParticipant(channelId: string, userId: string): string | null {
  const parsed = parseDmChannelId(channelId);
  if (!parsed) return null;
  const [a, b] = parsed;
  if (a === userId) return b;
  if (b === userId) return a;
  return null;
}

/**
 * The 'general' channel and DM threads are open to their participants by
 * definition. Any other channelId must be a real project in this company,
 * and the actor must be a member, the owner, or a manager — the same rule
 * used for the Kanban board, so "who can see the board" and "who can chat
 * about it" agree.
 */
async function assertChannelAccess(actor: Actor, channelId: string): Promise<void> {
  if (channelId === GENERAL_CHANNEL) return;

  if (channelId.startsWith(DM_PREFIX)) {
    const other = otherDmParticipant(channelId, actor.userId);
    if (!other) {
      throw ApiError.forbidden('You are not a participant in this conversation');
    }
    const otherUser = await User.findOne({ _id: other, companyId: actor.companyId });
    if (!otherUser) throw ApiError.notFound('That person is not in your company');
    return;
  }

  if (!Types.ObjectId.isValid(channelId)) {
    throw ApiError.badRequest('Unknown channel');
  }

  const project = await Project.findOne({ _id: channelId, companyId: actor.companyId });
  if (!project) throw ApiError.notFound('Channel not found');

  const isMember = project.members.some((m) => m.toString() === actor.userId);
  const isOwner = project.ownerId.toString() === actor.userId;
  const canManage = CAN_SEE_ALL_PROJECTS.includes(actor.role);

  if (!isMember && !isOwner && !canManage) {
    throw ApiError.forbidden('You are not a member of this project channel');
  }
}

interface ListMessagesInput {
  before?: string;
  limit?: number;
}

export async function listMessages(actor: Actor, channelId: string, opts: ListMessagesInput) {
  await assertChannelAccess(actor, channelId);

  const query: Record<string, unknown> = { companyId: actor.companyId, channelId };
  if (opts.before) query.createdAt = { $lt: new Date(opts.before) };

  const limit = opts.limit ?? 50;
  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'name email');

  // Stored/queried newest-first for efficient pagination, returned
  // oldest-first so the frontend can render top-to-bottom directly.
  return messages.reverse();
}

export interface SendMessageAttachment {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export async function sendMessage(actor: Actor, channelId: string, text: string, attachment?: SendMessageAttachment) {
  await assertChannelAccess(actor, channelId);

  if (!text.trim() && !attachment) {
    throw ApiError.badRequest('A message needs text, a file, or both');
  }

  const message = await ChatMessage.create({
    companyId: actor.companyId,
    channelId,
    senderId: actor.userId,
    text,
    attachment: attachment ?? null,
  });

  const populated = await message.populate('senderId', 'name email');
  getIO()?.to(`channel:${actor.companyId}:${channelId}`).emit('chat:message', populated.toJSON());

  // Only DMs generate a notification — a ping on every message in a busy
  // group channel (General, a project) would be noise, not signal.
  const recipientId = otherDmParticipant(channelId, actor.userId);
  if (recipientId) {
    const sender = await User.findById(actor.userId).select('name');
    const previewText = text.trim()
      ? text.length > 120
        ? `${text.slice(0, 120)}…`
        : text
      : `Sent a file: ${attachment?.fileName ?? 'attachment'}`;
    await notify({
      companyId: actor.companyId,
      recipientId,
      actorId: actor.userId,
      type: 'direct_message',
      title: `New message from ${sender?.name ?? 'a teammate'}`,
      message: previewText,
      channelId,
    });
  }

  return populated;
}

export interface DmThread {
  channelId: string;
  otherUser: { _id: string; name: string; email: string };
  lastMessage: { text: string; createdAt: string; isMine: boolean };
}

/**
 * Every DM conversation the actor has sent or received at least one
 * message in, most-recent first — the "recent conversations" list, same
 * idea as a WhatsApp chat list. Starting a conversation with someone new
 * (no messages yet) doesn't need an entry here; the frontend's "start a
 * new chat" picker uses the plain team roster for that.
 */
export async function listDmThreads(actor: Actor): Promise<DmThread[]> {
  const idPattern = actor.userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rows = await ChatMessage.aggregate([
    {
      $match: {
        companyId: new Types.ObjectId(actor.companyId),
        channelId: { $regex: `^dm:(${idPattern}:.+|.+:${idPattern})$` },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$channelId',
        text: { $first: '$text' },
        createdAt: { $first: '$createdAt' },
        senderId: { $first: '$senderId' },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const otherIds = rows.map((row) => otherDmParticipant(row._id, actor.userId)).filter((id): id is string => !!id);
  const users = await User.find({ _id: { $in: otherIds } }).select('name email');
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const threads: DmThread[] = [];
  for (const row of rows) {
    const otherId = otherDmParticipant(row._id, actor.userId);
    const otherUser = otherId ? userMap.get(otherId) : undefined;
    if (!otherUser) continue; // e.g. the other user was deleted
    threads.push({
      channelId: row._id,
      otherUser: { _id: otherUser._id.toString(), name: otherUser.name, email: otherUser.email },
      lastMessage: {
        text: row.text,
        createdAt: row.createdAt.toISOString(),
        isMine: row.senderId.toString() === actor.userId,
      },
    });
  }

  return threads;
}
