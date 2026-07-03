// middleware/errorHandler.js
// Centralized error handling for the entire API.
// All controllers use express-async-handler and throw/forward errors here
// via next(error), so error formatting logic lives in exactly one place.

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
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode && err.statusCode !== 200 ? err.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose: invalid ObjectId (e.g. /api/products/invalid-id)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }

  // Mongoose: schema validation failure
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Mongoose: duplicate unique key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value entered for field: ${field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Log full error server-side for debugging (visible in EC2 / PM2 logs)
  console.error(`[${new Date().toISOString()}] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only leak stack traces in non-production environments
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { ApiError, notFound, errorHandler };
