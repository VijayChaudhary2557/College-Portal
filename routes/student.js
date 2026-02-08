const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Placement = require('../models/Placement');
const Timetable = require('../models/Timetable');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const Resume = require('../models/Resume');

// Admission form
router.get('/admission', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });
    res.render('student/admission', { title: 'Admission', courses });
  } catch (error) {
    console.error('Admission form error:', error);
    req.session.error_msg = 'Error loading admission form';
    res.redirect('/');
  }
});

router.post('/admission', async (req, res) => {
  try {
    const { name, email, password, course, year, fatherName, motherName, phone, address, previousCollege, percentage } = req.body;
    
    const user = new User({
      name,
      email,
      password,
      role: 'student',
      course,
      year: parseInt(year),
      admissionStatus: 'pending',
      admissionData: {
        fatherName,
        motherName,
        phone,
        address,
        previousCollege,
        percentage: parseFloat(percentage)
      }
    });

    await user.save();
    req.session.success_msg = 'Admission application submitted successfully. Please wait for approval.';
    res.redirect('/');
  } catch (error) {
    console.error('Admission error:', error);
    req.session.error_msg = 'Error submitting admission. Email might already exist.';
    res.redirect('/student/admission');
  }
});

// Student dashboard
router.get('/dashboard', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    const student = await User.findById(req.session.user.id).populate('course section');
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);

    const now = new Date();

    let today = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    today = today.toISOString();

    // Get today's timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[(new Date()).getDay()];
    // const todayDay = days[3];
    
    
    let todaySchedule = [];
    if (student.section) {
      todaySchedule = await Timetable.find({
        section: student.section,
        day: todayDay,
        isActive: true
      }).populate('subject faculty').sort('startTime');

      // Check attendance for each class
      for (let schedule of todaySchedule) {
        const attendance = await Attendance.findOne({
          student: student._id,
          subject: schedule.subject._id,
          date: today
        });

        console.log("Schedule: " + schedule.subject._id);
        schedule.attendanceStatus = attendance ? attendance.status : 'not-available';
      }
    }

    // Overall attendance summary
    const allAttendance = await Attendance.find({ student: student._id });
    const attendanceSummary = {};
    
    for (let att of allAttendance) {
      const subjectId = att.subject.toString();
      if (!attendanceSummary[subjectId]) {
        attendanceSummary[subjectId] = { present: 0, absent: 0, leave: 0, total: 0 };
      }
      attendanceSummary[subjectId].total++;
      if (att.status === 'present') attendanceSummary[subjectId].present++;
      else if (att.status === 'absent') attendanceSummary[subjectId].absent++;
      else if (att.status === 'leave') attendanceSummary[subjectId].leave++;
    }

    // Get subjects for this student's course and year
    const subjects = await Subject.find({ 
      course: student.course, 
      year: student.year,
      isActive: true 
    });

    // Calculate attendance percentage for each subject
    const subjectAttendance = [];
    for (let subject of subjects) {
      const summary = attendanceSummary[subject._id.toString()] || { present: 0, total: 0 };
      const percentage = summary.total > 0 ? ((summary.present + summary.leave) / summary.total * 100).toFixed(2) : 0;
      subjectAttendance.push({
        subject,
        ...summary,
        percentage
      });
    }

    res.render('student/dashboard', {
      title: 'Student Dashboard',
      student,
      todaySchedule,
      subjectAttendance
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/');
  }
});

// Leave application
router.get('/leave', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    const student = await User.findById(req.session.user.id);
    const leaves = await Leave.find({ student: student._id }).sort('-date');
    res.render('student/leave', { title: 'Apply Leave', leaves });
  } catch (error) {
    console.error('Leave error:', error);
    req.session.error_msg = 'Error loading leave page';
    res.redirect('/student/dashboard');
  }
});

router.post('/leave', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    const { date, reason } = req.body;
    const student = await User.findById(req.session.user.id).populate('section');

    const leave = new Leave({
      student: student._id,
      section: student.section._id,
      date: new Date(date),
      reason: reason || 'Personal',
      isAutoApplied: false
    });

    await leave.save();
    req.session.success_msg = 'Leave applied successfully';
    res.redirect('/student/leave');
  } catch (error) {
    console.error('Apply leave error:', error);
    req.session.error_msg = 'Error applying leave';
    res.redirect('/student/leave');
  }
});

router.get('/resume', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    const resume = await Resume.findOne({
      user: req.session.user.id
    });
    res.render('student/resume', {
      title: 'My Resume',
      resume   // 👈 EJS ko bhej diya
    });
  } catch (error) {
    console.error('Resume page error:', error);
    req.session.error_msg = 'Error loading resume';
    res.redirect('/student/dashboard');
  }
});


router.get(
  '/resume/view',
  isAuthenticated,
  hasRole('student'),
  async (req, res) => {
    try {
      const resume = await Resume.findOne({ user: req.session.user.id });

      if (!resume) {
        req.session.error_msg = 'Please create your resume first';
        return res.redirect('/student/resume');
      }

      res.render('student/view-resume', {
        title: 'My Resume',
        resume
      });
    } catch (err) {
      console.error(err);
      res.redirect('/student/resume');
    }
  }
);

router.post('/resume', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
      const userId = req.session.user.id;

      const {
        fullName,
        email,
        phone,
        location,
        objective,
        jobTitle,

        github,
        linkedin,
        portfolio,

        // education
        educationDegree = [],
        educationInstitute = [],
        educationYear = [],
        educationScore = [],

        // skills
        skills = [],

        // experience
        experienceCompany = [],
        experienceRole = [],
        experienceDesc = [],

        // projects
        projectTitle = [],
        projectDesc = []
      } = req.body;

      /* =========================
         EDUCATION ARRAY BUILD
         ========================= */
      const education = educationDegree.map((_, index) => ({
        degree: educationDegree[index],
        institute: educationInstitute[index],
        year: educationYear[index],
        score: educationScore[index]
      }));

      /* =========================
         EXPERIENCE ARRAY BUILD
         ========================= */
      const experience = experienceCompany.map((_, index) => ({
        company: experienceCompany[index],
        role: experienceRole[index],
        description: experienceDesc[index]
      }));

      /* =========================
         PROJECTS ARRAY BUILD
         ========================= */
      const projects = projectTitle.map((_, index) => ({
        title: projectTitle[index],
        description: projectDesc[index]
      }));

      /* =========================
         CHECK EXISTING RESUME
         ========================= */
      let resume = await Resume.findOne({ user: userId });

      if (resume) {
        // UPDATE
        resume.fullName = fullName;
        resume.email = email;
        resume.phone = phone;
        resume.location = location;
        resume.professionalSummary = objective;

        resume.education = education;
        resume.skills = Array.isArray(skills) ? skills : [skills];
        resume.experience = experience;
        resume.projects = projects;
        resume.jobTitle = jobTitle;

        resume.isCompleted = true;

        resume.links = {
          github,
          linkedin,
          portfolio
        };

        await resume.save();

        req.session.success_msg = 'Resume updated successfully';
      } else {
        // CREATE
        resume = new Resume({
          user: userId,
          fullName,
          jobTitle,
          email,
          phone,
          location,
          professionalSummary: objective,
          links: {
            github,
            linkedin,
            portfolio
          },
          education,
          skills: Array.isArray(skills) ? skills : [skills],
          experience,
          projects,
          isCompleted: true
        });

        await resume.save();

        req.session.success_msg = 'Resume created successfully';
      }

      res.redirect('/student/resume/view');

    } catch (error) {
      console.error('Resume create/update error:', error);
      req.session.error_msg = 'Error saving resume';
      res.redirect('/student/resume');
    }
});

// Placements
router.get('/placements', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    const student = await User.findById(req.session.user.id);
    const placements = await Placement.find({
      eligibleCourses: student.course,
      isActive: true
    }).sort('-createdAt');

    // Check which placements student has applied for
    for (let placement of placements) {
      const application = placement.applications.find(app => app.student.toString() === student._id.toString());
      placement.userApplication = application || null;
    }

    // Get notifications
    const notifications = await Notification.find({
      user: student._id,
      isRead: false
    }).sort('-createdAt').limit(10);

    res.render('student/placements', {
      title: 'Placements',
      placements,
      notifications
    });
  } catch (error) {
    console.error('Placements error:', error);
    req.session.error_msg = 'Error loading placements';
    res.redirect('/student/dashboard');
  }
});

router.post('/placements/:id/apply', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    const student = await User.findById(req.session.user.id);
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
      req.session.error_msg = 'Placement not found';
      return res.redirect('/student/placements');
    }

    // Check if already applied
    const existingApplication = placement.applications.find(
      app => app.student.toString() === student._id.toString()
    );

    if (existingApplication) {
      req.session.error_msg = 'You have already applied for this placement';
      return res.redirect('/student/placements');
    }

    // Check last date
    if (new Date() > new Date(placement.lastDateToApply)) {
      req.session.error_msg = 'Last date to apply has passed';
      return res.redirect('/student/placements');
    }

    placement.applications.push({
      student: student._id,
      status: 'interested'
    });

    await placement.save();

    // Auto-apply leave for placement date
    const leaveDate = new Date(placement.driveDate);
    leaveDate.setHours(0, 0, 0, 0);

    const existingLeave = await Leave.findOne({
      student: student._id,
      date: leaveDate
    });

    if (!existingLeave) {
      const leave = new Leave({
        student: student._id,
        date: leaveDate,
        section: student.section,
        reason: `Placement Drive - ${placement.companyName}`,
        isAutoApplied: true,
        placement: placement._id,
        status: 'pending'
      });
      await leave.save();
    }

    req.session.success_msg = 'Applied for placement successfully. Leave auto-applied for drive date.';
    res.redirect('/student/placements');
  } catch (error) {
    console.error('Apply placement error:', error);
    req.session.error_msg = 'Error applying for placement';
    res.redirect('/student/placements');
  }
});

// Mark notification as read
router.post('/notifications/:id/read', isAuthenticated, hasRole('student'), async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;

