const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const User = require('../models/User');
const Section = require('../models/Section');
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const Leave = require('../models/Leave');

// Class Advisor Dashboard
router.get('/dashboard', isAuthenticated, hasRole('class-advisor'), async (req, res) => {
  try {
    const advisor = await User.findById(req.session.user.id);
    const sections = await Section.find({ classAdvisor: advisor._id, isActive: true })
      .populate('students course');
    
    let timetables = [];
    if (sections.length > 0) {
      timetables = await Timetable.find({
        section: { $in: sections.map(s => s._id) },
        isActive: true
      }).populate('section subject faculty').sort('day startTime');
    }

    // Get pending leaves for students in advisor's sections
    const studentIds = [];
    sections.forEach(section => {
      section.students.forEach(student => {
        studentIds.push(student._id);
      });
    });

    const pendingLeaves = await Leave.find({
      student: { $in: studentIds },
      status: 'pending'
    }).populate('student').sort('-date');

    res.render('classAdvisor/dashboard', {
      title: 'Class Advisor Dashboard',
      sections,
      timetables,
      pendingLeaves
    });
  } catch (error) {
    console.error('Class Advisor Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/faculty/dashboard');
  }
});

// Schedule lectures
router.get('/schedule', isAuthenticated, hasRole('class-advisor'), async (req, res) => {
  try {
    const advisor = await User.findById(req.session.user.id);
    const sections = await Section.find({ classAdvisor: advisor._id, isActive: true })
      .populate('course');
    
    let subjects = [];
    if (sections.length > 0) {
      const course = sections[0].course;
      subjects = await Subject.find({ course: course._id, isActive: true });
    }

    const faculties = await User.find({ role: 'faculty', isActive: true });

    res.render('classAdvisor/schedule', {
      title: 'Schedule Lectures',
      sections,
      subjects,
      faculties
    });
  } catch (error) {
    console.error('Schedule error:', error);
    req.session.error_msg = 'Error loading schedule page';
    res.redirect('/class-advisor/dashboard');
  }
});

router.post('/schedule', isAuthenticated, hasRole('class-advisor'), async (req, res) => {
  try {
    const { section, subject, faculty, day, startTime, endTime, room } = req.body;
    
    // Check faculty lecture limit
    const facultyUser = await User.findById(faculty);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reset daily count if needed
    if (facultyUser.lastResetDate < today) {
      facultyUser.currentLecturesToday = 0;
      facultyUser.lastResetDate = today;
    }

    if (facultyUser.currentLecturesToday >= facultyUser.maxLecturesPerDay) {
      req.session.error_msg = 'Faculty has reached maximum lectures per day limit (5 lectures)';
      return res.redirect('/class-advisor/schedule');
    }

    // Check if faculty already has a class at this time
    const conflictingClass = await Timetable.findOne({
      faculty: faculty,
      day: day,
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
      ],
      isActive: true
    });

    if (conflictingClass) {
      req.session.error_msg = 'Faculty already has a class scheduled at this time';
      return res.redirect('/class-advisor/schedule');
    }

    const timetable = new Timetable({
      section,
      subject,
      faculty,
      day,
      startTime,
      endTime,
      room
    });

    await timetable.save();

    // Increment faculty lecture count if it's today
    if (day === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]) {
      facultyUser.currentLecturesToday += 1;
      await facultyUser.save();
    }

    req.session.success_msg = 'Lecture scheduled successfully';
    res.redirect('/class-advisor/dashboard');
  } catch (error) {
    console.error('Schedule lecture error:', error);
    req.session.error_msg = 'Error scheduling lecture';
    res.redirect('/class-advisor/schedule');
  }
});

// Approve leave
router.post('/leave/:id/approve', isAuthenticated, hasRole('class-advisor'), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    leave.status = 'approved-by-advisor';
    leave.approvedByAdvisor = req.session.user.id;
    await leave.save();
    req.session.success_msg = 'Leave approved successfully';
    res.redirect('/class-advisor/dashboard');
  } catch (error) {
    console.error('Approve leave error:', error);
    req.session.error_msg = 'Error approving leave';
    res.redirect('/class-advisor/dashboard');
  }
});

router.post('/leave/:id/reject', isAuthenticated, hasRole('class-advisor'), async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await Leave.findById(req.params.id);
    leave.status = 'rejected';
    leave.rejectedBy = req.session.user.id;
    leave.rejectionReason = reason;
    await leave.save();
    req.session.success_msg = 'Leave rejected';
    res.redirect('/class-advisor/dashboard');
  } catch (error) {
    console.error('Reject leave error:', error);
    req.session.error_msg = 'Error rejecting leave';
    res.redirect('/class-advisor/dashboard');
  }
});

module.exports = router;

