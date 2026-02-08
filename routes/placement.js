const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const User = require('../models/User');
const Placement = require('../models/Placement');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { sendPlacementNotification, sendPlacementReminder } = require('../utils/email');

// Placement Manager Dashboard
router.get('/dashboard', isAuthenticated, hasRole('placement-manager'), async (req, res) => {
  try {
    const placements = await Placement.find({ isActive: true })
      .populate('eligibleCourses createdBy')
      .sort('-createdAt');

    // Get statistics
    let totalApplications = 0;
    placements.forEach(p => {
      totalApplications += p.applications.length;
    });

    res.render('placement/dashboard', {
      title: 'Placement Manager Dashboard',
      placements,
      totalApplications,
      user: req.session.user
    });
  } catch (error) {
    console.error('Placement Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/faculty/dashboard');
  }
});

// Create Placement
router.get('/create', isAuthenticated, hasRole('placement-manager'), async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });
    res.render('placement/create', { 
      title: 'Create Placement', 
      courses,
      user: req.session.user
    });
  } catch (error) {
    console.error('Create placement error:', error);
    req.session.error_msg = 'Error loading create page';
    res.redirect('/placement/dashboard');
  }
});

router.post('/create', isAuthenticated, hasRole('placement-manager'), async (req, res) => {
  try {
    const {
      companyName,
      jobTitle,
      description,
      location,
      ctc,
      graduationMarks,
      twelfthMarks,
      knowledge,
      position,
      eligibleCourses,
      driveDate,
      lastDateToApply
    } = req.body;

    const placement = new Placement({
      companyName,
      jobTitle,
      description,
      location,
      ctc,
      requirements: {
        graduationMarks: parseFloat(graduationMarks) || 0,
        twelfthMarks: parseFloat(twelfthMarks) || 0,
        knowledge: Array.isArray(knowledge) ? knowledge : [knowledge],
        position
      },
      eligibleCourses: Array.isArray(eligibleCourses) ? eligibleCourses : [eligibleCourses],
      driveDate: new Date(driveDate),
      lastDateToApply: new Date(lastDateToApply),
      createdBy: req.session.user.id
    });

    await placement.save();

    // Send notifications to eligible students
    const students = await User.find({
      role: 'student',
      course: { $in: placement.eligibleCourses },
      admissionStatus: 'approved'
    }).populate('course');

    for (let student of students) {
      // Create notification
      const notification = new Notification({
        user: student._id,
        title: 'New Placement Opportunity',
        message: `${placement.companyName} - ${placement.jobTitle} placement drive is available. Last date to apply: ${new Date(placement.lastDateToApply).toLocaleDateString()}`,
        type: 'info',
        placement: placement._id
      });
      await notification.save();

      // Send email
      await sendPlacementNotification(
        student.email,
        student.course.name,
        placement.companyName,
        placement.driveDate,
        placement.lastDateToApply,
        placement.eligibleCourses
      );
    }

    req.session.success_msg = 'Placement created and notifications sent to eligible students';
    res.redirect('/placement/dashboard');
  } catch (error) {
    console.error('Create placement error:', error);
    req.session.error_msg = 'Error creating placement';
    res.redirect('/placement/create');
  }
});

// View Placement Applications
router.get('/:id/applications', isAuthenticated, hasRole('placement-manager'), async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate({
        path: 'applications.student',
        populate: { path: 'course section' }
      })
      .populate('eligibleCourses');

    res.render('placement/applications', {
      title: 'Placement Applications',
      placement
    });
  } catch (error) {
    console.error('Applications error:', error);
    req.session.error_msg = 'Error loading applications';
    res.redirect('/placement/dashboard');
  }
});

// Update application status
router.post('/:id/applications/:applicationId/status', isAuthenticated, hasRole('placement-manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const placement = await Placement.findById(req.params.id);
    const application = placement.applications.id(req.params.applicationId);
    
    if (application) {
      application.status = status;
      await placement.save();

      // Create notification for student
      const notification = new Notification({
        user: application.student,
        title: 'Placement Status Update',
        message: `Your application for ${placement.companyName} has moved to ${status} stage`,
        type: 'info',
        placement: placement._id
      });
      await notification.save();
    }

    req.session.success_msg = 'Application status updated';
    res.redirect(`/placement/${req.params.id}/applications`);
  } catch (error) {
    console.error('Update status error:', error);
    req.session.error_msg = 'Error updating status';
    res.redirect('/placement/dashboard');
  }
});

// Schedule reminder emails for placements
router.post('/:id/send-reminder', isAuthenticated, hasRole('placement-manager'), async (req, res) => {
  try {
    const placement = await Placement.findById(req.params.id)
      .populate({
        path: 'applications.student'
      });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const driveDate = new Date(placement.driveDate);
    driveDate.setHours(0, 0, 0, 0);

    if (driveDate.getTime() === tomorrow.getTime()) {
      for (let app of placement.applications) {
        if (app.status !== 'rejected') {
          await sendPlacementReminder(
            app.student.email,
            placement.companyName,
            placement.driveDate
          );
        }
      }
      req.session.success_msg = 'Reminder emails sent';
    } else {
      req.session.error_msg = 'Reminder can only be sent one day before drive';
    }

    res.redirect('/placement/dashboard');
  } catch (error) {
    console.error('Send reminder error:', error);
    req.session.error_msg = 'Error sending reminders';
    res.redirect('/placement/dashboard');
  }
});

module.exports = router;

