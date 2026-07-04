const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');


router.use(protect);


router.post(
  '/',
  [
    body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
    body('shippingAddress.phone').notEmpty().withMessage('Phone number is required'),
    body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.state').notEmpty().withMessage('State is required'),
    body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
    body('shippingAddress.country').notEmpty().withMessage('Country is required'),
  ],
  validateRequest,
  placeOrder
);


router.get('/my-orders', getMyOrders);


router.get('/stats', authorize('admin'), getOrderStats);


router.get('/', authorize('admin'), getAllOrders);


router.get('/:id', getOrderById);


router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
