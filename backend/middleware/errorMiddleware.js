/** 404 handler — runs when no route matched the request. */
function notFound(req, res, next) {
  const error = new Error(`Route not found — ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * Central error handler. Every controller/middleware that calls next(err)
 * or throws inside an asyncHandler ends up here.
 */
function errorHandler(err, req, res, next) {
  // If a status code was already set (e.g. 401, 404), keep it; otherwise default to 500.
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Mongoose duplicate key error (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
