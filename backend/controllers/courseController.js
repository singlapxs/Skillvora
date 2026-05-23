const Course = require('../models/Course');
const Module = require('../models/Module');
const Lecture = require('../models/Lecture');
const Category = require('../models/Category');
const { convertToEmbedUrl } = require('../utils/driveHelper');

/**
 * Estimate dynamic lesson duration consistently based on title content
 */
const estimateDuration = (title) => {
  if (!title) return '15m';
  const charSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const totalSeconds = 480 + (charSum % 900); // 8 minutes (480s) to 23 minutes (1380s)
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

/**
 * @desc    Get all courses with search, category filtering and sorting
 * @route   GET /api/courses
 * @access  Public
 */
exports.getCourses = async (req, res, next) => {
  try {
    const { q, category, sort } = req.query;
    let queryObj = {};

    // Search query filter
    if (q) {
      queryObj.title = { $regex: q, $options: 'i' };
    }

    // Category filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        queryObj.category = categoryDoc._id;
      } else {
        // Category slug invalid, return empty array
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }

    let query = Course.find(queryObj).populate('category');

    // Sorting options
    if (sort === 'latest') {
      query = query.sort({ createdAt: -1 });
    } else if (sort === 'oldest') {
      query = query.sort({ createdAt: 1 });
    } else {
      // Default sort
      query = query.sort({ createdAt: -1 });
    }

    const courses = await query;

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single course with nested modules and lectures
 * @route   GET /api/courses/:id
 * @access  Public
 */
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('category')
      .populate({
        path: 'modules',
        options: { sort: { order: 1 } },
        populate: {
          path: 'lectures',
          options: { sort: { order: 1 } }
        }
      });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private/Admin
 */
exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, thumbnail, instructor, category, totalDuration } = req.body;

    if (!title || !description || !thumbnail || !category) {
      return res.status(400).json({ success: false, message: 'Please provide course title, description, thumbnail and category.' });
    }

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: 'Category not found.' });
    }

    const course = await Course.create({
      title,
      description,
      thumbnail,
      instructor: instructor || 'Admin',
      category,
      totalDuration: totalDuration || '0h 0m'
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id
 * @access  Private/Admin
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a course and all its modules and lectures
 * @route   DELETE /api/courses/:id
 * @access  Private/Admin
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Delete related modules and lectures
    const modules = await Module.find({ courseId: course._id });
    for (const mod of modules) {
      await Lecture.deleteMany({ moduleId: mod._id });
    }
    await Module.deleteMany({ courseId: course._id });
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course and all associated materials deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a module inside a course
 * @route   POST /api/courses/:courseId/modules
 * @access  Private/Admin
 */
exports.createModule = async (req, res, next) => {
  try {
    const { title, order } = req.body;
    const courseId = req.params.courseId;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Module title is required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const newModule = await Module.create({
      courseId,
      title,
      order: order || 0
    });

    // Add module reference to course
    course.modules.push(newModule._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Module added successfully.',
      data: newModule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a module title or ordering
 * @route   PUT /api/courses/modules/:moduleId
 * @access  Private/Admin
 */
exports.updateModule = async (req, res, next) => {
  try {
    const { title, order } = req.body;
    const moduleDoc = await Module.findById(req.params.moduleId);

    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    if (title) moduleDoc.title = title;
    if (order !== undefined) moduleDoc.order = order;
    await moduleDoc.save();

    res.status(200).json({
      success: true,
      message: 'Module updated successfully.',
      data: moduleDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a module and its lectures
 * @route   DELETE /api/courses/modules/:moduleId
 * @access  Private/Admin
 */
exports.deleteModule = async (req, res, next) => {
  try {
    const moduleDoc = await Module.findById(req.params.moduleId);

    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    // Delete associated lectures
    await Lecture.deleteMany({ moduleId: moduleDoc._id });

    // Remove from Course modules array
    await Course.findByIdAndUpdate(moduleDoc.courseId, {
      $pull: { modules: moduleDoc._id }
    });

    await moduleDoc.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Module and all associated lectures deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a lecture inside a module
 * @route   POST /api/courses/modules/:moduleId/lectures
 * @access  Private/Admin
 */
exports.createLecture = async (req, res, next) => {
  try {
    const { title, type, videoUrl, fileUrl, fileSize, duration, order } = req.body;
    const moduleId = req.params.moduleId;

    if (!title || !type) {
      return res.status(400).json({ success: false, message: 'Lecture title and type are required.' });
    }

    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    // Requirement 4 & 27: Process Google Drive URLs immediately into secure embeds
    let parsedVideoUrl = videoUrl;
    let parsedFileUrl = fileUrl;

    if (type === 'video' && videoUrl) {
      parsedVideoUrl = convertToEmbedUrl(videoUrl);
    } else if (type === 'pdf' && fileUrl) {
      parsedFileUrl = convertToEmbedUrl(fileUrl);
    }

    // Auto duration estimation trigger
    let finalDuration = duration;
    if (!finalDuration || finalDuration === '0m') {
      if (type === 'video') {
        finalDuration = estimateDuration(title);
      } else if (type === 'pdf') {
        finalDuration = '5m';
      } else {
        finalDuration = '3m';
      }
    }

    const lecture = await Lecture.create({
      moduleId,
      courseId: moduleDoc.courseId,
      title,
      type,
      videoUrl: parsedVideoUrl,
      fileUrl: parsedFileUrl,
      fileSize: fileSize || '0 MB',
      duration: finalDuration,
      order: order || 0
    });

    // Reference in Module
    moduleDoc.lectures.push(lecture._id);
    await moduleDoc.save();

    res.status(201).json({
      success: true,
      message: 'Lecture created successfully.',
      data: lecture
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a lecture details
 * @route   PUT /api/courses/lectures/:lectureId
 * @access  Private/Admin
 */
exports.updateLecture = async (req, res, next) => {
  try {
    const { title, type, videoUrl, fileUrl, fileSize, duration, order } = req.body;
    const lecture = await Lecture.findById(req.params.lectureId);

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    if (title) lecture.title = title;
    if (type) lecture.type = type;
    if (fileSize) lecture.fileSize = fileSize;
    if (duration) lecture.duration = duration;
    if (order !== undefined) lecture.order = order;

    // Reprocess Drive Links if changed
    if (videoUrl) {
      lecture.videoUrl = convertToEmbedUrl(videoUrl);
    }
    if (fileUrl) {
      lecture.fileUrl = convertToEmbedUrl(fileUrl);
    }

    await lecture.save();

    res.status(200).json({
      success: true,
      message: 'Lecture updated successfully.',
      data: lecture
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a lecture from module
 * @route   DELETE /api/courses/lectures/:lectureId
 * @access  Private/Admin
 */
exports.deleteLecture = async (req, res, next) => {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    // Pull from Module array
    await Module.findByIdAndUpdate(lecture.moduleId, {
      $pull: { lectures: lecture._id }
    });

    await lecture.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request course enrollment access
 * @route   POST /api/courses/:courseId/request
 * @access  Private
 */
exports.requestCourseEnrollment = async (req, res, next) => {
  try {
    const CourseRequest = require('../models/CourseRequest');
    const { sendCourseRequestNotification } = require('../utils/emailService');
    const Course = require('../models/Course');

    const courseId = req.params.courseId;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Check if user is already enrolled
    const isEnrolled = req.user.enrolledCourses?.some(
      (id) => id.toString() === courseId.toString()
    );
    if (isEnrolled) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
    }

    // Check if there is already a pending request
    const existingRequest = await CourseRequest.findOne({
      user: userId,
      course: courseId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'You have already submitted a pending request for this course.' });
    }

    // Create the CourseRequest
    const newRequest = await CourseRequest.create({
      user: userId,
      course: courseId
    });

    // Send email notification to the Admin!
    await sendCourseRequestNotification(req.user.name, req.user.email, course.title);

    res.status(201).json({
      success: true,
      message: 'Access request submitted successfully! The administrator has been notified.',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get course request status for logged in student
 * @route   GET /api/courses/:courseId/request-status
 * @access  Private
 */
exports.getCourseRequestStatus = async (req, res, next) => {
  try {
    const CourseRequest = require('../models/CourseRequest');
    const courseId = req.params.courseId;
    const userId = req.user.id;

    const request = await CourseRequest.findOne({
      user: userId,
      course: courseId
    }).sort({ createdAt: -1 }); // Get the latest request

    res.status(200).json({
      success: true,
      data: request ? request.status : null
    });
  } catch (error) {
    next(error);
  }
};
