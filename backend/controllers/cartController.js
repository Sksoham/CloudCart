const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/errorHandler');


const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  res.status(200).json({
    success: true,
    cart,
  });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw new ApiError('Product id is required', 400);
  }
  if (quantity < 1) {
    throw new ApiError('Quantity must be at least 1', 400);
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError('Product not found', 404);
  }

  if (product.stock < quantity) {
    throw new ApiError(`Only ${product.stock} units of "${product.title}" are in stock`, 400);
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const effectivePrice = product.discountPrice || product.price;

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      throw new ApiError(`Cannot add more. Only ${product.stock} units available`, 400);
    }
    existingItem.quantity = newQuantity;
    existingItem.price = effectivePrice; // keep price in sync with latest product price
  } else {
    cart.items.push({
      product: product._id,
      title: product.title,
      image: product.image,
      price: effectivePrice,
      quantity,
    });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    cart,
  });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (!quantity || quantity < 1) {
    throw new ApiError('Quantity must be at least 1', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  if (quantity > product.stock) {
    throw new ApiError(`Only ${product.stock} units of "${product.title}" are in stock`, 400);
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);

  if (!item) {
    throw new ApiError('Item not found in cart', 404);
  }

  item.quantity = quantity;
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart item updated',
    cart,
  });
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user._id);

  const itemExists = cart.items.some((item) => item.product.toString() === productId);
  if (!itemExists) {
    throw new ApiError('Item not found in cart', 404);
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    cart,
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    cart,
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
