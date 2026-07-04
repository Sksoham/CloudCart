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


router.put('/profile', protect, updateProfile);


router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUserByAdmin);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
