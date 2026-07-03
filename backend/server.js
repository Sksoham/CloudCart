// server.js
// CloudCart API - Main entry point.
// Wires together security middleware, routes, and error handling,
// then connects to MongoDB Atlas and starts listening.

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

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

// ─── Connect to Database ───────────────────────────────────────────────────
connectDB();

// ─── App Initialization ────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────

// Set secure HTTP response headers
app.use(helmet());

// CORS: allow requests from the React frontend (configured via env var)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
      }
    },
    credentials: true, // required for cookies (httpOnly JWT)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting: prevents brute-force & DDoS (tune per-environment via env)
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Stricter rate limit for auth routes (prevent brute-force login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});
app.use('/api/auth', authLimiter);

// Sanitize user-supplied data against MongoDB operator injection
app.use(mongoSanitize());

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP Request Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // In production (EC2) use combined Apache-style log (easily parsed by CloudWatch)
  app.use(morgan('combined'));
}

// ─── Health Check Endpoint ─────────────────────────────────────────────────
// Used by AWS ELB / Route53 health checks and CI/CD smoke tests
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CloudCart API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────
app.use(notFound);     // 404 for undefined routes
app.use(errorHandler); // Global error formatter

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `CloudCart API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections (e.g. DB query failures not caught)
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Gracefully close the server before exiting
  server.close(() => process.exit(1));
});

module.exports = app; // exported for Jest/Supertest integration tests
