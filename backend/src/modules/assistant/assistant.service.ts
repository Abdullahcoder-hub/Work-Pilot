import { detectIntent } from './intentEngine';
import {
  extractDate,
  extractTime,
  extractPriority,
  extractPayloadText,
  extractMessageText,
  findMentionedMember,
  TeamMember,
} from './entityExtraction';
import * as taskService from '../task/task.service';
import * as meetingService from '../meeting/meeting.service';
import * as chatService from '../chat/chat.service';
import * as attendanceService from '../attendance/attendance.service';
import { getBalance } from '../leave/leave.service';
import { User, Role } from '../user/user.model';
import { Task } from '../task/task.model';
import { ApiError } from '../../utils/ApiError';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

export interface AssistantResult {
  reply: string;
  intent: string;
  createdTaskId: string | null;
  completedTaskId: string | null;
  deletedTaskTitle: string | null;
  scheduledMeetingId: string | null;
  messagedChannelId: string | null;
  sentFileId: string | null;
  attendanceAction: 'clock_in' | 'clock_out' | null;
}

function empty(intent: string): AssistantResult {
  return {
    reply: '',
    intent,
    createdTaskId: null,
    completedTaskId: null,
    deletedTaskTitle: null,
    scheduledMeetingId: null,
    messagedChannelId: null,
    sentFileId: null,
    attendanceAction: null,
  };
}

async function getTeamRoster(companyId: string): Promise<TeamMember[]> {
  const members = await User.find({ companyId, isActive: true }).select('name');
  return members.map((m) => ({ _id: m._id.toString(), name: m.name }));
}

/** Every team member whose first name appears as a whole word in the text — used for meeting attendees, where inviting an extra person by mistake is low-stakes (unlike a DM, which goes to exactly one person). */
function findAllMentionedMembers(text: string, members: TeamMember[]): TeamMember[] {
  const words = text.toLowerCase().split(/[^a-z']+/).filter(Boolean);
  return members.filter((m) => {
    const firstName = m.name.trim().split(/\s+/)[0]?.toLowerCase();
    return firstName && words.includes(firstName);
  });
}

function combineDateAndTime(dateStr: string, time: { hours: number; minutes: number } | null): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const hours = time?.hours ?? 15; // default 3pm when no time was mentioned
  const minutes = time?.minutes ?? 0;
  return new Date(y, m - 1, d, hours, minutes, 0, 0);
}

interface AttachedFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export async function executeCommand(actor: Actor, text: string, attachedFile?: AttachedFile): Promise<AssistantResult> {
  const intent = detectIntent(text);
  const result = empty(intent);

  try {
    await runIntent(actor, intent, text, attachedFile, result);
  } catch (err) {
    // A service-layer rule was hit (already clocked in, not the task
    // owner, seat limit, etc.) — that's the assistant explaining why it
    // can't do something, not a crash.
    result.reply = err instanceof ApiError ? err.message : "Something went wrong and I couldn't finish that — try again.";
  }

  return result;
}

async function runIntent(
  actor: Actor,
  intent: string,
  text: string,
  attachedFile: AttachedFile | undefined,
  result: AssistantResult
): Promise<void> {
  switch (intent) {
    case 'create_task': {
      const title = extractPayloadText(text);
      if (!title) {
        result.reply = "What should the task be about? For example: \"create a task to call the client tomorrow, high priority\".";
        break;
      }
      const priority = extractPriority(text);
      const dueDate = extractDate(text) ?? undefined;
      const created = await taskService.createTask(actor, { title, priority, dueDate });
      result.createdTaskId = created._id.toString();
      result.reply = `Created the task "${created.title}"${dueDate ? ` for ${dueDate}` : ''}${priority !== 'Medium' ? ` (${priority} priority)` : ''}.`;
      break;
    }

    case 'complete_task': {
      const query = extractPayloadText(text);
      if (!query) {
        result.reply = 'Which task should I mark as complete?';
        break;
      }
      const { tasks } = await taskService.listTasks(actor, { search: query, completed: false, scope: 'all', limit: 5 });
      if (tasks.length === 0) {
        result.reply = `I couldn't find an open task matching "${query}".`;
        break;
      }
      if (tasks.length > 1) {
        result.reply = `A few tasks match "${query}": ${tasks.map((t) => `"${t.title}"`).join(', ')}. Which one did you mean?`;
        break;
      }
      const updated = await taskService.updateTask(actor, tasks[0]._id.toString(), { completed: true });
      result.completedTaskId = updated._id.toString();
      result.reply = `Marked "${updated.title}" as complete. ✅`;
      break;
    }

    case 'delete_task': {
      const query = extractPayloadText(text);
      if (!query) {
        result.reply = 'Which task should I delete?';
        break;
      }
      const { tasks } = await taskService.listTasks(actor, { search: query, scope: 'all', limit: 5 });
      if (tasks.length === 0) {
        result.reply = `I couldn't find a task matching "${query}".`;
        break;
      }
      if (tasks.length > 1) {
        result.reply = `A few tasks match "${query}": ${tasks.map((t) => `"${t.title}"`).join(', ')}. Which one should I delete?`;
        break;
      }
      const target = tasks[0];
      await taskService.deleteTask(actor, target._id.toString());
      result.deletedTaskTitle = target.title;
      result.reply = `Deleted the task "${target.title}".`;
      break;
    }

    case 'schedule_meeting': {
      const title = extractPayloadText(text) || 'Meeting';
      const dateStr = extractDate(text) ?? new Date().toISOString().slice(0, 10);
      const time = extractTime(text);
      const roster = await getTeamRoster(actor.companyId);
      const attendees = findAllMentionedMembers(text, roster);

      const startTime = combineDateAndTime(dateStr, time);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      const meeting = await meetingService.createMeeting(actor, {
        title,
        startTime,
        endTime,
        attendees: attendees.map((a) => a._id),
      });
      result.scheduledMeetingId = meeting._id.toString();
      const timeLabel = startTime.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      result.reply = `Scheduled "${meeting.title}" for ${timeLabel}${attendees.length ? ` with ${attendees.map((a) => a.name).join(', ')}` : ''}. You can adjust the time on the Meetings page if I got it wrong.`;
      break;
    }

    case 'send_message': {
      const roster = await getTeamRoster(actor.companyId);
      const member = findMentionedMember(text, roster);
      if (!member) {
        result.reply = "I couldn't tell who to message — mention their name clearly, e.g. \"message Ali that the client call moved to 3pm\".";
        break;
      }
      const messageText = extractMessageText(text, member.name);
      if (!messageText) {
        result.reply = `What should I tell ${member.name}?`;
        break;
      }
      const channelId = chatService.buildDmChannelId(actor.userId, member._id);
      await chatService.sendMessage(actor, channelId, messageText);
      result.messagedChannelId = channelId;
      result.reply = `Sent to ${member.name}: "${messageText}"`;
      break;
    }

    case 'send_file': {
      const roster = await getTeamRoster(actor.companyId);
      const member = findMentionedMember(text, roster);
      if (!member) {
        result.reply = "I couldn't tell who to send the file to — mention their name clearly, e.g. \"send this file to Ali\".";
        break;
      }
      if (!attachedFile) {
        result.reply = 'Attach a file first (the paperclip button), then tell me who to send it to.';
        break;
      }
      const channelId = chatService.buildDmChannelId(actor.userId, member._id);
      const caption = extractMessageText(text, member.name);
      await chatService.sendMessage(actor, channelId, caption, attachedFile);
      result.messagedChannelId = channelId;
      result.sentFileId = attachedFile.fileId;
      result.reply = `Sent ${attachedFile.fileName} to ${member.name}.`;
      break;
    }

    case 'clock_in': {
      const record = await attendanceService.clockIn(actor);
      result.attendanceAction = 'clock_in';
      result.reply = `Clocked you in${record.status === 'late' ? ' (marked late)' : ''}. Have a good day!`;
      break;
    }

    case 'clock_out': {
      await attendanceService.clockOut(actor);
      result.attendanceAction = 'clock_out';
      result.reply = 'Clocked you out for today. See you tomorrow!';
      break;
    }

    case 'show_tasks': {
      const stats = await taskService.getStats(actor);
      result.reply = `You have ${stats.pending} pending task${stats.pending === 1 ? '' : 's'} (${stats.total} total, ${stats.completed} completed)${stats.overdue ? `, and ${stats.overdue} overdue` : ''}.`;
      break;
    }

    case 'show_overdue': {
      const today = new Date().toISOString().slice(0, 10);
      const overdue = await Task.find({
        companyId: actor.companyId,
        completed: false,
        dueDate: { $ne: '', $lt: today },
        $or: [{ createdBy: actor.userId }, { assigneeId: actor.userId }],
      })
        .select('title dueDate')
        .limit(10);
      result.reply =
        overdue.length === 0
          ? "Nothing overdue — you're all caught up."
          : `Overdue: ${overdue.map((t) => `"${t.title}" (was due ${t.dueDate})`).join(', ')}.`;
      break;
    }

    case 'show_leave_balance': {
      const balance = await getBalance(actor, actor.userId);
      result.reply = balance
        .filter((b) => b.allocated !== null)
        .map((b) => `${b.leaveType}: ${b.remaining}/${b.allocated} days left`)
        .join(', ');
      break;
    }

    default: {
      result.reply =
        "I can create tasks, mark them complete, delete them, schedule meetings, message teammates, send files, and mark your attendance. Try something like \"create a task to...\" or \"attendance laga do\".";
    }
  }
}
