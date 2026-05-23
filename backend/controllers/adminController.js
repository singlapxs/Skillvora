const User = require('../models/User');
const Course = require('../models/Course');
const { sendApprovalConfirmation, sendRejectionNotification } = require('../utils/emailService');

/**
 * @desc    Get pending registrations
 * @route   GET /api/admin/pending-users
 * @access  Private/Admin
 */
exports.getPendingUsers = async (req, res, next) => {
  try {
    const pendingUsers = await User.find({ status: 'pending', role: 'student' }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve student registration
 * @route   PUT /api/admin/approve/:id
 * @access  Private/Admin
 */
exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot perform operations on Admin profiles.' });
    }

    user.status = 'approved';
    user.isApproved = true;
    user.approvedAt = new Date();
    await user.save();

    // Trigger Nodemailer confirmation dispatch
    await sendApprovalConfirmation(user.name, user.email);

    res.status(200).json({
      success: true,
      message: `Successfully approved student: ${user.name}. Enrollment email sent.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject student registration
 * @route   PUT /api/admin/reject/:id
 * @access  Private/Admin
 */
exports.rejectUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot perform operations on Admin profiles.' });
    }

    user.status = 'rejected';
    user.isApproved = false;
    user.approvedAt = null;
    await user.save();

    // Trigger Nodemailer decline dispatch
    await sendRejectionNotification(user.name, user.email);

    res.status(200).json({
      success: true,
      message: `Student enrollment declined: ${user.name}. Rejection email sent.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users list
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system-wide analytics stats
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const pendingCount = await User.countDocuments({ status: 'pending', role: 'student' });
    const approvedCount = await User.countDocuments({ status: 'approved', role: 'student' });
    const rejectedCount = await User.countDocuments({ status: 'rejected', role: 'student' });
    const totalCourses = await Course.countDocuments({});

    const recentRegistrations = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        pendingCount,
        approvedCount,
        rejectedCount,
        totalCourses,
        recentRegistrations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll a student in a course
 * @route   PUT /api/admin/users/:userId/enroll
 * @access  Private/Admin
 */
exports.enrollStudent = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const isAlreadyEnrolled = user.enrolledCourses?.some(id => id.toString() === courseId.toString());
    if (isAlreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Student is already enrolled in this course.' });
    }

    if (!user.enrolledCourses) user.enrolledCourses = [];
    user.enrolledCourses.push(courseId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully enrolled ${user.name} in course.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unenroll a student from a course
 * @route   PUT /api/admin/users/:userId/unenroll
 * @access  Private/Admin
 */
exports.unenrollStudent = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    user.enrolledCourses = user.enrolledCourses?.filter(
      id => id.toString() !== courseId.toString()
    ) || [];
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully unenrolled ${user.name} from course.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
