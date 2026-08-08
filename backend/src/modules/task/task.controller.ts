import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as taskService from './task.service';
import { TaskStatus } from './task.model';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden('This endpoint requires a company-scoped account');
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { category, priority, status, projectId, completed, scope, search, page, limit } = req.query;
  const result = await taskService.listTasks(actor, {
    category: category as string | undefined,
    priority: priority as string | undefined,
    status: status as TaskStatus | undefined,
    projectId: projectId as string | undefined,
    completed: completed === undefined ? undefined : completed === 'true',
    scope: scope as 'mine' | 'assigned' | 'all' | undefined,
    search: search as string | undefined,
    page: page as unknown as number | undefined,
    limit: limit as unknown as number | undefined,
  });
  res.status(200).json({ success: true, data: result.tasks, pagination: result.pagination });
});

export const moveTask = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const task = await taskService.moveTask(actor, req.params.id, { status: req.body.status, index: req.body.index });
  res.status(200).json({ success: true, data: task });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const stats = await taskService.getStats(actor);
  res.status(200).json({ success: true, data: stats });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const task = await taskService.getTaskById(actor, req.params.id);
  res.status(200).json({ success: true, data: task });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const task = await taskService.createTask(actor, req.body);
  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const task = await taskService.updateTask(actor, req.params.id, req.body);
  res.status(200).json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await taskService.deleteTask(actor, req.params.id);
  res.status(200).json({ success: true, message: 'Task deleted' });
});

export const approveTask = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const task = await taskService.approveTask(actor, req.params.id);
  res.status(200).json({ success: true, data: task });
});

export const getTaskActivity = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const activity = await taskService.getTaskActivity(actor, req.params.id);
  res.status(200).json({ success: true, data: activity });
});
