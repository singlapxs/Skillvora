const express = require('express');
const router = express.Router();
const { 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  getAllUsers, 
  getAnalytics,
  enrollStudent,
  unenrollStudent
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Apply protection & admin checking globally to all admin routes
router.use(protect);
router.use(adminOnly);

router.get('/pending-users', getPendingUsers);
router.put('/approve/:id', approveUser);
router.put('/reject/:id', rejectUser);
router.get('/users', getAllUsers);
router.get('/analytics', getAnalytics);
router.put('/users/:userId/enroll', enrollStudent);
router.put('/users/:userId/unenroll', unenrollStudent);

module.exports = router;
