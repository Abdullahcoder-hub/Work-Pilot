import { Role } from '../modules/user/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        companyId: string | null;
      };
    }
  }
}

export {};
