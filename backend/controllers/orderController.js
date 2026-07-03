// controllers/orderController.js
// Handles order placement (from cart), user order history, single order
// retrieval, and admin order/payment status management.

const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Place a new order from the current cart
// @route   POST /api/orders
// @access  Private
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress) {
    throw new ApiError('Shipping address is required', 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new ApiError('Your cart is empty. Add items before placing an order.', 400);
  }

  // Validate stock and build order items
  const orderItems = [];
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      throw new ApiError(`Product "${item.title}" is no longer available`, 400);
    }
    if (product.stock < item.quantity) {
      throw new ApiError(
        `Insufficient stock for "${product.title}". Available: ${product.stock}`,
        400
      );
    }
    orderItems.push({
      product: product._id,
      title: product.title,
      image: product.image,
      price: item.price,
      quantity: item.quantity,
    });
  }

  // Price calculations
  const itemsPrice = Number(
    orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  const shippingPrice = itemsPrice > 499 ? 0 : 49;
  const taxRate = 0.18;
  const taxPrice = Number((itemsPrice * taxRate).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
    paidAt: paymentMethod !== 'COD' ? Date.now() : undefined,
    orderStatus: 'Processing',
  });

  // Deduct stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    order,
  });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

// @desc    Get a single order by id (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError('Not authorized to view this order', 403);
  }

  res.status(200).json({ success: true, order });
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  const validOrderStatuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

  if (orderStatus) {
    if (!validOrderStatuses.includes(orderStatus)) {
      throw new ApiError(`Invalid order status: ${orderStatus}`, 400);
    }
    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered') order.deliveredAt = Date.now();
    if (orderStatus === 'Cancelled') {
      order.cancelledAt = Date.now();
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
  }

  if (paymentStatus) {
    if (!validPaymentStatuses.includes(paymentStatus)) {
      throw new ApiError(`Invalid payment status: ${paymentStatus}`, 400);
    }
    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'Paid' && !order.paidAt) order.paidAt = Date.now();
  }

  const updatedOrder = await order.save();
  res.status(200).json({ success: true, message: 'Order updated successfully', order: updatedOrder });
});

// @desc    Get admin dashboard summary stats
// @route   GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = asyncHandler(async (req, res) => {
  const [totalOrders, totalRevenue, pendingOrders, deliveredOrders] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ orderStatus: 'Processing' }),
    Order.countDocuments({ orderStatus: 'Delivered' }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingOrders,
      deliveredOrders,
    },
  });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
};
