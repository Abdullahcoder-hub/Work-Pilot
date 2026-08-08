import { Project, IProject, ProjectStatus, ProjectColor } from './project.model';
import { Department } from '../department/department.model';
import { User, Role } from '../user/user.model';
import { Task } from '../task/task.model';
import { ApiError } from '../../utils/ApiError';

interface Actor {
  userId: string;
  role: Role;
  companyId: string;
}

const CAN_MANAGE_PROJECTS: Role[] = ['company_admin', 'team_lead'];

async function assertMembersBelongToCompany(companyId: string, memberIds: string[]) {
  if (memberIds.length === 0) return;
  const count = await User.countDocuments({ _id: { $in: memberIds }, companyId });
  if (count !== memberIds.length) {
    throw ApiError.badRequest('One or more members do not belong to this company');
  }
}

async function assertDepartmentBelongsToCompany(companyId: string, departmentId?: string) {
  if (!departmentId) return;
  const dept = await Department.findOne({ _id: departmentId, companyId });
  if (!dept) throw ApiError.badRequest('Department not found in this company');
}

export async function listProjects(actor: Actor) {
  const query = CAN_MANAGE_PROJECTS.includes(actor.role)
    ? { companyId: actor.companyId }
    : { companyId: actor.companyId, $or: [{ members: actor.userId }, { ownerId: actor.userId }] };

  const projects = await Project.find(query)
    .sort({ createdAt: -1 })
    .populate('ownerId', 'name email')
    .populate('members', 'name email')
    .populate('departmentId', 'name');

  const withTaskCounts = await Promise.all(
    projects.map(async (project) => {
      const [taskCount, doneCount] = await Promise.all([
        Task.countDocuments({ projectId: project._id }),
        Task.countDocuments({ projectId: project._id, status: 'done' }),
      ]);
      return { ...project.toJSON(), taskCount, doneCount };
    })
  );

  return withTaskCounts;
}

async function findAccessibleProject(actor: Actor, projectId: string): Promise<IProject> {
  const project = await Project.findOne({ _id: projectId, companyId: actor.companyId });
  if (!project) throw ApiError.notFound('Project not found');

  const isMember = project.members.some((m) => m.toString() === actor.userId);
  const isOwner = project.ownerId.toString() === actor.userId;
  const canManage = CAN_MANAGE_PROJECTS.includes(actor.role);

  if (!isMember && !isOwner && !canManage) {
    throw ApiError.forbidden('You do not have access to this project');
  }
  return project;
}

export async function getProjectById(actor: Actor, projectId: string) {
  const project = await findAccessibleProject(actor, projectId);
  return Project.findById(project._id)
    .populate('ownerId', 'name email')
    .populate('members', 'name email')
    .populate('departmentId', 'name');
}

interface CreateProjectInput {
  name: string;
  description?: string;
  departmentId?: string;
  status?: ProjectStatus;
  color?: ProjectColor;
  members?: string[];
  startDate?: string;
  dueDate?: string;
}

export async function createProject(actor: Actor, input: CreateProjectInput) {
  if (!CAN_MANAGE_PROJECTS.includes(actor.role)) {
    throw ApiError.forbidden('Only company admins and team leads can create projects');
  }

  await assertDepartmentBelongsToCompany(actor.companyId, input.departmentId);
  const memberIds = Array.from(new Set([...(input.members ?? []), actor.userId]));
  await assertMembersBelongToCompany(actor.companyId, memberIds);

  return Project.create({
    companyId: actor.companyId,
    departmentId: input.departmentId ?? null,
    name: input.name,
    description: input.description ?? '',
    status: input.status ?? 'planning',
    color: input.color ?? 'brand',
    ownerId: actor.userId,
    members: memberIds,
    startDate: input.startDate ?? '',
    dueDate: input.dueDate ?? '',
  });
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  departmentId?: string | null;
  status?: ProjectStatus;
  color?: ProjectColor;
  startDate?: string;
  dueDate?: string;
}

export async function updateProject(actor: Actor, projectId: string, input: UpdateProjectInput) {
  const project = await findAccessibleProject(actor, projectId);
  const isOwner = project.ownerId.toString() === actor.userId;
  if (!CAN_MANAGE_PROJECTS.includes(actor.role) && !isOwner) {
    throw ApiError.forbidden('Only the project owner, a team lead, or a company admin can edit this project');
  }

  if (input.departmentId !== undefined && input.departmentId !== null) {
    await assertDepartmentBelongsToCompany(actor.companyId, input.departmentId);
  }

  if (input.name !== undefined) project.name = input.name;
  if (input.description !== undefined) project.description = input.description;
  if (input.status !== undefined) project.status = input.status;
  if (input.color !== undefined) project.color = input.color;
  if (input.startDate !== undefined) project.startDate = input.startDate;
  if (input.dueDate !== undefined) project.dueDate = input.dueDate;
  if (input.departmentId !== undefined) {
    project.departmentId = input.departmentId ? (input.departmentId as unknown as typeof project.departmentId) : null;
  }

  await project.save();
  return project;
}

export async function deleteProject(actor: Actor, projectId: string) {
  const project = await findAccessibleProject(actor, projectId);
  const isOwner = project.ownerId.toString() === actor.userId;
  if (!CAN_MANAGE_PROJECTS.includes(actor.role) && !isOwner) {
    throw ApiError.forbidden('Only the project owner, a team lead, or a company admin can delete this project');
  }

  const taskCount = await Task.countDocuments({ projectId });
  if (taskCount > 0) {
    throw ApiError.badRequest(`Cannot delete a project with ${taskCount} task(s) still in it. Move or delete them first.`);
  }

  await project.deleteOne();
}

export async function addMember(actor: Actor, projectId: string, userId: string) {
  const project = await findAccessibleProject(actor, projectId);
  const isOwner = project.ownerId.toString() === actor.userId;
  if (!CAN_MANAGE_PROJECTS.includes(actor.role) && !isOwner) {
    throw ApiError.forbidden('Only the project owner, a team lead, or a company admin can manage members');
  }
  await assertMembersBelongToCompany(actor.companyId, [userId]);

  if (!project.members.some((m) => m.toString() === userId)) {
    project.members.push(userId as unknown as (typeof project.members)[number]);
    await project.save();
  }
  return project;
}

export async function removeMember(actor: Actor, projectId: string, userId: string) {
  const project = await findAccessibleProject(actor, projectId);
  const isOwner = project.ownerId.toString() === actor.userId;
  if (!CAN_MANAGE_PROJECTS.includes(actor.role) && !isOwner) {
    throw ApiError.forbidden('Only the project owner, a team lead, or a company admin can manage members');
  }
  if (userId === project.ownerId.toString()) {
    throw ApiError.badRequest('Cannot remove the project owner from its member list');
  }

  project.members = project.members.filter((m) => m.toString() !== userId) as typeof project.members;
  await project.save();
  return project;
}
