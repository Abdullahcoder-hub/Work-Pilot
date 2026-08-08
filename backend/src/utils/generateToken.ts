import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../modules/user/user.model';

export interface JwtPayload {
  userId: string;
  role: Role;
  companyId: string | null;
}

export function generateToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
