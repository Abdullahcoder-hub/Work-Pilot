import { ActivityLog, ActivityAction } from './activityLog.model';

interface LogInput {
  companyId: string;
  taskId: string;
  actorId: string;
  action: ActivityAction;
  message: string;
}

/** Records a timeline entry. Best-effort — never blocks the task action that triggered it. */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await ActivityLog.create(input);
  } catch {
    // Swallow — the timeline is a nice-to-have, not a source of truth.
  }
}

export async function listActivity(companyId: string, taskId: string) {
  return ActivityLog.find({ companyId, taskId })
    .sort({ createdAt: 1 })
    .populate('actorId', 'name email');
}

/** Recent activity across the whole company, newest first — powers the
 * company-wide Activity Logs page (managers only). */
export async function listCompanyActivity(companyId: string, limit = 50) {
  return ActivityLog.find({ companyId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actorId', 'name email')
    .populate('taskId', 'title');
}
