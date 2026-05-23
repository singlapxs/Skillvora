const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendAdminNotification } = require('../utils/emailService');

/**
 * Generate a JWT token for the user
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_skillvora_development_key_12345',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all registration fields.' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account is already registered with this email address.' });
    }

    // Check if this is the first user in the database
    const isFirstUser = (await User.countDocuments({})) === 0;

    let role = 'student';
    let status = 'pending';
    let isApproved = false;
    let approvedAt = null;

    // Bootstrapping: Auto-approve the first registered user as an Administrator
    if (isFirstUser) {
      role = 'admin';
      status = 'approved';
      isApproved = true;
      approvedAt = new Date();
      console.log(`[Bootstrap] Auto-created initial Admin account: ${email}`);
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      status,
      isApproved,
      approvedAt
    });

    // Send notifications if user is pending admin approval
    if (status === 'pending') {
      await sendAdminNotification(name, email);
    }

    res.status(201).json({
      success: true,
      message: isFirstUser 
        ? 'Initial Admin account created and logged in automatically!' 
        : 'Registration successful! Your account is pending admin approval. You will receive an email once approved.',
      token: isFirstUser ? generateToken(user._id) : null,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    // Get user and include password hash
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Enforce Approval System Constraints
    if (user.role !== 'admin') {
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending admin approval.'
        });
      }

      if (user.status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your enrollment request was rejected.'
        });
      }

      if (!user.isApproved || user.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Account is not approved.'
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // req.user is loaded in protect middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 to prevent user enumeration attacks
      return res.status(200).json({ success: true, message: 'If an account exists with that email, a password reset link will be sent.' });
    }

    console.log(`[Forgot Password] Simulated Reset link request for: ${email}`);
    // Simulate SMTP dispatch successfully
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link will be sent.'
    });
  } catch (error) {
    next(error);
  }
};
