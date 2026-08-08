import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as projectService from './project.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const projects = await projectService.listProjects(actor);
  res.status(200).json({ success: true, data: projects });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const project = await projectService.getProjectById(actor, req.params.id);
  res.status(200).json({ success: true, data: project });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const project = await projectService.createProject(actor, req.body);
  res.status(201).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const project = await projectService.updateProject(actor, req.params.id, req.body);
  res.status(200).json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await projectService.deleteProject(actor, req.params.id);
  res.status(200).json({ success: true, message: 'Project deleted' });
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const project = await projectService.addMember(actor, req.params.id, req.body.userId);
  res.status(200).json({ success: true, data: project });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const project = await projectService.removeMember(actor, req.params.id, req.body.userId);
  res.status(200).json({ success: true, data: project });
});
