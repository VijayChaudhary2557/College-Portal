const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Leave = require('../models/Leave');


// Faculty dashboard (for all faculty roles)
router.get('/schedule', isAuthenticated, hasRole('faculty', 'hod', 'coordinator', 'class-advisor'), async (req, res) => {
  try {
    const faculty = await User.findById(req.session.user.id).populate('course').populate('section');
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[today.getDay()];
    // const todayDay = days[3];


    // Get today's schedule
    const todaySchedule = await Timetable.find({
      faculty: faculty._id,
      day: todayDay,
      isActive: true
    }).populate('section').populate('subject').sort('startTime');

    // Get all schedules
    const allSchedules = await Timetable.find({
      faculty: faculty._id,
      isActive: true
    }).populate('subject section').sort('day startTime');

    const students = await User.find({
      role: 'student',
      section: faculty.section._id
    }).select('_id');

    // 2. Extract student IDs
    const studentIds = students.map(student => student._id);

    // 3. Fetch all pending leaves of those students
    const pendingLeaves = await Leave.find({
      student: { $in: studentIds },
      status: 'pending'
    })
    .populate('student')     // student details
    .sort({ date: -1 });

    // const pendingLeaves = await Leave.find({
    //       // student: { $in: studentIds },
    //       status: 'pending'
    //     }).populate('student').sort('-date');
    
    //     console.log('Pending Leaves:', pendingLeaves);

    res.render('faculty/dashboard', {
      title: 'Faculty Dashboard',
      faculty,
      todaySchedule,
      pendingLeaves,
      allSchedules
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/');
  }
});


// Schedule

router.get('/dashboard', isAuthenticated, hasRole('faculty', 'hod', 'coordinator', 'class-advisor'), async (req, res) => {
  try {
    const faculty = await User.findById(req.session.user.id).populate('course').populate('section');
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[today.getDay()];
    // const todayDay = days[3];

    // Get today's schedule
    const todaySchedule = await Timetable.find({
      faculty: faculty._id,
      day: todayDay,
      isActive: true
    }).populate('section').populate('subject').sort('startTime');

    // Get all schedules
    const allSchedules = await Timetable.find({
      faculty: faculty._id,
      isActive: true
    }).populate('subject section').sort('day startTime');

    res.render('faculty/schedule', {
      title: 'Faculty Schedule',
      faculty,
      todaySchedule,
      allSchedules
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/');
  }
});


// Mark attendance
router.get('/attendance/:timetableId', isAuthenticated, hasRole('faculty', 'hod', 'coordinator', 'class-advisor'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.timetableId)
      .populate('section subject');
    
    if (!timetable) {
      req.session.error_msg = 'Class not found';
      return res.redirect('/faculty/dashboard');
    }

    const now = new Date();

    let today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    today = today.toISOString();

    // Get today's attendance
    const attendanceRecords = await Attendance.find({
      subject: timetable.subject._id,
      section: timetable.section._id,
      date: today
    });

    console.log('Attendance records for today:', attendanceRecords);

    const attendanceMap = {};
    attendanceRecords.forEach(att => {
      console.log('Attendance record:', att);
      attendanceMap[att.student.toString()] = att.status;
    });

    // console.log('Attendance records:', attendanceMap);

    const students = await User.find({ role: 'student', section: timetable.section._id });

    res.render('faculty/mark-attendance', {
      title: 'Mark Attendance',
      timetable,
      section: timetable.section,
      attendanceMap,
      today,
      students
    });
  } catch (error) {
    console.error('Attendance error:', error);
    req.session.error_msg = 'Error loading attendance page';
    res.redirect('/faculty/dashboard');
  }
});

router.post('/attendance/:timetableId', isAuthenticated, hasRole('faculty', 'hod', 'coordinator', 'class-advisor'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.timetableId);
    const { attendance } = req.body; // { studentId: 'present'/'absent' }
    
    const now = new Date();

    let today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    today = today.toISOString();

    // Delete existing attendance for today
    await Attendance.deleteMany({
      subject: timetable.subject._id,
      section: timetable.section._id,
      date: today,
      status: { $ne: 'leave' }
    });

    // Create new attendance records
    for (let studentId in attendance) {
      const status = attendance[studentId];
      const existingLeave = await require('../models/Leave').findOne({
        student: studentId,
        date: today,
        status: { $in: ['approved-by-advisor', 'approved-by-coordinator', 'approved-by-hod'] }
      });

      const attendanceRecord = new Attendance({
        student: studentId,
        subject: timetable.subject._id,
        section: timetable.section._id,
        date: today,
        status: existingLeave ? 'leave' : status,
        markedBy: req.session.user.id
      });

      console.log('Saving attendance:', attendanceRecord);
      await attendanceRecord.save();
    }

    req.session.success_msg = 'Attendance marked successfully';
    res.redirect('/faculty/dashboard');
  } catch (error) {
    console.error('Mark attendance error:', error);
    req.session.error_msg = 'Error marking attendance';
    res.redirect('/faculty/dashboard');
  }
});

module.exports = router;

