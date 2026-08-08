import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && typeof err === 'object' && 'name' in err) {
    const anyErr = err as { name: string; message?: string; code?: number; keyValue?: Record<string, unknown> };

    if (anyErr.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      details = anyErr.message;
    } else if (anyErr.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid identifier supplied';
    } else if (anyErr.code === 11000) {
      statusCode = 409;
      message = 'A record with this value already exists';
      details = anyErr.keyValue;
    } else if (anyErr.name === 'JsonWebTokenError' || anyErr.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Invalid or expired token';
    }
  }

  if (statusCode >= 500) {
    logger.error(message, { path: req.originalUrl, method: req.method, err: err instanceof Error ? err.stack : err });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.nodeEnv === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
}
