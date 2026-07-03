// routes/userRoutes.js
const express = require('express');
const router = express.Router();

const {
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// PUT /api/users/profile  — logged-in user updates their own profile
router.put('/profile', protect, updateProfile);

// Admin-only routes below
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUserByAdmin);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
