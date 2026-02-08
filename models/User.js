const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'faculty', 'hod', 'coordinator', 'class-advisor', 'placement-manager'],
    required: true
  },
  // Student specific fields
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    default: null
  },
  year: {
    type: Number,
    default: null
  },
  admissionStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  admissionData: {
    fatherName: String,
    motherName: String,
    phone: String,
    address: String,
    previousCollege: String,
    percentage: Number
  },
  // Faculty specific fields
  facultyId: {
    type: String,
    unique: true,
    sparse: true
  },
  position: {
    type: String,
    enum: ['faculty', 'hod', 'coordinator', 'class-advisor', 'placement-manager'],
    default: 'faculty'
  },
  assignedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  maxLecturesPerDay: {
    type: Number,
    default: 5
  },
  currentLecturesToday: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

