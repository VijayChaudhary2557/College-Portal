# ⚡ QUICK SETUP - Real-Time Placement Notifications

## What's New? 🎯
Your college portal now has **automatic real-time notifications** for students about:
1. ⏰ **Deadline reminders** - "You have until TODAY/TOMORROW to apply!"
2. 🎯 **Drive day alerts** - "Your drive is TODAY/TOMORROW!"
3. ✅ **Auto-leave application** - Automatic leave for placement drives
4. 📧 **Email notifications** - Students get emails AND portal notifications

---

## STEP 1: Install Library ✅
```bash
npm install node-cron
```

This library runs tasks automatically every 2 hours. **You MUST install this even if already part of package.json.**

---

## STEP 2: Code Already Updated ✅
All code files have been updated:
- ✅ [server.js](server.js) - Scheduler initialized
- ✅ [utils/scheduler.js](utils/scheduler.js) - New notification functions
- ✅ [utils/email.js](utils/email.js) - New email templates

**Just run your server, it will automatically work!**

---

## STEP 3: Configure Email (Optional) 📧
If you want students to receive emails (highly recommended):

Create/Update `.env` file:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Use App Password for Gmail!
```

> For Gmail: Generate App Password from: https://myaccount.google.com/apppasswords

If not configured, notifications still appear in portal but emails show in console (dev mode).

---

## STEP 4: Start Server
```bash
npm start
# or dev mode
npm run dev
```

You'll see:
```
✅ [Scheduler] Placement notification scheduler initialized successfully
   • Real-time checks: Every 2 hours (at :00 minutes of every even hour)
   • Daily tasks: Every day at 23:55 (11:55 PM)
   • Initial check: Just ran
```

**That's it! Notifications now work automatically.** 🎉

---

## How to Test 🧪

### Test Deadline Notification
1. Create new placement with:
   - Last date to apply = TODAY
   - Drive date = TOMORROW
2. Within 2 hours, eligible students (without application) will get notification
3. Check student portal for notification badge
4. Check console or email inbox for details

### Test Drive Notification
1. Create placement with:
   - Last date to apply = YESTERDAY (to allow applications)
   - Drive date = TODAY or TOMORROW
2. Student applies to this placement
3. Within 2 hours, student gets notification
4. Auto-leave is created for tomorrow

---

## What Happens Automatically ⚙️

### Every 2 Hours (0:00, 2:00, 4:00, ... 22:00)
- ✅ Checks for deadline reminders (today/tomorrow deadlines)
- ✅ Checks for drive notifications (today/tomorrow drives)
- ✅ Creates notifications for eligible students
- ✅ Sends emails (if configured)
- ✅ Prevents duplicate notifications (won't send twice same day)

### Every Day at 23:55 (11:55 PM)
- ✅ Applies leave for all students with tomorrow's drive
- ✅ Sends reminder emails for next day's drives

### On Server Start
- ✅ Runs immediate notification check
- ✅ Initializes cron scheduler

---

## Features 🌟

| Feature | Status | Auto? |
|---------|--------|-------|
| Deadline reminders | ✅ Implemented | Every 2 hrs |
| Drive day alerts | ✅ Implemented | Every 2 hrs |
| Auto-leave for drives | ✅ Implemented | Daily at 11:55 PM |
| Email notifications | ✅ Implemented | Every 2 hrs |
| Duplicate prevention | ✅ Implemented | Per day |
| Skill matching | ✅ Implemented | Smart 2+ match |

---

## File Summary 📋

### Modified Files:
1. **[server.js](server.js)** 
   - Added `const cron = require('node-cron')`
   - Added initializeScheduler() function
   - Scheduler runs automatically on startup

2. **[utils/scheduler.js](utils/scheduler.js)**
   - Added `sendDeadlineApproachingNotifications()` - Deadline reminders
   - Added `sendDriveDateNotifications()` - Drive alerts  
   - Added `runRealtimePlacementNotifications()` - Main coordinator
   - Added duplicate prevention logic

3. **[utils/email.js](utils/email.js)**
   - Added `sendReminderNotificationEmail()` - For deadline and drive alerts
   - Creates formatted HTML emails

### New Documentation:
1. **[PLACEMENT_NOTIFICATIONS.md](PLACEMENT_NOTIFICATIONS.md)** - Full documentation
2. **[PLACEMENT_NOTIFICATIONS_SETUP.md](PLACEMENT_NOTIFICATIONS_SETUP.md)** - This file

---

## Notification Examples 📨

### Email: Deadline Reminder
```
Subject: ⏰ Last Date To Apply Is TODAY!

Company: TechCorp
Position: Software Engineer
Due: TODAY

⚠️ Apply immediately before the deadline expires!
```

### Email: Drive Day Alert
```
Subject: 🎯 Placement Drive Scheduled For TOMORROW!

Company: TechCorp  
Position: Software Engineer
Date: TOMORROW

Preparation tips:
- Review your resume
- Prepare introduction
- Check drive details
```

### Portal Notification: Deadline
```
🔔 Deadline Approaching - TODAY!
Last date to apply for TechCorp is TODAY. Don't miss this opportunity!
```

### Portal Notification: Drive
```
🔔 Placement Drive TOMORROW!
TechCorp placement drive is scheduled for TOMORROW. Be prepared and on time!
```

---

## Customization 🎨

### Change Check Frequency (Optional)

**Change from 2 hours to 1 hour:**
Edit [server.js](server.js), find line with:
```javascript
const realtimeJob = cron.schedule('0 */2 * * *', async () => {
```
Change to:
```javascript
const realtimeJob = cron.schedule('0 * * * *', async () => {
```

**Change from 2 hours to every 30 minutes:**
```javascript
const realtimeJob = cron.schedule('*/30 * * * *', async () => {
```

### Change Daily Task Time (Optional)

**Change from 11:55 PM to 10:00 PM:**
Edit [server.js](server.js), find line with:
```javascript
const dailyJob = cron.schedule('55 23 * * *', async () => {
```
Change to:
```javascript
const dailyJob = cron.schedule('0 22 * * *', async () => {
```

---

## Troubleshooting 🔧

### Issue: No notifications appearing
**Check:**
1. Server console shows "✅ [Scheduler] initialized"? → Yes = Good
2. Placement has deadline/drive as TODAY or TOMORROW? → Yes = Good
3. Student resume completed with skills? → Yes = Good
4. 2+ skill matches? → Check console logs
5. Restart server and wait 2 hours or manually trigger

### Issue: Emails not sending
**Check:**
1. Is EMAIL_USER and EMAIL_PASS in .env? → Add them
2. Using Gmail? → Use App Password, not regular password
3. Check console for email errors
4. In dev mode, emails go to developer email (check console)

### Issue: Duplicate notifications
**Should NOT happen** - System prevents this. If you see duplicates:
1. Restart server (scheduler resets)
2. Wait for new notifications

---

## Database Info 📊

**No database changes needed!** Uses existing collections:
- `Placement` - Has driveDate and lastDateToApply
- `Notification` - Stores all notifications
- `Resume` - Student skills
- `User` - Student course and admission status

All data is compatible with existing system.

---

## Console Output Example

```log
Server running on port http://localhost:3000

⏰ [Scheduler] Initializing placement notification scheduler...
🚀 [Scheduler] Running initial placement notification check...
🔔 [Placement Notifications] Checking for deadline and drive notifications...
✅ [Placement Notifications] Check completed successfully
✅ [Scheduler] Placement notification scheduler initialized successfully
   • Real-time checks: Every 2 hours (at :00 minutes of every even hour)
   • Daily tasks: Every day at 23:55 (11:55 PM)
   • Initial check: Just ran

[Later, when schedule triggers...]

📅 [2026-02-13 14:00:00] ⏰ Real-time placement notifications scheduler triggered
🔔 [Placement Notifications] Checking for deadline and drive notifications...
✅ [Placement Notifications] Check completed successfully
```

---

## Next Steps 🚀

1. ✅ Install: `npm install node-cron`
2. ✅ (Optional) Configure email in .env
3. ✅ Start server: `npm start`
4. ✅ Test with sample placement
5. ✅ Check student portal and emails
6. ✅ Done! Notifications run automatically 24/7

---

## Need Help?

Check these files:
- 📖 Full docs: [PLACEMENT_NOTIFICATIONS.md](PLACEMENT_NOTIFICATIONS.md)
- 🔍 Console logs for errors
- 📥 Notification collection in MongoDB
- 💬 Email logs in console

**Everything is working automatically!** Just install library and restart server. 🎉
