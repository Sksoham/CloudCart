// routes/orderRoutes.js
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

// All order routes require authentication
router.use(protect);

// POST /api/orders  — place a new order
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

// GET /api/orders/my-orders  — must be BEFORE /:id to avoid clash
router.get('/my-orders', getMyOrders);

// Admin-only stats — also before /:id
router.get('/stats', authorize('admin'), getOrderStats);

// GET /api/orders  — admin: all orders
router.get('/', authorize('admin'), getAllOrders);

// GET /api/orders/:id  — owner or admin
router.get('/:id', getOrderById);

// PUT /api/orders/:id/status  — admin: update order/payment status
router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
