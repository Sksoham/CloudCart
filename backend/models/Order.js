const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, 'Full name is required'] },
    phone: { type: String, required: [true, 'Phone number is required'] },
    street: { type: String, required: [true, 'Street address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    postalCode: { type: String, required: [true, 'Postal code is required'] },
    country: { type: String, required: [true, 'Country is required'] },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    fulfillment: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    pickup: {
      shopName: String, address: String, area: String, city: String,
      shopPhone: String, hours: String, customerName: String, customerPhone: String,
      requestedDate: String, note: String, code: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (val) => Array.isArray(val) && val.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: function () { return this.fulfillment !== 'pickup'; },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'CARD', 'UPI', 'PAY_AT_SHOP'],
      default: 'COD',
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paidAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      enum: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Requested', 'Confirmed', 'Ready for pickup', 'Collected'],
      default: 'Processing',
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
