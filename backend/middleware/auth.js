const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Route protection middleware
 * Verifies the presence of a valid JWT token and extracts user profile
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_skillvora_development_key_12345');
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found in system.' });
      }
      next();
    } catch (error) {
      console.error(`[Auth Middleware Error] JWT validation failed: ${error.message}`);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

/**
 * Limit access to approved users only
 */
const approvedUsersOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (req.user.role === 'admin') {
    return next(); // Admins are always authorized
  }

  if (req.user.status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending admin approval.'
    });
  }

  if (req.user.status === 'rejected') {
    return res.status(403).json({
      success: false,
      message: 'Your enrollment request was rejected.'
    });
  }

  if (!req.user.isApproved || req.user.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account is not approved.'
    });
  }

  next();
};

/**
 * Grant access to admin roles only
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }
};

module.exports = {
  protect,
  approvedUsersOnly,
  adminOnly
};
