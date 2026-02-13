const Placement = require('../models/Placement');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Resume = require('../models/Resume');
const { sendPlacementReminder, sendReminderNotificationEmail } = require('./email');

// Helper function to check if notification already exists for today
const notificationExists = async (userId, placementId, notificationType) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);

    const exists = await Notification.findOne({
      user: userId,
      placement: placementId,
      title: { $regex: notificationType, $options: 'i' },
      createdAt: { $gte: today, $lt: nextDay }
    });

    return !!exists;
  } catch (error) {
    console.error('Error checking notification exists:', error);
    return false;
  }
};

// Auto-apply leaves for placement drives (should run daily)
exports.autoApplyPlacementLeaves = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const placements = await Placement.find({
      driveDate: tomorrow,
      isActive: true
    }).populate('applications.student');

    for (let placement of placements) {
      for (let application of placement.applications) {
        if (application.status !== 'rejected') {
          const student = application.student;
          
          // Check if leave already exists
          const existingLeave = await Leave.findOne({
            student: student._id,
            date: tomorrow
          });

          if (!existingLeave) {
            // Auto-apply leave
            const leave = new Leave({
              student: student._id,
              date: tomorrow,
              reason: `Placement Drive - ${placement.companyName}`,
              isAutoApplied: true,
              placement: placement._id,
              status: 'pending'
            });
            await leave.save();
          }
        }
      }
    }
  } catch (error) {
    console.error('Auto-apply leaves error:', error);
  }
};

// Send placement reminders (should run daily)
exports.sendPlacementReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const placements = await Placement.find({
      driveDate: tomorrow,
      isActive: true
    }).populate('applications.student');

    for (let placement of placements) {
      for (let application of placement.applications) {
        if (application.status !== 'rejected') {
          const student = application.student;
          
          // Send reminder email
          await sendPlacementReminder(
            student.email,
            placement.companyName,
            placement.driveDate
          );

          // Create notification
          const notification = new Notification({
            user: student._id,
            title: 'Placement Reminder',
            message: `Your placement drive for ${placement.companyName} is scheduled for tomorrow.`,
            type: 'warning',
            placement: placement._id
          });
          await notification.save();
        }
      }
    }
  } catch (error) {
    console.error('Send reminders error:', error);
  }
};

// NEW: Send deadline approaching notifications (for students who haven't applied)
exports.sendDeadlineApproachingNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Find placements with deadline today or tomorrow
    const placements = await Placement.find({
      lastDateToApply: { $gte: today, $lte: tomorrow },
      isActive: true
    }).populate('eligibleCourses applications.student');

    for (let placement of placements) {
      const daysLeft = Math.ceil((new Date(placement.lastDateToApply) - today) / (1000 * 60 * 60 * 24));
      const deadlineText = daysLeft === 0 ? 'TODAY' : 'TOMORROW';

      // Get eligible students
      const students = await User.find({
        role: 'student',
        course: { $in: placement.eligibleCourses },
        admissionStatus: 'approved'
      });

      for (let student of students) {
        // Check if student already applied
        const hasApplied = placement.applications.some(app => 
          app.student && app.student._id.toString() === student._id.toString()
        );

        // Check if notification already sent today
        const notifExists = await notificationExists(student._id, placement._id, 'Deadline Approaching');

        if (!hasApplied && !notifExists) {
          // Check if student has completed resume with matching skills
          const resume = await Resume.findOne({ user: student._id, isCompleted: true });
          
          if (resume) {
            const studentSkills = resume.skills.map(s => s.toLowerCase().trim());
            const requiredSkills = placement.requirements.knowledge
              .flatMap(skill => skill.toLowerCase().split(',').map(s => s.trim()));
            const matchedCount = requiredSkills.filter(skill => studentSkills.includes(skill)).length;

            if (matchedCount >= 2) {
              // Send notification
              const notification = new Notification({
                user: student._id,
                title: `Deadline Approaching - ${deadlineText}!`,
                message: `Last date to apply for ${placement.companyName} is ${deadlineText}. Don't miss this opportunity!`,
                type: 'warning',
                placement: placement._id
              });
              await notification.save();

              // Send email
              await sendReminderNotificationEmail(
                student.email,
                placement.companyName,
                placement.jobTitle,
                deadlineText,
                placement.lastDateToApply
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Send deadline approaching notifications error:', error);
  }
};

// NEW: Send drive date notifications (for students who applied)
exports.sendDriveDateNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Find placements happening today or tomorrow
    const placements = await Placement.find({
      driveDate: { $gte: today, $lte: tomorrow },
      isActive: true
    }).populate('applications.student');

    for (let placement of placements) {
      const daysAway = Math.ceil((new Date(placement.driveDate) - today) / (1000 * 60 * 60 * 24));
      const driveText = daysAway === 0 ? 'TODAY' : 'TOMORROW';

      // Notify students who applied and not rejected
      for (let application of placement.applications) {
        if (application.status !== 'rejected' && application.student) {
          // Check if notification already sent today
          const notifExists = await notificationExists(application.student._id, placement._id, 'Drive Scheduled');

          if (!notifExists) {
            // Send notification
            const notification = new Notification({
              user: application.student._id,
              title: `Placement Drive ${driveText}!`,
              message: `${placement.companyName} placement drive is scheduled for ${driveText}. Be prepared and on time!`,
              type: 'warning',
              placement: placement._id
            });
            await notification.save();

            // Send email
            await sendReminderNotificationEmail(
              application.student.email,
              placement.companyName,
              placement.jobTitle,
              `${driveText} (${new Date(placement.driveDate).toLocaleDateString()})`,
              placement.driveDate
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Send drive date notifications error:', error);
  }
};

// Run daily tasks (can be called from a cron job or scheduled task)
exports.runDailyTasks = async () => {
  console.log('Running daily tasks...');
  await exports.autoApplyPlacementLeaves();
  await exports.sendPlacementReminders();
  console.log('Daily tasks completed');
};

// Run real-time placement notifications (runs every 2 hours)
exports.runRealtimePlacementNotifications = async () => {
  console.log('🔔 [Placement Notifications] Checking for deadline and drive notifications...');
  try {
    await exports.sendDeadlineApproachingNotifications();
    await exports.sendDriveDateNotifications();
    console.log('✅ [Placement Notifications] Check completed successfully');
  } catch (error) {
    console.error('❌ [Placement Notifications] Error in real-time notifications:', error);
  }
};

