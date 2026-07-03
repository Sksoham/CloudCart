// controllers/userController.js
// Handles user profile self-service operations and admin user management.

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Update logged-in user's own profile (name, phone, address)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address) {
    user.address = {
      street: address.street ?? user.address.street,
      city: address.city ?? user.address.city,
      state: address.state ?? user.address.state,
      postalCode: address.postalCode ?? user.address.postalCode,
      country: address.country ?? user.address.country,
    };
  }

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser,
  });
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.role) {
    filter.role = req.query.role;
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

// @desc    Get a single user by id (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Update a user's role or active status (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (role && !['user', 'admin'].includes(role)) {
    throw new ApiError("Role must be either 'user' or 'admin'", 400);
  }

  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: updatedUser,
  });
});

// @desc    Delete a user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError('Admins cannot delete their own account', 400);
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser,
};
