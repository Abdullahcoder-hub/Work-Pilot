import { User } from './user.model';
import { ApiError } from '../../utils/ApiError';
import { hasStrongPassword } from '../auth/auth.validation';

export async function listCompanyUsers(companyId: string) {
  return User.find({ companyId }).sort({ createdAt: -1 });
}

export async function setUserActive(companyId: string, userId: string, isActive: boolean, requesterId: string) {
  if (userId === requesterId && !isActive) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  const user = await User.findOne({ _id: userId, companyId });
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'company_admin' && !isActive) {
    const otherAdmins = await User.countDocuments({ companyId, role: 'company_admin', isActive: true, _id: { $ne: userId } });
    if (otherAdmins === 0) {
      throw ApiError.badRequest('Cannot deactivate the last active company admin');
    }
  }
  user.isActive = isActive;
  await user.save();
  return user;
}

interface UpdateProfileInput {
  name?: string;
}

export async function updateOwnProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (input.name !== undefined) user.name = input.name;

  await user.save();
  return user;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changeOwnPassword(userId: string, input: ChangePasswordInput) {
  if (!hasStrongPassword(input.newPassword)) {
    throw ApiError.badRequest(
      'New password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
    );
  }

  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const valid = await user.comparePassword(input.currentPassword);
  if (!valid) throw ApiError.unauthorized('Current password is incorrect');

  user.password = input.newPassword;
  await user.save();
}
