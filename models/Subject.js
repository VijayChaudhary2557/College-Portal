const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    default: null // Optional - if null, subject is for all sections of that year
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Assigned faculty for this subject
  },
  credits: {
    type: Number,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', subjectSchema);

