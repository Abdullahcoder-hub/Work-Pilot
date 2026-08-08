import { Company } from '../company/company.model';
import { User } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';

export async function listCompanies(page = 1, limit = 20) {
  const [companies, total] = await Promise.all([
    Company.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Company.countDocuments(),
  ]);

  const withCounts = await Promise.all(
    companies.map(async (company) => ({
      ...company.toJSON(),
      userCount: await User.countDocuments({ companyId: company._id }),
    }))
  );

  return { companies: withCounts, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getCompany(companyId: string) {
  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');
  const userCount = await User.countDocuments({ companyId });
  return { ...company.toJSON(), userCount };
}

export async function setCompanyStatus(companyId: string, status: 'active' | 'suspended') {
  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');
  company.status = status;
  await company.save();
  return company;
}

export async function setCompanyPlan(companyId: string, plan: 'free' | 'pro' | 'enterprise', seatLimit?: number) {
  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');
  company.plan = plan;
  if (typeof seatLimit === 'number') company.seatLimit = seatLimit;
  await company.save();
  return company;
}
