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
    body('customerName').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name'),
    body('customerPhone').isString().trim().matches(/^[+\d\s()-]{7,20}$/).withMessage('Enter a valid contact number'),
    body('requestedDate').isISO8601().withMessage('Choose a pickup date'),
    body('note').optional().isString().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  placeOrder
);


router.get('/my-orders', getMyOrders);


router.get('/stats', authorize('admin'), getOrderStats);


router.get('/', authorize('admin'), getAllOrders);


router.get('/:id', getOrderById);


router.put('/:id/status', updateOrderStatus);

module.exports = router;
