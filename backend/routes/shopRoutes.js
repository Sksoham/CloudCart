const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { body } = require('express-validator');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { ApiError } = require('../middleware/errorHandler');

const shopFields = ['name', 'description', 'address', 'area', 'city', 'phone', 'hours'];
const ownedShop = async (req) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) throw new ApiError('Create your shop profile first.', 403);
  return shop;
};

router.get('/', asyncHandler(async (req, res) => {
  const shops = await Shop.find().select('-owner').sort({ name: 1 });
  res.json({ success: true, shops });
}));

router.get('/mine', protect, asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });
  res.json({ success: true, shop });
}));

router.put('/mine', protect,
  shopFields.filter(f => f !== 'description').map(f => body(f).isString().trim().notEmpty().isLength({ max: f === 'address' ? 200 : 100 })),
  body('phone').matches(/^[+\d\s()-]{7,20}$/).withMessage('Enter a valid shop phone number'),
  body('description').optional().isString().isLength({ max: 600 }),
  validateRequest, asyncHandler(async (req, res) => {
    const values = Object.fromEntries(shopFields.filter(f => req.body[f] !== undefined).map(f => [f, req.body[f]]));
    const shop = await Shop.findOneAndUpdate({ owner: req.user._id }, { $set: values }, { upsert: true, new: true, runValidators: true });
    if (req.user.role === 'user') await User.updateOne({ _id: req.user._id }, { $set: { role: 'seller' } });
    res.json({ success: true, shop, user: await User.findById(req.user._id) });
  }));

router.get('/mine/products', protect, asyncHandler(async (req, res) => {
  const shop = await ownedShop(req);
  const products = await Product.find({ shop: shop._id }).sort({ createdAt: -1 }).populate('shop');
  res.json({ success: true, products });
}));

router.get('/mine/orders', protect, asyncHandler(async (req, res) => {
  const shop = await ownedShop(req);
  const orders = await Order.find({ shop: shop._id, fulfillment: 'pickup' }).select('-pickup.code').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, orders });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id).select('-owner');
  if (!shop) throw new ApiError('Shop not found', 404);
  res.json({ success: true, shop });
}));

module.exports = router;
