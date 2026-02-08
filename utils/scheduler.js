const Placement = require('../models/Placement');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPlacementReminder } = require('./email');

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

// Run daily tasks (can be called from a cron job or scheduled task)
exports.runDailyTasks = async () => {
  console.log('Running daily tasks...');
  await exports.autoApplyPlacementLeaves();
  await exports.sendPlacementReminders();
  console.log('Daily tasks completed');
};

