import { FilterQuery, Types, HydratedDocument } from 'mongoose';
import { Task, ITask, TaskStatus } from './task.model';
import { User, Role } from '../user/user.model';
import { Project } from '../project/project.model';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notification/notification.service';
import { logActivity, listActivity } from '../activity/activityLog.service';
import { getIO } from '../../realtime/io';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const CAN_SEE_ALL_COMPANY_TASKS: Role[] = ['company_admin', 'team_lead'];
const CAN_ASSIGN_TO_OTHERS: Role[] = ['company_admin', 'team_lead'];

/** Tells every other connected client viewing this project's board to refetch. */
function broadcastBoardChange(companyId: string, projectId: Types.ObjectId | string | null | undefined): void {
  if (!projectId) return;
  getIO()?.to(`project:${companyId}:${projectId}`).emit('board:changed');
}

async function assertProjectAccess(actor: Actor, projectId: string) {
  const project = await Project.findOne({ _id: projectId, companyId: actor.companyId });
  if (!project) throw ApiError.badRequest('Project not found in this company');

  const isMember = project.members.some((m) => m.toString() === actor.userId);
  const isOwner = project.ownerId.toString() === actor.userId;
  const canManage = CAN_SEE_ALL_COMPANY_TASKS.includes(actor.role);

  if (!isMember && !isOwner && !canManage) {
    throw ApiError.forbidden('You are not a member of this project');
  }
  return project;
}

function syncCompletionWithStatus(task: HydratedDocument<ITask>, status: TaskStatus) {
  task.status = status;
  task.completed = status === 'done';
  task.completedAt = task.completed ? new Date() : null;
  if (!task.completed) {
    task.approvedBy = null;
    task.approvedAt = null;
  }
}

function syncStatusWithCompletion(task: HydratedDocument<ITask>, completed: boolean) {
  task.completed = completed;
  task.completedAt = completed ? new Date() : null;
  if (completed) {
    task.status = 'done';
  } else if (task.status === 'done') {
    task.status = 'todo';
  }
  if (!completed) {
    task.approvedBy = null;
    task.approvedAt = null;
  }
}

/** Resolves a user's first name (or full name) for short activity/notification copy. */
async function actorName(userId: string): Promise<string> {
  const user = await User.findById(userId).select('name');
  return user?.name ?? 'Someone';
}

/** Company_admin + team_lead are the people who should hear about completions needing review. */
async function findManagersToNotify(companyId: string, excludeUserId: string): Promise<string[]> {
  const managers = await User.find({
    companyId,
    role: { $in: ['company_admin', 'team_lead'] },
    _id: { $ne: excludeUserId },
    isActive: true,
  }).select('_id');
  return managers.map((m) => m._id.toString());
}

interface ListTasksInput {
  category?: string;
  priority?: string;
  completed?: boolean;
  status?: TaskStatus;
  projectId?: string;
  scope?: 'mine' | 'assigned' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export async function listTasks(actor: Actor, filters: ListTasksInput) {
  const query: FilterQuery<ITask> = { companyId: actor.companyId };

  if (filters.projectId) {
    await assertProjectAccess(actor, filters.projectId);
    query.projectId = filters.projectId;
  }

  const scope = filters.scope ?? 'all';
  if (scope === 'mine') {
    query.createdBy = actor.userId;
  } else if (scope === 'assigned') {
    query.assigneeId = actor.userId;
  } else if (scope === 'all' && !filters.projectId && !CAN_SEE_ALL_COMPANY_TASKS.includes(actor.role)) {
    // Employees requesting 'all' outside a specific project are narrowed to
    // what they're allowed to see, rather than rejected. Inside a project
    // they already passed the membership check above, so no narrowing there
    // (a project member should see the whole board).
    query.$or = [{ createdBy: actor.userId }, { assigneeId: actor.userId }];
  }

  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;
  if (filters.status) query.status = filters.status;
  if (typeof filters.completed === 'boolean') query.completed = filters.completed;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? (filters.projectId ? 500 : 20);

  const sort: Record<string, 1 | -1> = filters.projectId ? { order: 1 } : { pinned: -1, createdAt: -1 };

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assigneeId', 'name email')
      .populate('createdBy', 'name email'),
    Task.countDocuments(query),
  ]);

  return {
    tasks,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function findVisibleTask(actor: Actor, taskId: string): Promise<HydratedDocument<ITask>> {
  const task = await Task.findOne({ _id: taskId, companyId: actor.companyId });
  if (!task) throw ApiError.notFound('Task not found');

  const isOwner = task.createdBy.toString() === actor.userId;
  const isAssignee = task.assigneeId?.toString() === actor.userId;
  const canSeeAll = CAN_SEE_ALL_COMPANY_TASKS.includes(actor.role);

  let hasProjectAccess = false;
  if (task.projectId) {
    const project = await Project.findById(task.projectId);
    hasProjectAccess = !!project && (project.members.some((m) => m.toString() === actor.userId) || project.ownerId.toString() === actor.userId);
  }

  if (!isOwner && !isAssignee && !canSeeAll && !hasProjectAccess) {
    throw ApiError.forbidden('You do not have access to this task');
  }
  return task as HydratedDocument<ITask>;
}

export async function getTaskById(actor: Actor, taskId: string) {
  return findVisibleTask(actor, taskId);
}

interface CreateTaskInput {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
  projectId?: string;
  status?: TaskStatus;
}

export async function createTask(actor: Actor, input: CreateTaskInput) {
  let assigneeId: string | null = null;

  if (input.assigneeId) {
    if (input.assigneeId !== actor.userId && !CAN_ASSIGN_TO_OTHERS.includes(actor.role)) {
      throw ApiError.forbidden('You can only assign tasks to yourself');
    }
    const assignee = await User.findOne({ _id: input.assigneeId, companyId: actor.companyId });
    if (!assignee) throw ApiError.badRequest('Assignee not found in this company');
    assigneeId = input.assigneeId;
  }

  let projectId: string | null = null;
  let order = 0;
  const status: TaskStatus = input.status ?? 'todo';

  if (input.projectId) {
    await assertProjectAccess(actor, input.projectId);
    projectId = input.projectId;
    const lastInColumn = await Task.findOne({ projectId, status }).sort({ order: -1 }).select('order');
    order = lastInColumn ? lastInColumn.order + 1 : 0;
  }

  const task = await Task.create({
    companyId: actor.companyId,
    projectId,
    createdBy: actor.userId,
    userId: actor.userId,
    assigneeId,
    title: input.title,
    description: input.description ?? '',
    category: input.category ?? 'Work',
    priority: input.priority ?? 'Medium',
    status,
    order,
    completed: status === 'done',
    completedAt: status === 'done' ? new Date() : null,
    dueDate: input.dueDate ?? '',
  });

  const creatorName = await actorName(actor.userId);

  if (assigneeId && assigneeId !== actor.userId) {
    await Promise.all([
      logActivity({
        companyId: actor.companyId,
        taskId: task._id.toString(),
        actorId: actor.userId,
        action: 'task_assigned',
        message: `${creatorName} assigned "${task.title}"`,
      }),
      notify({
        companyId: actor.companyId,
        recipientId: assigneeId,
        actorId: actor.userId,
        type: 'task_assigned',
        title: 'New task assigned to you',
        message: `${creatorName} assigned you "${task.title}"`,
        taskId: task._id.toString(),
      }),
    ]);
  } else {
    await logActivity({
      companyId: actor.companyId,
      taskId: task._id.toString(),
      actorId: actor.userId,
      action: 'task_created',
      message: `${creatorName} created "${task.title}"`,
    });
  }

  broadcastBoardChange(actor.companyId, task.projectId);
  return task;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string | null;
  projectId?: string | null;
  status?: TaskStatus;
  completed?: boolean;
  pinned?: boolean;
}

export async function updateTask(actor: Actor, taskId: string, input: UpdateTaskInput) {
  const task = await findVisibleTask(actor, taskId);

  const isOwner = task.createdBy.toString() === actor.userId;
  const isAssigneeOnly = !isOwner && task.assigneeId?.toString() === actor.userId;
  const isManager = CAN_SEE_ALL_COMPANY_TASKS.includes(actor.role);

  // An assignee who didn't create the task may only toggle completion/status —
  // they can't rewrite the task's content or reassign it.
  if (isAssigneeOnly && !isManager) {
    const allowedKeys = new Set(['completed', 'status']);
    const attemptedKeys = Object.keys(input);
    const disallowed = attemptedKeys.filter((k) => !allowedKeys.has(k));
    if (disallowed.length > 0) {
      throw ApiError.forbidden(`As an assignee (not the owner), you can only update: ${Array.from(allowedKeys).join(', ')}`);
    }
  }

  if (input.assigneeId !== undefined && input.assigneeId !== null && input.assigneeId !== actor.userId) {
    if (!CAN_ASSIGN_TO_OTHERS.includes(actor.role)) {
      throw ApiError.forbidden('You can only assign tasks to yourself');
    }
    const assignee = await User.findOne({ _id: input.assigneeId, companyId: actor.companyId });
    if (!assignee) throw ApiError.badRequest('Assignee not found in this company');
  }

  if (input.projectId !== undefined && input.projectId !== null) {
    await assertProjectAccess(actor, input.projectId);
  }

  const prevAssigneeId = task.assigneeId ? task.assigneeId.toString() : null;
  const wasCompleted = task.completed;

  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description;
  if (input.category !== undefined) task.category = input.category as ITask['category'];
  if (input.priority !== undefined) task.priority = input.priority as ITask['priority'];
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;
  if (input.assigneeId !== undefined) {
    task.assigneeId = input.assigneeId ? new Types.ObjectId(input.assigneeId) : null;
  }
  if (input.projectId !== undefined) {
    task.projectId = input.projectId ? new Types.ObjectId(input.projectId) : null;
  }
  if (input.pinned !== undefined) task.pinned = input.pinned;

  // status and completed are two views of the same state — whichever the
  // caller sent last wins, and the other field is derived from it.
  if (input.status !== undefined) {
    syncCompletionWithStatus(task, input.status);
  } else if (input.completed !== undefined) {
    syncStatusWithCompletion(task, input.completed);
  }

  await task.save();
  await handleTaskChangeEffects(actor, task, prevAssigneeId, wasCompleted);
  broadcastBoardChange(actor.companyId, task.projectId);
  return task;
}

/**
 * Shared side-effects for anything that changes a task's assignee or
 * completion state (updateTask, moveTask): writes the activity-timeline
 * entry and fires the relevant in-app notification. Best-effort — never
 * throws back into the caller.
 */
async function handleTaskChangeEffects(
  actor: Actor,
  task: ITask,
  prevAssigneeId: string | null,
  wasCompleted: boolean
): Promise<void> {
  const actingName = await actorName(actor.userId);
  const newAssigneeId = task.assigneeId ? task.assigneeId.toString() : null;

  if (newAssigneeId && newAssigneeId !== prevAssigneeId) {
    await Promise.all([
      logActivity({
        companyId: actor.companyId,
        taskId: task._id.toString(),
        actorId: actor.userId,
        action: 'task_reassigned',
        message: `${actingName} assigned "${task.title}"`,
      }),
      notify({
        companyId: actor.companyId,
        recipientId: newAssigneeId,
        actorId: actor.userId,
        type: 'task_assigned',
        title: 'A task was assigned to you',
        message: `${actingName} assigned you "${task.title}"`,
        taskId: task._id.toString(),
      }),
    ]);
  }

  if (!wasCompleted && task.completed) {
    const creatorId = task.createdBy.toString();
    const managerIds = await findManagersToNotify(actor.companyId, actor.userId);
    const recipients = new Set([creatorId, ...managerIds]);
    recipients.delete(actor.userId);

    await Promise.all([
      logActivity({
        companyId: actor.companyId,
        taskId: task._id.toString(),
        actorId: actor.userId,
        action: 'task_completed',
        message: `${actingName} completed "${task.title}"`,
      }),
      ...[...recipients].map((recipientId) =>
        notify({
          companyId: actor.companyId,
          recipientId,
          actorId: actor.userId,
          type: 'task_completed',
          title: 'Task completed',
          message: `${actingName} completed "${task.title}"`,
          taskId: task._id.toString(),
        })
      ),
    ]);
  } else if (wasCompleted && !task.completed) {
    await logActivity({
      companyId: actor.companyId,
      taskId: task._id.toString(),
      actorId: actor.userId,
      action: 'task_reopened',
      message: `${actingName} reopened "${task.title}"`,
    });
  }
}

interface MoveTaskInput {
  status: TaskStatus;
  index: number;
}

/**
 * Repositions a task on its project's Kanban board: moves it into `status`
 * at position `index`, and resequences the `order` field for every other
 * task in the affected column(s) so drag-and-drop stays consistent.
 */
export async function moveTask(actor: Actor, taskId: string, input: MoveTaskInput) {
  const task = await findVisibleTask(actor, taskId);
  if (!task.projectId) {
    throw ApiError.badRequest('Only tasks that belong to a project can be moved on a board');
  }

  const projectId = task.projectId;
  const fromStatus = task.status;
  const toStatus = input.status;
  const wasCompleted = task.completed;
  const prevAssigneeId = task.assigneeId ? task.assigneeId.toString() : null;

  const columnTasks = await Task.find({ projectId, status: toStatus, _id: { $ne: task._id } }).sort({ order: 1 });

  const clampedIndex = Math.max(0, Math.min(input.index, columnTasks.length));
  columnTasks.splice(clampedIndex, 0, task as (typeof columnTasks)[number]);

  const bulkOps = columnTasks
    .map((t, idx) => ({ id: t._id.toString(), order: idx }))
    .filter((entry) => entry.id !== task._id.toString())
    .map((entry) => ({
      updateOne: {
        filter: { _id: entry.id },
        update: { $set: { order: entry.order } },
      },
    }));

  task.order = clampedIndex;
  syncCompletionWithStatus(task, toStatus);
  await task.save();

  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }

  if (fromStatus !== toStatus) {
    // Resequence the column the task left, closing the gap it left behind.
    const remaining = await Task.find({ projectId, status: fromStatus }).sort({ order: 1 });
    await Task.bulkWrite(
      remaining.map((t, idx) => ({
        updateOne: { filter: { _id: t._id }, update: { $set: { order: idx } } },
      }))
    );
  }

  if (fromStatus !== toStatus) {
    await handleTaskChangeEffects(actor, task, prevAssigneeId, wasCompleted);
  }

  broadcastBoardChange(actor.companyId, projectId);
  return task;
}

export async function deleteTask(actor: Actor, taskId: string) {
  const task = await findVisibleTask(actor, taskId);
  const isOwner = task.createdBy.toString() === actor.userId;
  const isManager = CAN_SEE_ALL_COMPANY_TASKS.includes(actor.role);

  if (!isOwner && !isManager) {
    throw ApiError.forbidden('Only the task owner or a team lead/admin can delete this task');
  }

  await task.deleteOne();
  broadcastBoardChange(actor.companyId, task.projectId);
}

const CAN_APPROVE_TASKS: Role[] = ['company_admin', 'team_lead'];

/** A manager reviews a completed task and marks it approved. Completes the
 * "Ali assigned → Sara completed → Lead approved" timeline. */
export async function approveTask(actor: Actor, taskId: string) {
  if (!CAN_APPROVE_TASKS.includes(actor.role)) {
    throw ApiError.forbidden('Only a team lead or company admin can approve a task');
  }

  const task = await findVisibleTask(actor, taskId);
  if (!task.completed) {
    throw ApiError.badRequest('Only a completed task can be approved');
  }
  if (task.approvedBy) {
    throw ApiError.conflict('This task has already been approved');
  }

  task.approvedBy = new Types.ObjectId(actor.userId);
  task.approvedAt = new Date();
  await task.save();

  const approverName = await actorName(actor.userId);
  const recipients = new Set([task.createdBy.toString(), ...(task.assigneeId ? [task.assigneeId.toString()] : [])]);
  recipients.delete(actor.userId);

  await Promise.all([
    logActivity({
      companyId: actor.companyId,
      taskId: task._id.toString(),
      actorId: actor.userId,
      action: 'task_approved',
      message: `${approverName} approved "${task.title}"`,
    }),
    ...[...recipients].map((recipientId) =>
      notify({
        companyId: actor.companyId,
        recipientId,
        actorId: actor.userId,
        type: 'task_approved',
        title: 'Task approved',
        message: `${approverName} approved "${task.title}"`,
        taskId: task._id.toString(),
      })
    ),
  ]);

  return task;
}

export async function getTaskActivity(actor: Actor, taskId: string) {
  await findVisibleTask(actor, taskId); // enforces access before returning the timeline
  return listActivity(actor.companyId, taskId);
}

export async function getStats(actor: Actor) {
  const baseQuery: FilterQuery<ITask> = { companyId: actor.companyId };
  if (!CAN_SEE_ALL_COMPANY_TASKS.includes(actor.role)) {
    baseQuery.$or = [{ createdBy: actor.userId }, { assigneeId: actor.userId }];
  }

  const [total, completed, highPriority, overdue] = await Promise.all([
    Task.countDocuments(baseQuery),
    Task.countDocuments({ ...baseQuery, completed: true }),
    Task.countDocuments({ ...baseQuery, priority: 'High', completed: false }),
    Task.countDocuments({
      ...baseQuery,
      completed: false,
      dueDate: { $ne: '', $lt: new Date().toISOString().slice(0, 10) },
    }),
  ]);

  return { total, completed, pending: total - completed, highPriority, overdue };
}
