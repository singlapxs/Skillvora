const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a module title'],
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  lectures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture'
  }]
});

module.exports = mongoose.model('Module', ModuleSchema);
