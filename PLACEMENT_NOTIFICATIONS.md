# 🔔 Real-Time Placement Notification System

## Overview
The college portal now includes a **real-time placement notification scheduler** that automatically sends notifications and emails to students about upcoming placement deadlines and drives.

## Features Implemented

### 1. **Deadline Approaching Notifications**
Students who have NOT applied for a placement drive will receive notifications when:
- **Last date to apply is TODAY**
- **Last date to apply is TOMORROW**

**Who receives it:**
- Students from eligible courses
- Who haven't applied yet
- With completed resume
- With minimum 2 skill matches with company requirements

**What they see:**
- Portal notification: "Last date to apply is TODAY/TOMORROW!"
- Email alert with company details and job position
- Deadline information

---

### 2. **Drive Date Notifications**
Students who HAVE applied for a placement drive will receive notifications when:
- **Drive is scheduled for TODAY**
- **Drive is scheduled for TOMORROW**

**Who receives it:**
- Students who have submitted an application
- Whose application status is NOT "rejected"

**What they see:**
- Portal notification: "Your drive is TODAY/TOMORROW!"
- Email reminder with company details
- Preparation tips and drive information

---

### 3. **Automatic Leave Application**
When a placement drive is happening tomorrow, the system automatically:
- Applies leave for all enrolled students
- Marks leave as auto-applied
- Associated with placement drive record

---

## Scheduler Configuration

### Schedule Times

| Task | Schedule | Frequency |
|------|----------|-----------|
| Real-time Notifications | Every 2 hours | At :00 minutes of every even hour (0:00, 2:00, 4:00, etc.) |
| Daily Tasks | 23:55 (11:55 PM) | Once daily |
| Initial Check | On server start | Once when server starts |

### Cron Expressions
- **Real-time**: `0 */2 * * *` - Run at 00, 02, 04, 06... 22 hours
- **Daily**: `55 23 * * *` - Run at 23:55 every day

---

## Duplicate Prevention

The system includes smart duplicate prevention:
- **No duplicate notifications per day**: Same notification won't be sent twice on same day
- **Daily scope**: Checks if notification already exists for today
- **Prevents email spam**: Only one email per notification type per day

---

## Installation & Setup

### Step 1: Install Required Library
```bash
npm install node-cron
```

### Step 2: Database - No Changes Needed
The system uses existing models:
- `Placement` - Already has driveDate and lastDateToApply
- `Notification` - Already has user, placement, and createdAt fields
- `Resume` - Already has skills field
- `User` - Already has course and admissionStatus fields

### Step 3: Email Configuration (Optional but Recommended)
Configure in `.env` file for actual email sending:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

> **Note**: For Gmail, use App Password (not regular password)

If email is not configured, the system logs what would be sent.

### Step 4: Start Server
```bash
npm start
# or for development
npm run dev
```

Server initialization log:
```
✅ [Scheduler] Placement notification scheduler initialized successfully
   • Real-time checks: Every 2 hours (at :00 minutes of every even hour)
   • Daily tasks: Every day at 23:55 (11:55 PM)
   • Initial check: Just ran
```

---

## How It Works - Examples

### Example 1: Deadline Approaching
**Scenario**: Today is Feb 13, Company closes application on Feb 14 (tomorrow)
- At 22:00 (10 PM): Scheduler checks placements
- Finds placement with deadline tomorrow
- Sends notification to all eligible non-applicants: "Last date to apply is TOMORROW!"
- Emails are sent with prepare-to-apply message

### Example 2: Drive Coming Tomorrow
**Scenario**: Today is Feb 13, Drive is on Feb 14 (tomorrow)
- At 20:00 (8 PM): Scheduler checks placements
- Finds placement happening tomorrow
- For each student who applied:
  - Creates automatic leave for tomorrow
  - Sends notification: "Your drive is TOMORROW!"
  - Sends email with preparation tips

### Example 3: Real-Time Check
**Scenario**: Placement is added in morning with drive today evening
- Admin creates placement with driveDate = today
- Notifications checking runs at next 2-hour interval
- Students who were already added auto-receive notifications
- No need to wait for midnight or fixed time

---

## Database Schema (Existing)

### Notification Model
```javascript
{
  user: ObjectId,              // Student reference
  title: String,               // "Deadline Approaching - TODAY!"
  message: String,             // Formatted message
  type: 'info' | 'warning',    // info or warning
  placement: ObjectId,         // Placement reference
  isRead: Boolean,             // Read status
  createdAt: Date              // For duplicate prevention
}
```

### Placement Model
```javascript
{
  driveDate: Date,             // When interview happens
  lastDateToApply: Date,       // Final deadline
  applications: [{
    student: ObjectId,
    status: String             // 'interested', 'rejected', etc.
  }]
}
```

---

## Console Output

When running, you'll see:
```
📅 [2026-02-13 14:00:00] ⏰ Real-time placement notifications scheduler triggered
🔔 [Placement Notifications] Checking for deadline and drive notifications...
✅ [Placement Notifications] Check completed successfully

📅 [2026-02-13 23:55:00] 🌙 Daily tasks scheduler triggered
Running daily tasks...
Auto-apply leaves completed
Reminder emails sent
Daily tasks completed
```

---

## API & Functions

### Main Scheduler Functions

#### `runRealtimePlacementNotifications()`
- Checks for deadline and drive notifications
- Runs every 2 hours
- Called automatically by cron

#### `sendDeadlineApproachingNotifications()`
- Sends notifications for placements with deadline today/tomorrow
- Only to eligible non-applicants

#### `sendDriveDateNotifications()`
- Sends notifications for placements happening today/tomorrow
- Only to students who applied

#### `runDailyTasks()`
- Runs auto-leave application
- Sends next-day reminders
- Called at 23:55 daily

---

## Testing

### Manual Testing
You can manually trigger scheduler in code:
```javascript
const { runRealtimePlacementNotifications } = require('./utils/scheduler');

// Manually run real-time check
await runRealtimePlacementNotifications();
```

### Test Placements
1. Create placement with:
   - Tomorrow as deadline
   - Today as drive date
2. Watch for notifications in console
3. Check student portal for notifications
4. Check email (or dev email in logs)

---

## Configuration Tuning

### Change Notification Frequency
Edit [server.js](server.js) line with:
```javascript
// Every hour instead of 2 hours
const realtimeJob = cron.schedule('0 * * * *', async () => {
```

### Change Daily Task Time
Edit [server.js] line with:
```javascript
// Run at 10 PM instead of 11:55 PM
const dailyJob = cron.schedule('0 22 * * *', async () => {
```

---

## Error Handling

The system handles:
- ✅ Database connection issues
- ✅ Missing email configuration
- ✅ Invalid placement dates
- ✅ Missing resume data
- ✅ Network errors
- ✅ Duplicate notification prevention

All errors are logged to console with context.

---

## Troubleshooting

### Q: Notifications not appearing?
**A**: Check:
1. Server is running with scheduler initialized
2. Placement dates are correct (deadline/drive today or tomorrow)
3. Student has completed resume
4. Student has 2+ matching skills
5. Check console for error messages

### Q: Emails not being sent?
**A**: 
1. If using Gmail, use App Password (not regular password)
2. Check EMAIL_USER and EMAIL_PASS in .env
3. Check console logs for email errors
4. In dev mode, emails redirect to developer (check logs)

### Q: Duplicate notifications?
**A**: 
1. This is prevented by system
2. Check notification creation date - should be today
3. If seeing duplicates across system restart, that's expected (scheduler resets)

### Q: Scheduler not running?
**A**:
1. Check console for "✅ [Scheduler] initialized"
2. Ensure MongoDB is connected
3. Check for JavaScript errors in scheduler.js
4. Try restarting server

---

## Future Improvements (Optional)

1. Add SMS notifications
2. Push notifications to mobile app
3. Customize notification frequency per student
4. Add "snooze" functionality
5. Batch email sending optimization
6. Notification analytics dashboard

---

## Files Modified

1. **[utils/scheduler.js](utils/scheduler.js)** - Added new scheduler functions
2. **[utils/email.js](utils/email.js)** - Added sendReminderNotificationEmail function
3. **[server.js](server.js)** - Added node-cron initialization

---

## Support

For issues or questions about the notification system, check:
- Console logs for error details
- Database notification records
- Placement dates and eligible courses
- Student resume completion status
