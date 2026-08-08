import { Department } from './department.model';
import { User } from '../user/user.model';
import { Project } from '../project/project.model';
import { ApiError } from '../../utils/ApiError';

interface Actor {
  userId: string;
  companyId: string;
}

interface CreateDepartmentInput {
  name: string;
  description?: string;
  headUserId?: string;
}

async function assertHeadBelongsToCompany(companyId: string, headUserId?: string) {
  if (!headUserId) return;
  const head = await User.findOne({ _id: headUserId, companyId });
  if (!head) throw ApiError.badRequest('Department head must belong to this company');
}

export async function listDepartments(companyId: string) {
  const departments = await Department.find({ companyId }).sort({ name: 1 }).populate('headUserId', 'name email');

  const withCounts = await Promise.all(
    departments.map(async (dept) => ({
      ...dept.toJSON(),
      projectCount: await Project.countDocuments({ departmentId: dept._id }),
    }))
  );

  return withCounts;
}

export async function createDepartment(actor: Actor, input: CreateDepartmentInput) {
  await assertHeadBelongsToCompany(actor.companyId, input.headUserId);

  const existing = await Department.findOne({ companyId: actor.companyId, name: input.name });
  if (existing) throw ApiError.conflict('A department with this name already exists');

  return Department.create({
    companyId: actor.companyId,
    name: input.name,
    description: input.description ?? '',
    headUserId: input.headUserId ?? null,
    createdBy: actor.userId,
  });
}

interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  headUserId?: string | null;
}

export async function updateDepartment(actor: Actor, departmentId: string, input: UpdateDepartmentInput) {
  const department = await Department.findOne({ _id: departmentId, companyId: actor.companyId });
  if (!department) throw ApiError.notFound('Department not found');

  if (input.headUserId !== undefined && input.headUserId !== null) {
    await assertHeadBelongsToCompany(actor.companyId, input.headUserId);
  }

  if (input.name !== undefined && input.name !== department.name) {
    const clash = await Department.findOne({ companyId: actor.companyId, name: input.name, _id: { $ne: departmentId } });
    if (clash) throw ApiError.conflict('A department with this name already exists');
    department.name = input.name;
  }
  if (input.description !== undefined) department.description = input.description;
  if (input.headUserId !== undefined) {
    department.headUserId = input.headUserId ? (input.headUserId as unknown as typeof department.headUserId) : null;
  }

  await department.save();
  return department;
}

export async function deleteDepartment(actor: Actor, departmentId: string) {
  const department = await Department.findOne({ _id: departmentId, companyId: actor.companyId });
  if (!department) throw ApiError.notFound('Department not found');

  const projectCount = await Project.countDocuments({ departmentId });
  if (projectCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete a department with ${projectCount} project(s) still assigned to it. Reassign or archive them first.`
    );
  }

  await department.deleteOne();
}
