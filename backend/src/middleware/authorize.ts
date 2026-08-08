import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { Role } from '../modules/user/user.model';

/** Restricts a route to one or more roles. Must run after `authenticate`. */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action requires one of the following roles: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}

/**
 * Ensures the authenticated user belongs to a tenant (company). Blocks
 * super_admin from tenant-scoped data routes — the platform module is
 * where cross-tenant access lives, kept deliberately separate so a bug
 * there can never leak into ordinary company data endpoints.
 */
export function requireCompanyScope(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (!req.user.companyId) {
    return next(ApiError.forbidden('This endpoint is scoped to a company; platform accounts should use /api/platform instead.'));
  }
  next();
}
