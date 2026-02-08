# College Portal Management System

A comprehensive college portal management system built with Node.js, Express, EJS, MongoDB, and Bootstrap.

## Features

### Admin
- Manage courses (add, view)
- Create and manage faculty members
- Assign faculty positions (HOD, Coordinator, Class Advisor, etc.)
- Approve/reject student admissions
- Email notifications for user creation

### HOD (Head of Department)
- View all students in their course
- Create and manage sections
- Assign students to sections
- Approve leaves (final approval)

### Coordinator
- Create timetables for courses
- Assign subjects, faculty, and time slots
- Approve leaves (after Class Advisor)

### Class Advisor
- Schedule lectures for their sections
- Assign faculty to classes (with 5 lectures/day limit)
- Approve leaves (first level)

### Faculty
- View daily and weekly schedules
- Mark attendance for classes
- See assigned classes

### Student
- Apply for admission
- View dashboard with attendance summary
- Apply for leaves manually
- View and apply for placements
- Auto-leave application on placement dates
- View attendance percentage per subject
- See daily class schedule

### Placement Manager
- Create placement opportunities
- Set eligibility criteria
- Track application progress
- Send notifications to students

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Frontend:** EJS templates, Bootstrap 5
- **Authentication:** Session-based
- **Notifications:** Toastr.js
- **Email:** Nodemailer

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
MONGODB_URI=mongodb://localhost:27017/college-portal
SESSION_SECRET=your-secret-key
PORT=3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

4. Start MongoDB (if running locally)

5. Run the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Database Models

- **User:** Students, Faculty, Admin, etc.
- **Course:** College courses (MCA, BCA, BTech, etc.)
- **Section:** Course sections (MCA-A, MCA-B, etc.)
- **Subject:** Course subjects
- **Timetable:** Class schedules
- **Attendance:** Student attendance records
- **Leave:** Leave applications
- **Placement:** Placement opportunities
- **Notification:** User notifications

## Automatic Features

- **Auto-leave Application:** When a student applies for a placement, a leave is automatically applied for the placement drive date
- **Email Notifications:** Automated emails for:
  - Admission approval
  - User account creation
  - Placement notifications
  - Placement reminders

## Usage

1. **First Time Setup:**
   - Create an admin account manually in the database or through MongoDB
   - Login as admin and create courses
   - Add faculty members
   - Approve student admissions

2. **Student Flow:**
   - Apply for admission
   - Wait for admin approval
   - Receive email with login credentials
   - Login and access portal

3. **Placement Flow:**
   - Placement manager creates placement
   - Eligible students receive notifications
   - Students apply for placement
   - Leave automatically applied for drive date
   - Placement manager tracks progress

## License

ISC

## Author

College Portal Development Team

