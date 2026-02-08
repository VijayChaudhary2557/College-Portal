const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  reason: {
    type: String,
    default: 'Placement Drive'
  },
  status: {
    type: String,
    enum: ['pending', 'approved-by-advisor', 'approved-by-coordinator', 'approved-by-hod', 'rejected'],
    default: 'pending'
  },
  approvedByAdvisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedByCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedByHod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String
  },
  isAutoApplied: {
    type: Boolean,
    default: false
  },
  placement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Placement',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Leave', leaveSchema);

