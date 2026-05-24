const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/security');

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', protect, getMe);
router.post('/forgot-password', authRateLimiter, forgotPassword);

router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;
