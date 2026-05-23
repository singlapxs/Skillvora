const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lecture = require('../models/Lecture');

/**
 * Helper to parse dynamic duration strings to total seconds
 */
const durationToSeconds = (durationStr) => {
  if (!durationStr || typeof durationStr !== 'string') return 300; // Default 5 minutes
  
  let totalSeconds = 0;
  
  // Match hours, minutes, seconds
  const hourMatch = durationStr.match(/(\d+)\s*h/i);
  if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
  
  const minMatch = durationStr.match(/(\d+)\s*m/i);
  if (minMatch) totalSeconds += parseInt(minMatch[1]) * 60;
  
  const secMatch = durationStr.match(/(\d+)\s*s/i);
  if (secMatch) totalSeconds += parseInt(secMatch[1]);
  
  if (totalSeconds === 0) {
    const rawNumber = parseInt(durationStr);
    totalSeconds = !isNaN(rawNumber) ? rawNumber * 60 : 300;
  }
  
  return totalSeconds;
};

/**
 * Helper to calculate course completion percentage weighted by duration seconds
 */
const calculatePercentage = async (courseId, completedLectureIds = []) => {
  const modules = await Module.find({ courseId }).populate('lectures');
  let totalSeconds = 0;
  let completedSeconds = 0;

  const completedSet = new Set(completedLectureIds.map(id => id.toString()));

  for (const mod of modules) {
    if (mod.lectures) {
      for (const lec of mod.lectures) {
        const sec = durationToSeconds(lec.duration);
        totalSeconds += sec;
        if (completedSet.has(lec._id.toString())) {
          completedSeconds += sec;
        }
      }
    }
  }
  
  if (totalSeconds === 0) return 0;
  return Math.round((completedSeconds / totalSeconds) * 100);
};

/**
 * @desc    Get user progress for a single course
 * @route   GET /api/progress/:courseId
 * @access  Private (Approved Users Only)
 */
exports.getProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    let progress = await Progress.findOne({ userId, courseId })
      .populate('completedLectures')
      .populate('lastWatchedLectureId');

    if (!progress) {
      // Return empty progress structure to allow frontend seamless initialization
      return res.status(200).json({
        success: true,
        data: {
          courseId,
          completedLectures: [],
          lastWatchedLectureId: null,
          lastWatchedTimestamp: 0,
          progressPercentage: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle completion status of a lecture
 * @route   POST /api/progress/:courseId/lecture/:lectureId/toggle
 * @access  Private (Approved Users Only)
 */
exports.toggleLectureComplete = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.user._id;

    // Verify lecture exists
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      progress = await Progress.create({
        userId,
        courseId,
        completedLectures: [],
        progressPercentage: 0
      });
    }

    const isAlreadyCompleted = progress.completedLectures.includes(lectureId);

    if (isAlreadyCompleted) {
      // Remove it
      progress.completedLectures = progress.completedLectures.filter(
        (id) => id.toString() !== lectureId.toString()
      );
    } else {
      // Add it
      progress.completedLectures.push(lectureId);
    }

    // Recalculate completion percentage
    progress.progressPercentage = await calculatePercentage(courseId, progress.completedLectures);
    progress.updatedAt = new Date();
    await progress.save();

    const updatedProgress = await Progress.findById(progress._id)
      .populate('completedLectures')
      .populate('lastWatchedLectureId');

    res.status(200).json({
      success: true,
      message: isAlreadyCompleted ? 'Lecture marked as incomplete' : 'Lecture marked as completed!',
      data: updatedProgress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save timestamp / continue watching session
 * @route   POST /api/progress/:courseId/resume
 * @access  Private (Approved Users Only)
 */
exports.updateResumeWatch = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { lectureId, timestamp } = req.body;
    const userId = req.user._id;

    if (!lectureId) {
      return res.status(400).json({ success: false, message: 'Lecture ID is required to update resume state.' });
    }

    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      progress = await Progress.create({
        userId,
        courseId,
        completedLectures: [],
        progressPercentage: 0
      });
    }

    progress.lastWatchedLectureId = lectureId;
    progress.lastWatchedTimestamp = timestamp || 0;
    progress.updatedAt = new Date();
    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Playback resume session saved.',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics for student
 * @route   GET /api/progress/dashboard
 * @access  Private (Approved Users Only)
 */
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all user progress nodes
    const progressList = await Progress.find({ userId })
      .populate({
        path: 'courseId',
        populate: { path: 'category' }
      })
      .populate('lastWatchedLectureId')
      .sort({ updatedAt: -1 });

    // Format active enrollments
    const activeCourses = progressList.map(prog => {
      return {
        course: prog.courseId,
        progressPercentage: prog.progressPercentage,
        lastWatchedLecture: prog.lastWatchedLectureId,
        lastWatchedTimestamp: prog.lastWatchedTimestamp,
        updatedAt: prog.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      count: activeCourses.length,
      data: activeCourses
    });
  } catch (error) {
    next(error);
  }
};
