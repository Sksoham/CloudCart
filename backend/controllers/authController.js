// controllers/authController.js
// Handles user registration, login, logout, current-user retrieval,
// and password change. Uses express-async-handler so thrown errors
// are automatically forwarded to the global error handler.

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { sendTokenResponse } = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError('An account with this email already exists', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'user', // role is never trusted from client input on register
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Please provide both email and password', 400);
  }

  // Explicitly select password since schema has select:false by default
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new ApiError('This account has been deactivated. Contact support.', 403);
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Log out current user (clears auth cookie)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get currently authenticated user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the protect middleware
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Change password for the logged-in user
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError('Please provide current and new password', 400);
  }

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ApiError('Current password is incorrect', 401);
  }

  if (newPassword.length < 6) {
    throw new ApiError('New password must be at least 6 characters', 400);
  }

  user.password = newPassword;
  await user.save(); // triggers pre-save hashing hook

  sendTokenResponse(user, 200, res);
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  changePassword,
};
