const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/errorHandler');

const Shop = require('../models/Shop');
const { randomBytes } = require('crypto');

const placeOrder = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, requestedDate, note = '' } = req.body;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const lastDate = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') || requestedDate < today || requestedDate > lastDate || new Date(requestedDate).toISOString().slice(0, 10) !== requestedDate) {
    throw new ApiError('Choose a pickup date within the next 7 days.', 400);
  }
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, checkoutInProgress: { $ne: true }, 'items.0': { $exists: true } },
    { $set: { checkoutInProgress: true }, $inc: { __v: 1 } }, { new: true }
  );
  if (!cart) throw new ApiError('Your cart is empty or a checkout is already in progress.', 409);
  const reserved = [];
  let order;
  try {
    const products = await Product.find({ _id: { $in: cart.items.map(i => i.product) } });
    const shopId = products[0]?.shop;
    if (!shopId || products.length !== cart.items.length || products.some(p => !p.isActive || String(p.shop) !== String(shopId))) {
      throw new ApiError('Please checkout products from one available shop at a time.', 400);
    }
    const shop = await Shop.findById(shopId);
    if (!shop) throw new ApiError('This shop is no longer available.', 400);
    const items = [];
    for (const item of cart.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new ApiError('Invalid item quantity.', 400);
      const product = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }, { new: true }
      );
      if (!product) throw new ApiError(`Not enough stock for ${item.title}. Please update your cart.`, 409);
      reserved.push(item);
      items.push({ product: product._id, title: product.title, image: product.image,
        price: product.discountPrice ?? product.price, quantity: item.quantity });
    }
    const total = Number(items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));
    order = await Order.create({
      user: req.user._id, shop: shop._id, seller: shop.owner, fulfillment: 'pickup', items,
      pickup: { shopName: shop.name, address: shop.address, area: shop.area, city: shop.city,
        shopPhone: shop.phone, hours: shop.hours, customerName, customerPhone, requestedDate, note,
        code: randomBytes(4).toString('hex').toUpperCase() },
      paymentMethod: 'PAY_AT_SHOP', paymentStatus: 'Pending', orderStatus: 'Requested',
      itemsPrice: total, shippingPrice: 0, taxPrice: 0, totalPrice: total,
    });
    await Cart.updateOne({ _id: cart._id }, { $set: { items: [], checkoutInProgress: false } });
  } catch (error) {
    if (!order) {
      for (const item of reserved) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
    await Cart.updateOne({ _id: cart._id }, { $set: { checkoutInProgress: false, ...(order ? { items: [] } : {}) } });
    throw error;
  }
  res.status(201).json({ success: true, message: 'Pickup requested. Wait for the shop to confirm.', order });
});

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

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    String(order.seller) !== String(req.user._id)
  ) {
    throw new ApiError('Not authorized to view this order', 403);
  }

  if (String(order.user._id) !== String(req.user._id) && order.pickup) order.pickup.code = undefined;
  res.status(200).json({ success: true, order });
});

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

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  if (order.fulfillment === 'pickup') {
    const isSeller = String(order.seller) === String(req.user._id) || req.user.role === 'admin';
    const isCustomer = String(order.user) === String(req.user._id);
    const transitions = {
      Requested: ['Confirmed', 'Cancelled'],
      Confirmed: ['Ready for pickup', 'Cancelled'],
      'Ready for pickup': ['Collected', 'Cancelled'],
    };
    if (!isSeller && !(isCustomer && orderStatus === 'Cancelled' && ['Requested', 'Confirmed'].includes(order.orderStatus))) {
      throw new ApiError('You cannot make this change to this order.', 403);
    }
    if (!transitions[order.orderStatus]?.includes(orderStatus)) throw new ApiError('This status change is not allowed. Refresh the order.', 409);
    if (orderStatus === 'Collected' && String(req.body.pickupCode || '').trim().toUpperCase() !== order.pickup.code) {
      throw new ApiError('Enter the pickup code shown by the customer.', 400);
    }
    const changes = { orderStatus };
    if (orderStatus === 'Collected') Object.assign(changes, { paymentStatus: 'Paid', paidAt: new Date(), deliveredAt: new Date() });
    if (orderStatus === 'Cancelled') changes.cancelledAt = new Date();
    const updated = await Order.findOneAndUpdate({ _id: order._id, orderStatus: order.orderStatus }, { $set: changes }, { new: true });
    if (!updated) throw new ApiError('Order changed. Please refresh.', 409);
    if (orderStatus === 'Cancelled') {
      for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
    if (!isCustomer) updated.pickup.code = undefined;
    return res.json({ success: true, order: updated });
  }
  if (req.user.role !== 'admin') throw new ApiError('Administrator access required for legacy delivery orders.', 403);
  const validOrderStatuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];

  if (orderStatus) {
    if (!validOrderStatuses.includes(orderStatus)) {
      throw new ApiError(`Invalid order status: ${orderStatus}`, 400);
    }
    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered') order.deliveredAt = Date.now();
    if (orderStatus === 'Cancelled' && !order.cancelledAt) {
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

const getOrderStats = asyncHandler(async (req, res) => {
  const [totalOrders, totalRevenue, pendingOrders, deliveredOrders] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ orderStatus: { $in: ['Processing', 'Requested', 'Confirmed', 'Ready for pickup'] } }),
    Order.countDocuments({ orderStatus: { $in: ['Delivered', 'Collected'] } }),
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
