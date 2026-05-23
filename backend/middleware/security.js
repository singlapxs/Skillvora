const rateLimit = require('express-rate-limit');

/**
 * Limit connection rates on authentication endpoints (Login / Signup)
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  }
});

/**
 * General API connection rate rules
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Limit general api traffic
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});

module.exports = {
  authRateLimiter,
  apiRateLimiter
};
