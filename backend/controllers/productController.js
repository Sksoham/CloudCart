const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/errorHandler');




const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };


  if (req.query.keyword) {
    filter.$text = { $search: req.query.keyword };
  }


  if (req.query.category && req.query.category !== 'All') {
    filter.category = req.query.category;
  }


  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }


  let sortOption = { createdAt: -1 }; // default: newest first
  switch (req.query.sort) {
    case 'price_asc':
      sortOption = { price: 1 };
      break;
    case 'price_desc':
      sortOption = { price: -1 };
      break;
    case 'rating':
      sortOption = { ratings: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    default:
      break;
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    products,
  });
});




const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.status(200).json({ success: true, categories });
});




const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'reviews.user',
    'name'
  );

  if (!product || !product.isActive) {
    throw new ApiError('Product not found', 404);
  }

  res.status(200).json({ success: true, product });
});




const createProduct = asyncHandler(async (req, res) => {
  const { title, description, image, images, category, brand, price, discountPrice, stock, sku } =
    req.body;

  if (!title || !description || !image || !category || price === undefined || stock === undefined) {
    throw new ApiError('Please provide all required product fields', 400);
  }

  const product = await Product.create({
    title,
    description,
    image,
    images: images || [],
    category,
    brand,
    price,
    discountPrice,
    stock,
    sku,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product,
  });
});




const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  const updatableFields = [
    'title',
    'description',
    'image',
    'images',
    'category',
    'brand',
    'price',
    'discountPrice',
    'stock',
    'sku',
    'isActive',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  const updatedProduct = await product.save();

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    product: updatedProduct,
  });
});




const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }


  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});




const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || !comment) {
    throw new ApiError('Please provide a rating and comment', 400);
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    throw new ApiError('You have already reviewed this product', 400);
  }

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  });

  product.recalculateRatings();
  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
  });
});

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
};
