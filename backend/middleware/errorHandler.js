




/**
 * Custom error class to standardize operational errors thrown across the app.
 * Usage: throw new ApiError('Product not found', 404);
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles requests to undefined routes (must be registered AFTER all routes).
 */
const notFound = (req, res, next) => {
  const error = new ApiError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handling middleware (must be registered LAST in server.js).
 * Normalizes Mongoose errors (CastError, ValidationError, duplicate key)
 * and JWT errors into consistent, client-friendly JSON responses.
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode && err.statusCode !== 200 ? err.statusCode : 500;
  let message = err.message || 'Internal Server Error';


  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }


  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }


  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value entered for field: ${field}`;
  }


  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }


  console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,

    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { ApiError, notFound, errorHandler };
