const mongoose = require('mongoose');

const LectureSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a lecture title'],
    trim: true
  },
  type: {
    type: String,
    enum: ['video', 'pdf', 'notes', 'assignment'],
    required: [true, 'Please specify lecture type (video, pdf, notes, or assignment)']
  },
  videoUrl: {
    type: String
  },
  fileUrl: {
    type: String
  },
  fileSize: {
    type: String,
    default: '0 MB'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  duration: {
    type: String,
    default: '0m'
  }
});

module.exports = mongoose.model('Lecture', LectureSchema);
