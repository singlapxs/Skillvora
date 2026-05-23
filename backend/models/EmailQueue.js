const mongoose = require('mongoose');

const EmailQueueSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'failed'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmailQueue', EmailQueueSchema);
