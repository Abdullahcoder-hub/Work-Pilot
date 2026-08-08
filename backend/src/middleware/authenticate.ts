import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/generateToken';
import { ApiError } from '../utils/ApiError';
import { User } from '../modules/user/user.model';

/**
 * Verifies the Bearer JWT, then re-checks the user still exists and is
 * active on every request (not just trusting stale token claims) so a
 * deactivated/deleted user is locked out immediately, not after 7 days.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = verifyToken(token);

    const user = await User.findById(payload.userId).select('_id role companyId isActive');
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account is inactive or no longer exists');
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      companyId: user.companyId ? user.companyId.toString() : null,
    };

    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
