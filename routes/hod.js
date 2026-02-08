const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Leave = require('../models/Leave');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');

// HOD Dashboard
router.get('/dashboard', isAuthenticated, hasRole('hod'), async (req, res) => {
  try {
    const hod = await User.findById(req.session.user.id).populate('course');
    const course = await Course.findOne({ _id: hod.course._id });
    
    let students = [];
    let sections = [];
    if (course) {
      sections = await Section.find({ course: course._id, isActive: true }).populate('course');
      const studentIds = [];
      sections.forEach(sec => {
        sec.students.forEach(student => {
          if (!studentIds.includes(student.toString())) {
            studentIds.push(student.toString());
          }
        });
      });
      students = await User.find({ _id: { $in: studentIds } });
    }


    const leaveStudent = await User.find({ role: 'student', course: course._id }).select('_id');

    const studentIds = leaveStudent.map(s => s._id);

    const pendingLeaves = await Leave.find({
          student: { $in: studentIds },
          status: 'approved-by-coordinator'
        })
        .populate('student')
        .sort({ date: -1 });


    // const pendingLeaves = await Leave.find({
    //   status: 'approved-by-coordinator'
    // }).populate('student').sort('-date');

    res.render('hod/dashboard', {
      title: 'HOD Dashboard',
      course,
      students,
      sections,
      pendingLeaves
    });
  } catch (error) {
    console.error('HOD Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/faculty/dashboard');
  }
});

// Section Management
router.get('/sections', isAuthenticated, hasRole('hod'), async (req, res) => {
  try {
    const hod = await User.findById(req.session.user.id).populate('course');
    const sections = await Section.find({ course: hod.course._id, isActive: true })
      .populate('classAdvisor students');

    console.log(sections);
    
    const classAdvisors = await User.find({
      role: 'faculty',
      section: null,
      position: 'class-advisor'
    });

    res.render('hod/sections', {
      title: 'Sections',
      course: hod.course,
      sections,
      classAdvisors
    });
  } catch (error) {
    console.error('Sections error:', error);
    req.session.error_msg = 'Error loading sections';
    res.redirect('/hod/dashboard');
  }
});

router.post('/sections', isAuthenticated, hasRole('hod'), async (req, res) => {
  try {
    const hod = await User.findById(req.session.user.id).populate('course');
    const { name, year, classAdvisor } = req.body;

    const section = new Section({
      name,
      course: hod.course._id,
      year: parseInt(year),
      classAdvisor: classAdvisor
    });

    await section.save();
    
    await User.findByIdAndUpdate(classAdvisor, { section: section._id });


    req.session.success_msg = 'Section created successfully';
    res.redirect('/hod/sections');
  } catch (error) {
    console.error('Create section error:', error);
    req.session.error_msg = 'Error creating section';
    res.redirect('/hod/sections');
  }
});



router.get('/manage-students/:courseId', isAuthenticated, hasRole('hod'), async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      course: req.params.courseId,
      section: null
    });

    const sections = await Section.find({ course: req.params.courseId, isActive: true });

    res.render('hod/manage-students', {
      title: 'Manage Students',
      students,
      sections
    });
  } catch (error) {
    console.error('Manage students error:', error);
    req.session.error_msg = 'Error loading students';
    res.redirect('/hod/dashboard');
  }
});


// Assign student to section
router.post('/sections/assign-student', isAuthenticated, hasRole('hod'), async (req, res) => {
  try {
    const { studentIds, sectionId } = req.body;

    console.log('Assigning students:', studentIds, 'to section:', sectionId);

    for (const studentId of studentIds) {
        await User.findByIdAndUpdate(studentId, { section: sectionId });
    }

    req.session.success_msg = 'Student assigned to section';
    res.redirect('/hod/sections');
  } catch (error) {
    console.error('Assign student error:', error);
    req.session.error_msg = 'Error assigning student';
    res.redirect('/hod/sections');
  }
});

// Approve leave
router.post('/leave/:id/approve', isAuthenticated, hasRole('hod'), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('student').populate('section');
    leave.status = 'approved-by-hod';
    leave.approvedByHod = req.session.user.id;
    await leave.save();

    let days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]

    const subjects = await Timetable.find({section: leave.section._id, day: days[new Date(leave.date).getDay()]});

    

    const attendance = await Attendance.deleteMany({ student: leave.student._id, date: leave.date });

    console.log(leave.date);


    const now = new Date(leave.date);

    let today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    subjects.forEach(subject => {
      let leaveApplied = new Attendance({
        student: leave.student._id,
        subject: subject.subject._id,
        section: leave.section._id,
        date: today,
        status: 'leave',
        markedBy: req.session.user.id,
      })
      leaveApplied.save();
    });

    req.session.success_msg = 'Leave approved successfully';



    res.redirect('/hod/dashboard');
  } catch (error) {
    console.error('Approve leave error:', error);
    req.session.error_msg = 'Error approving leave';
    res.redirect('/hod/dashboard');
  }
});

router.post('/leave/:id/reject', isAuthenticated, hasRole('hod'), async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await Leave.findById(req.params.id);
    leave.status = 'rejected';
    leave.rejectedBy = req.session.user.id;
    leave.rejectionReason = reason;
    await leave.save();
    req.session.success_msg = 'Leave rejected';
    res.redirect('/hod/dashboard');
  } catch (error) {
    console.error('Reject leave error:', error);
    req.session.error_msg = 'Error rejecting leave';
    res.redirect('/hod/dashboard');
  }
});

module.exports = router;

