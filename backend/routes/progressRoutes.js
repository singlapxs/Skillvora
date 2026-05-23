const express = require('express');
const router = express.Router();
const {
  getProgress,
  toggleLectureComplete,
  updateResumeWatch,
  getStudentDashboard
} = require('../controllers/progressController');
const { protect, approvedUsersOnly } = require('../middleware/auth');

// All progress routes require validation and active student approval status
router.use(protect);
router.use(approvedUsersOnly);

router.get('/dashboard', getStudentDashboard); // Must be before /:courseId
router.get('/:courseId', getProgress);
router.post('/:courseId/lecture/:lectureId/toggle', toggleLectureComplete);
router.post('/:courseId/resume', updateResumeWatch);

module.exports = router;
