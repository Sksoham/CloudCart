// models/Product.js
// Product schema: represents items sold on CloudCart.
// Includes text indexing for search, category filtering, and stock tracking.

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      required: [true, 'Product image URL is required'],
      default: 'https://via.placeholder.com/500x500.png?text=CloudCart+Product',
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: [
        'Electronics',
        'Fashion',
        'Home & Kitchen',
        'Books',
        'Beauty & Personal Care',
        'Sports & Outdoors',
        'Toys & Games',
        'Grocery',
        'Other',
      ],
    },
    brand: {
      type: String,
      default: 'Generic',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (value) {
          return !value || value <= this.price;
        },
        message: 'Discount price must be less than or equal to the regular price',
      },
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index to support keyword search on title, description, and brand
productSchema.index({ title: 'text', description: 'text', brand: 'text' });

// Compound index to speed up category + price range filter queries
productSchema.index({ category: 1, price: 1 });

// Virtual field: returns true if stock is available
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Recalculate average rating whenever reviews change
productSchema.methods.recalculateRatings = function () {
  if (this.reviews.length === 0) {
    this.ratings = 0;
    this.numReviews = 0;
    return;
  }
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings = total / this.reviews.length;
  this.numReviews = this.reviews.length;
};

module.exports = mongoose.model('Product', productSchema);
