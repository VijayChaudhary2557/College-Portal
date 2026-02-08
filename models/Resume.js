const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({

  // kis user ka resume hai
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true   // ek user = ek resume
  },
  jobTitle: {
    type: String,
   },

  /* =====================
     PERSONAL INFORMATION
     ===================== */
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: String
  },

  links: {
    github: {
      type: String,
      default: ''
    },
    linkedin: {
      type: String,
      default: ''
    },
    portfolio: {
      type: String,
      default: ''
    }
  },

  /* =====================
     PROFESSIONAL SUMMARY
     ===================== */
  professionalSummary: {
    type: String,
    required: true
  },

  /* =====================
     EDUCATION (MULTIPLE)
     ===================== */
  education: [
    {
      degree: String,
      institute: String,
      year: String,
      score: String
    }
  ],

  /* =====================
     SKILLS
     ===================== */
  skills: [
    {
      type: String
    }
  ],

  /* =====================
     EXPERIENCE (MULTIPLE)
     ===================== */
  experience: [
    {
      company: String,
      role: String,
      description: String
    }
  ],

  /* =====================
     PROJECTS (MULTIPLE)
     ===================== */
  projects: [
    {
      title: String,
      description: String
    }
  ],

  /* =====================
     META
     ===================== */
  isCompleted: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

// updatedAt auto update
resumeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
