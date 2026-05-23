const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description']
  },
  thumbnail: {
    type: String,
    required: [true, 'Please provide a thumbnail image URL or base64 data']
  },
  instructor: {
    type: String,
    required: [true, 'Please provide an instructor name'],
    default: 'Admin'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please associate a category']
  },
  totalDuration: {
    type: String,
    default: '0h 0m'
  },
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', CourseSchema);
