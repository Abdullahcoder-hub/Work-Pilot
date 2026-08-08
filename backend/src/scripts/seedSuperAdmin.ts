import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../modules/user/user.model';
import { logger } from '../utils/logger';

async function seedSuperAdmin(): Promise<void> {
  if (!env.superAdminEmail || !env.superAdminPassword) {
    logger.warn('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin seed.');
    return;
  }

  await connectDB();

  const existing = await User.findOne({ email: env.superAdminEmail });
  if (existing) {
    logger.info(`Super admin already exists for ${env.superAdminEmail} — nothing to do.`);
    await disconnectDB();
    return;
  }

  await User.create({
    name: env.superAdminName,
    email: env.superAdminEmail,
    password: env.superAdminPassword,
    role: 'super_admin',
    companyId: null,
    isEmailVerified: true,
  });

  logger.info(`Super admin created for ${env.superAdminEmail}.`);
  await disconnectDB();
}

seedSuperAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Failed to seed super admin', { err: err instanceof Error ? err.message : err });
    process.exit(1);
  });
