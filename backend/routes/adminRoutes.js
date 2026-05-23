const express = require('express');
const router = express.Router();
const { 
  getPendingUsers, 
  approveUser, 
  rejectUser, 
  getAllUsers, 
  getAnalytics,
  enrollStudent,
  unenrollStudent,
  getCourseRequests,
  approveCourseRequest,
  rejectCourseRequest
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

// Course access request administrative reviews
router.get('/course-requests', getCourseRequests);
router.put('/course-requests/:requestId/approve', approveCourseRequest);
router.put('/course-requests/:requestId/reject', rejectCourseRequest);

module.exports = router;
