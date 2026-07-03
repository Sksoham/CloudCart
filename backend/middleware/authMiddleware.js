// middleware/authMiddleware.js
// Authentication middleware: verifies JWT and attaches the user to req.user.
// Authorization middleware: restricts routes to specific roles (e.g. admin).

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { ApiError } = require('./errorHandler');

/**
 * protect
 * Verifies the JWT sent either via the "Authorization: Bearer <token>" header
 * or via an httpOnly cookie. Attaches the authenticated user document to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to cookie (useful if frontend stores token in httpOnly cookie)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError('Not authorized. No authentication token provided.', 401);
  }

  try {
    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user fresh from DB (ensures deleted/deactivated users are blocked)
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      throw new ApiError('The user belonging to this token no longer exists.', 401);
    }

    if (!currentUser.isActive) {
      throw new ApiError('This user account has been deactivated.', 403);
    }

    // If password was changed after token was issued, force re-login
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new ApiError('Password was recently changed. Please log in again.', 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Not authorized. Invalid or expired token.', 401);
  }
});

/**
 * authorize(...roles)
 * Restricts access to users whose role is included in the allowed roles list.
 * Must be used AFTER the protect middleware.
 * Usage: router.delete('/:id', protect, authorize('admin'), deleteProduct);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError('Not authorized. Please log in.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        `Access denied. Role '${req.user.role}' is not permitted to perform this action.`,
        403
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
