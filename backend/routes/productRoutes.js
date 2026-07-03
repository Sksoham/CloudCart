// routes/productRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const productValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Product title is required')
    .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required'),
  body('image')
    .trim()
    .notEmpty().withMessage('Product image URL is required'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Electronics', 'Fashion', 'Home & Kitchen', 'Books',
      'Beauty & Personal Care', 'Sports & Outdoors', 'Toys & Games',
      'Grocery', 'Other',
    ]).withMessage('Invalid category'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// GET /api/products
router.get('/', getProducts);

// GET /api/products/categories
router.get('/categories', getCategories);

// GET /api/products/:id
router.get('/:id', getProductById);

// POST /api/products  (admin only)
router.post('/', protect, authorize('admin'), productValidation, validateRequest, createProduct);

// PUT /api/products/:id  (admin only)
router.put('/:id', protect, authorize('admin'), updateProduct);

// DELETE /api/products/:id  (admin only)
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// POST /api/products/:id/reviews  (logged-in users)
router.post(
  '/:id/reviews',
  protect,
  [
    body('rating')
      .notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .notEmpty().withMessage('Review comment is required')
      .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  ],
  validateRequest,
  addProductReview
);

module.exports = router;
