require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

// =======================
// Connect Database
// =======================
connectDB();

const app = express();

// =======================
// Security
// =======================
app.use(helmet());

// =======================
// Allowed Origins
// =======================
const allowedOrigins = [
  'http://cloudcart-frontend-sksoham.s3-website-us-east-1.amazonaws.com',
  'http://localhost:3000',
];

// =======================
// CORS
// =======================
const corsOptions = {
  origin(origin, callback) {
    console.log('Incoming Origin:', origin);

    // Allow Postman, curl, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('Blocked Origin:', origin);

    return callback(
      new Error(`CORS policy: Origin ${origin} is not allowed`)
    );
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// =======================
// Rate Limiter
// =======================
const limiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_WINDOW_MS) ||
    15 * 60 * 1000,

  max:
    Number(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    200,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      'Too many requests from this IP. Please try again later.',
  },
});

app.use('/api', limiter);

// =======================
// Auth Rate Limiter
// =======================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  message: {
    success: false,
    message:
      'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

app.use('/api/auth', authLimiter);

// =======================
// Middleware
// =======================
app.use(mongoSanitize());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// =======================
// Logger
// =======================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// =======================
// Health Route
// =======================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CloudCart API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// =======================
// API Routes
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// =======================
// Error Handlers
// =======================
app.use(notFound);
app.use(errorHandler);

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `CloudCart API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

// =======================
// Handle Unhandled Rejections
// =======================
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);

  server.close(() => process.exit(1));
});

module.exports = app;