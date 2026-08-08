"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);
function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}. Copy backend/.env.example to backend/.env and fill it in.`);
    }
    return value;
}
function validateMongoUri(uri) {
    const hasPlaceholder = /<[^>]+>/.test(uri) || uri.includes('db_password');
    if (hasPlaceholder) {
        throw new Error('MONGO_URI still contains placeholder values. Replace it in backend/.env with your real Atlas connection string.');
    }
    return uri;
}
const nodeEnv = process.env.NODE_ENV || 'development';
exports.env = {
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
};
if (exports.env.jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long for production safety.');
}
