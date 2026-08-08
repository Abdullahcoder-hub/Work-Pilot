import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  clientOrigin: string[];
  superAdminEmail: string | undefined;
  superAdminPassword: string | undefined;
  superAdminName: string;
  brevoApiKey: string | undefined;
  emailFrom: string;
  emailFromName: string;
  appUrl: string;
  anthropicApiKey: string | undefined;
  anthropicModel: string | undefined;
  geminiApiKey: string | undefined;
  geminiModel: string | undefined;
  aiProvider: 'anthropic' | 'gemini' | undefined;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
  return value;
}

function validateMongoUri(uri: string): string {
  const hasPlaceholder = /<[^>]+>/.test(uri) || uri.includes('db_password');

  if (hasPlaceholder) {
    throw new Error(
      'MONGO_URI still contains placeholder values. Replace it in backend/.env with your real Atlas connection string.'
    );
  }

  return uri;
}

const nodeEnv = (process.env.NODE_ENV as EnvConfig['nodeEnv']) || 'development';

export const env: EnvConfig = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  mongoUri: validateMongoUri(required('MONGO_URI')),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
  superAdminName: process.env.SUPER_ADMIN_NAME || 'Platform Super Admin',
  brevoApiKey: process.env.BREVO_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'mughalbrand012345@gmail.com',
  emailFromName: process.env.EMAIL_FROM_NAME || 'WorkPilot',
  // Frontend origin used to build links inside emails (verify/reset/accept-invite).
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  aiProvider: (process.env.AI_PROVIDER as EnvConfig['aiProvider']) || undefined,
};

if (env.jwtSecret.length < 16) {
  throw new Error('JWT_SECRET must be at least 16 characters long for production safety.');
}
