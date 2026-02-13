# 📊 Placement Notification System - Workflow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    College Portal Server                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Express.js Server (Main)                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ node-cron Scheduler                                      │   │
│  │ ├─ Every 2 Hours: Real-time Notifications              │   │
│  │ └─ Every Day 23:55: Auto-leaves + Reminders            │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ utils/scheduler.js                                       │   │
│  │ ├─ runRealtimePlacementNotifications()                  │   │
│  │ ├─ sendDeadlineApproachingNotifications()               │   │
│  │ ├─ sendDriveDateNotifications()                         │   │
│  │ └─ runDailyTasks()                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓                                                       │
│  ┌─────────────────┬──────────────────┬──────────────────────┐  │
│  │                 │                  │                      │  │
│  ↓                 ↓                  ↓                      ↓   │
│ MongoDB      Notification        Email             Student     │
│ Database     Collection         Service         Portal         │
│              (Stored)           (via SMTP)     (Display)       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deadline Approaching Flow

```
┌─────────────────────────────────────────────────────────┐
│ Scheduler checks every 2 hours                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
       ┌─────────────────────────────┐
       │ Find placements where:       │
       │ ├─ isActive = true           │
       │ ├─ lastDateToApply =         │
       │ │  TODAY or TOMORROW          │
       │ └─ Not already notified today│
       └────────────┬────────────────┘
                    │
                    ↓
       ┌─────────────────────────────┐
       │ Get eligible students:       │
       │ ├─ Course matches            │
       │ ├─ Admission approved        │
       │ ├─ Resume completed          │
       │ ├─ 2+ skills match           │
       │ └─ NOT yet applied           │
       └────────────┬────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ↓                     ↓
    ┌─────────────┐    ┌──────────────┐
    │ Create      │    │ Send Email   │
    │Notification │    │ (via SMTP)   │
    │ in DB       │    └──────────────┘
    └─────────────┘         │
         │                  │
         ↓                  ↓
    ┌─────────────────────────────┐
    │ Student sees:               │
    │ ├─ Portal notification      │
    │ ├─ Email alert              │
    │ └─ Deadline: TODAY/TOMORROW  │
    └─────────────────────────────┘
```

---

## Drive Scheduled Flow

```
┌─────────────────────────────────────────────────────────┐
│ Scheduler checks every 2 hours                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
       ┌─────────────────────────────┐
       │ Find placements where:       │
       │ ├─ isActive = true           │
       │ ├─ driveDate =               │
       │ │  TODAY or TOMORROW          │
       │ └─ Not already notified today│
       └────────────┬────────────────┘
                    │
                    ↓
       ┌─────────────────────────────┐
       │ For each application:        │
       │ ├─ Student applied           │
       │ ├─ Status NOT rejected       │
       │ └─ Not notified today        │
       └────────────┬────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ↓                     ↓
    ┌─────────────┐    ┌──────────────┐
    │ Create      │    │ Send Email   │
    │Notification │    │ (via SMTP)   │
    │ in DB       │    └──────────────┘
    └─────────────┘         │
         │                  │
         ↓                  ↓
    ┌─────────────────────────────┐
    │ Student sees:               │
    │ ├─ Portal notification      │
    │ ├─ Email alert              │
    │ └─ Drive: TODAY/TOMORROW     │
    └─────────────────────────────┘
```

---

## Auto-Leave Application Flow

```
┌─────────────────────────────────────────────────────────┐
│ Daily scheduler at 23:55 (11:55 PM)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
       ┌─────────────────────────────┐
       │ Find placements where:       │
       │ ├─ isActive = true           │
       │ ├─ driveDate = TOMORROW      │
       │ └─ Has applications          │
       └────────────┬────────────────┘
                    │
                    ↓
       ┌──────────────────────────────┐
       │ For each student application: │
       │ ├─ Status NOT rejected        │
       │ ├─ Check leave doesn't exist  │
       │ └─ If no leave, create one    │
       └────────────┬─────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ↓                     ↓
    ┌──────────────┐  ┌──────────────────┐
    │ Create Leave │  │ Mark as         │
    │ Record       │  │ auto-applied     │
    │ in DB        │  └──────────────────┘
    └──────────────┘         │
         ↓                   │
         └───────┬───────────┘
                 │
                 ↓
    ┌──────────────────────────────┐
    │ Student attendance system:    │
    │ ├─ Leave shows in attendance  │
    │ ├─ Marked approved            │
    │ ├─ Associated with placement  │
    │ └─ Student gets leave credit  │
    └──────────────────────────────┘
```

---

## Timeline Example - Student Perspective

### Scenario: TechCorp Placement Drive

```
DATE        TIME        EVENT
═════════════════════════════════════════════════════════

FEB 12   12:00 PM    🔔 ADMIN creates new placement
         12:05 PM    📧 System notifies eligible students:
                     "New opportunity: TechCorp - Apply by Feb 14"
                     
         12:10 PM    Student receives email in inbox
                     Student sees portal notification
                     
         2:15 PM     ✅ STUDENT APPLIES for placement
                     

FEB 13   10:00 AM    🔔 SCHEDULER RUNS (2-hour check)
         10:05 AM    ✅ Student already applied - No deadline
                     alert needed
         
         2:00 PM     🔔 SCHEDULER RUNS (2-hour check)
         2:05 PM     ✅ Same - Still has time
         
         6:00 PM     🔔 SCHEDULER RUNS (2-hour check)
         6:05 PM     ✅ Same - Still has time
         
         8:00 PM     🔔 SCHEDULER RUNS (2-hour check)
         8:05 PM     ✅ Same - Still has time
         
         10:00 PM    🔔 SCHEDULER RUNS (2-hour check)
         10:05 PM    🎯 DRIVE IS TOMORROW!
                     📬 Notification: "Your drive is TOMORROW!"
                     📧 Email: Preparation tips
                     
         11:00 PM    ✅ Student sees notifications
                     📖 Starts reviewing resume & projects
         
         11:55 PM    🔔 DAILY TASK RUNS
         11:56 PM    ✅ Auto-leave created for FEB 14
                     ✅ Reminder email sent

FEB 14   9:00 AM     📋 PLACEMENT DRIVE HAPPENS!
                     
         9:05 AM     ✅ Student shows up on time
                     ✅ Leave is marked in attendance
         
         12:00 PM    ✅ Drive completed
         1:00 PM     📊 Admin updates student status
                     Status: "Selected" or "Rejected"
                     📩 Notification sent to student

FEB 15   10:00 AM    🔔 SCHEDULER RUNS
         10:05 AM    📬 If selected:
                     "Congratulations! You're selected!"
                     Status shows in resume/placements
```

---

## Duplicate Prevention Logic

```
┌─────────────────────────────────────────────═
│ When system wants to send notification       │
└────────────────┬────────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────┐
    │ Check in database:              │
    │ ├─ Same user?                   │
    │ ├─ Same placement?              │
    │ ├─ Same notification type?      │
    │ └─ Created TODAY?               │
    └────────────┬───────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    YES  ↓                ↓  NO
    ┌─────────────┐  ┌──────────────┐
    │ SKIP        │  │ CREATE       │
    │ Notification│  │ Notification │
    └─────────────┘  └──────────────┘
         │                │
         └────┬───────────┘
              │
              ↓
    ┌──────────────────────┐
    │ One notification     │
    │ per day per type     │
    │ per placement        │
    └──────────────────────┘

Example:
✅ Can send: Different placement + same type = YES
✅ Can send: Same placement + different type = YES  
❌ Cannot send: Same placement + same type + same day = NO
```

---

## Database State at Key Points

### When Placement Created
```
Placement Collection:
{
  _id: ObjectId,
  companyName: "TechCorp",
  driveDate: ISODate("2026-02-14T09:00:00Z"),
  lastDateToApply: ISODate("2026-02-13T23:59:59Z"),
  applications: [],
  isActive: true
}

Notification Collection:
[empty - not created yet until trigger]
```

### When Eligible Students See It
```
Placement:
{
  applications: [
    { student: ObjectId(student1), status: "interested" },
    { student: ObjectId(student2), status: "interested" }
  ]
}

Notification:
[
  {
    user: ObjectId(student1),
    title: "New Placement Opportunity",
    message: "TechCorp - Apply by Feb 13...",
    placement: ObjectId(placement),
    createdAt: ISODate("2026-02-12T12:10:00Z")
  },
  {
    user: ObjectId(student2),
    title: "New Placement Opportunity",
    message: "TechCorp - Apply by Feb 13...",
    placement: ObjectId(placement),
    createdAt: ISODate("2026-02-12T12:10:00Z")
  }
]
```

### When Deadline Reminder Triggers
```
Notification (NEW entries at 8:00 PM):
[
  ... (previous entries above) ...
  {
    user: ObjectId(student3),  // Hasn't applied!
    title: "Deadline Approaching - TOMORROW!",
    message: "Last date to apply for TechCorp is TOMORROW...",
    placement: ObjectId(placement),
    createdAt: ISODate("2026-02-13T20:05:00Z")
  }
]
```

### When Drive Day Triggers
```
Notification (NEW entries at 8:00 PM):
[
  ... (previous entries above) ...
  {
    user: ObjectId(student1),  // Applied!
    title: "Placement Drive TOMORROW!",
    message: "TechCorp placement drive is TOMORROW. Be prepared...",
    placement: ObjectId(placement),
    createdAt: ISODate("2026-02-13T20:05:00Z")
  }
]

Leave Collection (NEW entries at 11:56 PM):
[
  {
    student: ObjectId(student1),
    date: ISODate("2026-02-14T00:00:00Z"),
    reason: "Placement Drive - TechCorp",
    isAutoApplied: true,
    placement: ObjectId(placement),
    status: "pending"
  }
]
```

---

## Email Notification Timeline

```
TIME        EMAIL STATUS
════════════════════════════════════════════════════════

12:05 PM    📧 New placement notification email
            To: student1@college.edu
            Subject: New Placement Opportunity
            Body: TechCorp opening, deadline Feb 13
            Status: SENT

8:05 PM     📧 Deadline approaching notification email
            To: student3@college.edu
            Subject: ⏰ Last Date To Apply Is TOMORROW!
            Body: Don't miss TechCorp - Apply now!
            Status: SENT

10:05 PM    📧 Drive day notification email
            To: student1@college.edu
            Subject: 🎯 Placement Drive Scheduled For TOMORROW!
            Body: Preparation tips, drive details
            Status: SENT

11:56 PM    📧 Daily reminder email
            To: student1@college.edu
            Subject: Placement Drive Reminder
            Body: Drive is tomorrow - be prepared
            Status: SENT
```

---

## Cron Schedule Visualization

```
HOUR        00  01  02  03  04  05  06  07  08  09  10  11
            |---|---|---|---|---|---|---|---|---|---|---|---|
Real-time   ✅              ✅              ✅              ✅
Check            |_2hrs_|    |_2hrs_|      |_2hrs_|      |


HOUR        12  13  14  15  16  17  18  19  20  21  22  23
            |---|---|---|---|---|---|---|---|---|---|---|---|
Real-time   ✅              ✅              ✅              
Check            |_2hrs_|    |_2hrs_|      |_2hrs_|      

Daily       
Task                                                    ✅
(23:55)                                           |_____|

KEY:
✅ = Check runs at this hour
|_2hrs_| = Time until next check (always 2 hours)
```

---

## System Error Handling

```
┌──────────────────────────────────────┐
│ Error Occurs During Check            │
└────────────────┬─────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   DATABASE ERROR      EMAIL ERROR
        │                 │
        ↓                 ↓
✅ Logged to console  ✅ Logged to console
✅ Notification NOT   ✅ Notification created
   created                (email failed, but
✅ Check continues       notification stored)
✅ Next check will     ✅ Student sees in portal
   try again           ✅ User knows about issue
```

---

## Performance Considerations

```
Resources Used Per Check:
═════════════════════════════════════════════════

Database Queries:
- Find active placements: 1 query + results
- Find eligible students: ~1-3 queries (per placement)
- Check existing notifications: ~1 query per student
- Create notifications: ~1-N inserts (per student)

Memory:
- Placements in memory: ~10-100KB (typical)
- Students in memory: ~50-500KB (typical)
- Notifications: ~10-100KB (typical)

Time Per Check:
- Database queries: ~500ms-2000ms (typical)
- Email sending: ~1-5 seconds per email (background)
- Total check: ~2-5 seconds (w/o email)

Impact on Server:
✅ Non-blocking (runs in background)
✅ Doesn't affect student requests
✅ Runs every 2 hours (not constant)
✅ Can handle 100+ students/check
```

---

## Integration Points

```
Existing System:
├─ models/Placement.js → Used as-is
├─ models/User.js → Used for student lookup
├─ models/Course.js → For course matching
├─ models/Notification.js → For storing alerts
├─ models/Resume.js → For skill matching
├─ models/Leave.js → For auto-leave creation
├─ utils/email.js → NEW function added
├─ utils/scheduler.js → NEW functions added
└─ routes/placement.js → No changes needed

New:
├─ node-cron library (npm install)
└─ Scheduler in server.js startup
```

