const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security Middleware configurations
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP limitations to allow custom iframe embedding securely
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Express parser & data limit adjustments
app.use(express.json({ limit: '15mb' })); // Higher limit for course thumbnail upload payloads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Sanitize MongoDB inputs against NoSQL injections
app.use(mongoSanitize());

// Mount API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Base health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Skillvora MERN Platform API'
  });
});

// Centralized error interceptor
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Active and running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Capture unhandled rejection promises gracefully
process.on('unhandledRejection', (err, promise) => {
  console.error(`[Unhandled Promise Rejection] Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
