const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Leave = require('../models/Leave');
const { resetDailyLectures } = require('../utils/helpers');

// Coordinator Dashboard
router.get('/dashboard', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const coordinator = await User.findById(req.session.user.id).populate('course');

    const section = await Section.find({ course: coordinator.course._id });

    const faculties = await User.find({ position: 'class-advisor', course: coordinator.course._id });

    const subjects = await Subject.find({ course: coordinator.course._id }).populate('faculty');

    // return res.json({ subjects: subjects });


    const students = await User.find({ role: 'student', course: coordinator.course._id }).select('_id');

    const studentIds = students.map(s => s._id);

    const pendingLeaves = await Leave.find({
      student: { $in: studentIds },
      status: 'approved-by-advisor'
    })
    .populate('student')
    .sort({ date: -1 });

    console.log('Pending Leaves:', pendingLeaves);

    res.render('coordinator/dashboard', { 
      title: 'Coordinator Dashboard',
      user: coordinator,
      sections: section,
      faculties: faculties,
      pendingLeaves: pendingLeaves,
      subjects: subjects
    });
  } catch (error) {
    console.error('Coordinator Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/faculty/dashboard');
  }
});

// Subject Management
router.get('/subjects', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const coordinator = await User.findById(req.session.user.id).populate('course');
    if (!coordinator) {
      req.session.error_msg = 'Coordinator not found';
      return res.redirect('/auth/login');
    }
    
    if (!coordinator.course) {
      req.session.error_msg = 'Course not assigned. Please contact admin to assign you to a course.';
      return res.redirect('/coordinator/dashboard');
    }

    const sections = await Section.find({ course: coordinator.course._id, isActive: true }).sort('year name');
    const subjects = await Subject.find({ course: coordinator.course._id, isActive: true })
      .populate({
        path: 'section',
        select: 'name year'
      })
      .populate({
        path: 'faculty',
        select: 'name email'
      })
      .sort('year name');
    const faculties = await User.find({ position: 'class-advisor', isActive: true, course: coordinator.course._id });

    res.render('coordinator/subjects', {
      title: 'Subject Management',
      sections: sections || [],
      subjects: subjects || [],
      faculties: faculties || []
    });
  } catch (error) {
    console.error('Subjects error:', error);
    req.session.error_msg = `Error loading subjects page: ${error.message}`;
    res.redirect('/coordinator/dashboard');
  }
});

router.post('/subjects', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const coordinator = await User.findById(req.session.user.id).populate('course');
    
    if (!coordinator.course) {
      req.session.error_msg = 'Course not found';
      return res.redirect('/coordinator/subjects');
    }

    const { name, year, faculty, credits } = req.body;
    code = "MCA-"+Math.floor(1000 + Math.random() * 9000);
    // Check if subject code already exists for this course
    const existingSubject = await Subject.findOne({ name, code, course: coordinator.course._id });
    if (existingSubject) {
      req.session.error_msg = 'Subject code already exists for this course';
      return res.redirect('/coordinator/subjects');
    }

    const subject = new Subject({
      name,
      code,
      course: coordinator.course._id,
      year: parseInt(year),
      faculty: faculty,
      credits: parseInt(credits) || 3
    });

    await subject.save();
    req.session.success_msg = 'Subject created successfully';
    res.redirect('/coordinator/subjects');
  } catch (error) {
    console.error('Create subject error:', error);
    req.session.error_msg = 'Error creating subject';
    res.redirect('/coordinator/subjects');
  }
});

// Assign faculty to subject
router.post('/subjects/:id/assign-faculty', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const { facultyId } = req.body;
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      req.session.error_msg = 'Subject not found';
      return res.redirect('/coordinator/subjects');
    }

    if (facultyId) {
      const faculty = await User.findById(facultyId);
      if (!faculty || faculty.role !== 'faculty') {
        req.session.error_msg = 'Invalid faculty member selected';
        return res.redirect('/coordinator/subjects');
      }
      subject.faculty = facultyId;
    } else {
      subject.faculty = null;
    }

    await subject.save();
    req.session.success_msg = 'Faculty assigned to subject successfully';
    res.redirect('/coordinator/subjects');
  } catch (error) {
    console.error('Assign faculty error:', error);
    req.session.error_msg = 'Error assigning faculty';
    res.redirect('/coordinator/subjects');
  }
});

// Update subject
router.post('/subjects/:id/update', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const { name, code, year, section, credits } = req.body;
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      req.session.error_msg = 'Subject not found';
      return res.redirect('/coordinator/subjects');
    }

    // Check if code is being changed and if new code already exists
    if (code !== subject.code) {
      const existingSubject = await Subject.findOne({ code, course: subject.course, isActive: true, _id: { $ne: subject._id } });
      if (existingSubject) {
        req.session.error_msg = 'Subject code already exists for this course';
        return res.redirect('/coordinator/subjects');
      }
    }

    subject.name = name;
    subject.code = code;
    subject.year = parseInt(year);
    subject.section = section || null;
    subject.credits = parseInt(credits) || 3;

    await subject.save();
    req.session.success_msg = 'Subject updated successfully';
    res.redirect('/coordinator/subjects');
  } catch (error) {
    console.error('Update subject error:', error);
    req.session.error_msg = 'Error updating subject';
    res.redirect('/coordinator/subjects');
  }
});

// Delete/Deactivate subject
router.post('/subjects/:id/delete', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      req.session.error_msg = 'Subject not found';
      return res.redirect('/coordinator/subjects');
    }

    // Check if subject is used in timetable
    const timetableCount = await Timetable.countDocuments({ subject: subject._id, isActive: true });
    if (timetableCount > 0) {
      // Deactivate instead of delete
      subject.isActive = false;
      await subject.save();
      req.session.success_msg = 'Subject deactivated (it is being used in timetable)';
    } else {
      // Can safely delete
      await Subject.findByIdAndDelete(subject._id);
      req.session.success_msg = 'Subject deleted successfully';
    }

    res.redirect('/coordinator/subjects');
  } catch (error) {
    console.error('Delete subject error:', error);
    req.session.error_msg = 'Error deleting subject';
    res.redirect('/coordinator/subjects');
  }
});

// Timetable Management
router.get('/timetable', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const coordinator = await User.findById(req.session.user.id).populate('course');
    if (!coordinator) {
      req.session.error_msg = 'Coordinator not found';
      return res.redirect('/auth/login');
    }
    
    if (!coordinator.course) {
      req.session.error_msg = 'Course not assigned. Please contact admin to assign you to a course.';
      return res.redirect('/coordinator/dashboard');
    }

    const sections = await Section.find({ course: coordinator.course._id, isActive: true }).sort('year name');
    const subjects = await Subject.find({ course: coordinator.course._id, isActive: true }).sort('year name');
    const faculties = await User.find({ position: 'class-advisor', isActive: true, course: coordinator.course._id });
    
    // Get existing timetable entries grouped by section
    let timetables = [];
    if (sections && sections.length > 0) {
      timetables = await Timetable.find({
        section: { $in: sections.map(s => s._id) },
        isActive: true
      })
      .populate({
        path: 'section',
        select: 'name year'
      })
      .populate({
        path: 'subject',
        select: 'name code'
      })
      .populate({
        path: 'faculty',
        select: 'name email'
      })
      .sort('day startTime');
    }

    res.render('coordinator/timetable', {
      title: 'Timetable',
      course: coordinator.course,
      sections: sections || [],
      subjects: subjects || [],
      faculties: faculties || [],
      timetables: timetables || []
    });
  } catch (error) {
    console.error('Timetable error:', error);
    req.session.error_msg = `Error loading timetable page: ${error.message}`;
    res.redirect('/coordinator/dashboard');
  }
});

router.post('/timetable', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const { section, subject, faculty, day, startTime, endTime, room } = req.body;
    
    const scheduleConflict = await Timetable.findOne({section, day, startTime, endTime });

    if (scheduleConflict) {
      req.session.error_msg = 'Schedule conflict: There is already a lecture scheduled for this section at the given time';
      return res.redirect('/coordinator/timetable');
    } 
      
    const scheduleConflictFaculty = await Timetable.findOne({faculty, day, startTime, endTime });

    if (scheduleConflictFaculty) {
      req.session.error_msg = 'Schedule conflict: Faculty has another lecture scheduled at the given time';
      return res.redirect('/coordinator/timetable');
    }

    // Check faculty lecture limit
    const facultyUser = await User.findById(faculty);
    if (facultyUser.currentLecturesToday >= facultyUser.maxLecturesPerDay) {
      req.session.error_msg = 'Faculty has reached maximum lectures per day limit';
      return res.redirect('/coordinator/timetable');
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
    req.session.success_msg = 'Timetable entry added successfully';
    res.redirect('/coordinator/timetable');
  } catch (error) {
    console.error('Create timetable error:', error);
    req.session.error_msg = 'Error creating timetable';
    res.redirect('/coordinator/timetable');
  }
});


router.get('/timetable/:id', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      req.session.error_msg = 'Timetable entry not found';
      return res.redirect('/coordinator/timetable');
    }
    req.session.success_msg = 'Timetable entry deleted successfully';
    res.redirect('/coordinator/timetable');
  } catch (error) {
    console.error('Delete timetable error:', error);
    req.session.error_msg = 'Error deleting timetable entry';
    res.redirect('/coordinator/timetable');
  }
});


// Approve leave
router.post('/leave/:id/approve', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    leave.status = 'approved-by-coordinator';
    leave.approvedByCoordinator = req.session.user.id;
    await leave.save();
    req.session.success_msg = 'Leave approved successfully';
    res.redirect('/coordinator/dashboard');
  } catch (error) {
    console.error('Approve leave error:', error);
    req.session.error_msg = 'Error approving leave';
    res.redirect('/coordinator/dashboard');
  }
});

router.post('/leave/:id/reject', isAuthenticated, hasRole('coordinator'), async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await Leave.findById(req.params.id);
    leave.status = 'rejected';
    leave.rejectedBy = req.session.user.id;
    leave.rejectionReason = reason;
    await leave.save();
    req.session.success_msg = 'Leave rejected';
    res.redirect('/coordinator/dashboard');
  } catch (error) {
    console.error('Reject leave error:', error);
    req.session.error_msg = 'Error rejecting leave';
    res.redirect('/coordinator/dashboard');
  }
});

module.exports = router;

