const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { sendTokenResponse } = require('../utils/generateToken');

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

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Please provide both email and password', 400);
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new ApiError('This account has been deactivated. Contact support.', 403);
  }

  sendTokenResponse(user, 200, res);
});

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

const getMe = asyncHandler(async (req, res) => {
  
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

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
