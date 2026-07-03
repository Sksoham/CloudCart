// config/db.js
// Establishes and manages the connection to MongoDB Atlas using Mongoose.
// Designed to fail fast on startup if the database is unreachable,
// and to handle runtime disconnects gracefully (important for long-running
// EC2 processes managed by PM2).

const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the URI provided via environment variables.
 * Logs connection status and exits the process on initial connection failure
 * so that process managers (PM2 / systemd) can restart the service.
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Modern mongoose (v6+) no longer needs useNewUrlParser / useUnifiedTopology,
      // but we keep sane defaults for connection pooling in production.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Exit with failure so the deployment / process manager knows startup failed
    process.exit(1);
  }
};

// Runtime connection event listeners for observability in production logs
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect is handled by the driver.');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

// Graceful shutdown on process termination (e.g. EC2 instance stop, PM2 restart)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination (SIGINT).');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination (SIGTERM).');
  process.exit(0);
});

module.exports = connectDB;
