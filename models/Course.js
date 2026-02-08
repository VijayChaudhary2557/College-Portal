const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  duration: {
    type: Number, // in years
    default: 3
  },
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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

module.exports = mongoose.model('Course', courseSchema);

