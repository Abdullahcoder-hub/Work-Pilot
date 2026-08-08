import { Company } from './company.model';
import { User } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';

interface Actor {
  companyId: string;
}

export async function getMyCompany(actor: Actor) {
  const company = await Company.findById(actor.companyId);
  if (!company) throw ApiError.notFound('Company not found');

  const seatsUsed = await User.countDocuments({ companyId: actor.companyId });

  return { ...company.toJSON(), seatsUsed };
}

interface UpdateCompanyInput {
  name?: string;
}

export async function updateMyCompany(actor: Actor, input: UpdateCompanyInput) {
  const company = await Company.findById(actor.companyId);
  if (!company) throw ApiError.notFound('Company not found');

  if (input.name !== undefined) company.name = input.name;

  await company.save();
  return company;
}
