import { AiMessage } from './ai.model';
import { Role } from '../user/user.model';
import { executeCommand } from '../assistant/assistant.service';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const HISTORY_LIMIT = 200;

export async function getHistory(actor: Actor) {
  return AiMessage.find({ companyId: actor.companyId, userId: actor.userId })
    .sort({ createdAt: 1 })
    .limit(HISTORY_LIMIT);
}

export async function clearHistory(actor: Actor) {
  await AiMessage.deleteMany({ companyId: actor.companyId, userId: actor.userId });
}

interface AttachedFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * This assistant is entirely self-built — a rule-based intent classifier
 * plus deterministic entity extraction (see modules/assistant/), wired
 * straight into the same task/meeting/chat/attendance services every
 * other part of the app uses. No external AI API is called anywhere in
 * this path.
 */
export async function chat(actor: Actor, userText: string, attachedFile?: AttachedFile) {
  await AiMessage.create({ companyId: actor.companyId, userId: actor.userId, role: 'user', content: userText });

  const result = await executeCommand(actor, userText, attachedFile);

  const saved = await AiMessage.create({
    companyId: actor.companyId,
    userId: actor.userId,
    role: 'assistant',
    content: result.reply,
    intent: result.intent,
    createdTaskId: result.createdTaskId,
    completedTaskId: result.completedTaskId,
    deletedTaskTitle: result.deletedTaskTitle,
    scheduledMeetingId: result.scheduledMeetingId,
    messagedChannelId: result.messagedChannelId,
    sentFileId: result.sentFileId,
    attendanceAction: result.attendanceAction,
  });

  return { reply: result.reply, message: saved };
}
