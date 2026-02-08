const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  ctc: {
    type: String,
    required: true
  },
  requirements: {
    graduationMarks: {
      type: Number,
      default: 0
    },
    twelfthMarks: {
      type: Number,
      default: 0
    },
    knowledge: [String],
    position: String
  },
  eligibleCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }],
  driveDate: {
    type: Date,
    required: true
  },
  lastDateToApply: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['interested', 'written-test', 'technical-interview', 'coding-round', 'final-round', 'selected', 'rejected'],
      default: 'interested'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Placement', placementSchema);

