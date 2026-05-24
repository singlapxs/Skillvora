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

    // Enforce strong password validation (At least 6 characters, contain both letters and symbols/special characters)
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    if (!hasLetter || !hasSymbol) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be strong: it must contain both letters (A-Z) and symbols/special characters (e.g. @, #, $, etc.).' 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account is already registered with this email address.' });
    }

    // Check if this is the first user in the database
    const isFirstUser = (await User.countDocuments({})) === 0;

    let role = isFirstUser ? 'admin' : 'student';
    let status = 'approved'; // Auto-approved on register
    let isApproved = true;
    let approvedAt = new Date();

    const user = await User.create({
      name,
      email,
      password,
      role,
      status,
      isApproved,
      approvedAt
    });

    res.status(201).json({
      success: true,
      message: isFirstUser 
        ? 'Initial Admin account created and logged in automatically!' 
        : 'Registration successful! Your account is active. You can browse courses and request access.',
      token: generateToken(user._id), // Auto-login on registration
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved,
        profilePic: user.profilePic || '',
        enrolledCourses: []
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

    // Open login: any registered account can login successfully.

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
        isApproved: user.isApproved,
        profilePic: user.profilePic || '',
        enrolledCourses: user.enrolledCourses || []
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

/**
 * @desc    Update user profile (name, profilePic)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, profilePic } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isApproved: user.isApproved,
        profilePic: user.profilePic,
        enrolledCourses: user.enrolledCourses || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
    }

    // Get user and select password hash
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    // Enforce strong password validation (Must be at least 6 characters, and contain both letters and symbols)
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);

    if (!hasLetter || !hasSymbol) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be strong: it must contain both letters (A-Z) and symbols/special characters (e.g. @, #, $, etc.).' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (error) {
    next(error);
  }
};

