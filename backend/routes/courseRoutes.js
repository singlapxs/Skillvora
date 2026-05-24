const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLecture,
  bulkCreateLectures,
  reorderLectures,
  updateLecture,
  deleteLecture,
  requestCourseEnrollment,
  getCourseRequestStatus
} = require('../controllers/courseController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes for course viewing
router.get('/', getCourses);
router.get('/:id', getCourse);

// Student request routes
router.post('/:courseId/request', protect, requestCourseEnrollment);
router.get('/:courseId/request-status', protect, getCourseRequestStatus);

// Admin-only course configuration routes
router.post('/', protect, adminOnly, createCourse);
router.put('/:id', protect, adminOnly, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);

// Admin-only module configurations
router.post('/:courseId/modules', protect, adminOnly, createModule);
router.put('/modules/:moduleId', protect, adminOnly, updateModule);
router.delete('/modules/:moduleId', protect, adminOnly, deleteModule);

// Admin-only lecture configurations
router.post('/modules/:moduleId/lectures', protect, adminOnly, createLecture);
router.post('/modules/:moduleId/lectures/bulk', protect, adminOnly, bulkCreateLectures);
router.put('/modules/:moduleId/lectures/reorder', protect, adminOnly, reorderLectures);
router.put('/lectures/:lectureId', protect, adminOnly, updateLecture);
router.delete('/lectures/:lectureId', protect, adminOnly, deleteLecture);

module.exports = router;
