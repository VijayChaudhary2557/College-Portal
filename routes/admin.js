const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const { generatePassword, generateStudentId, generateFacultyId } = require('../utils/helpers');

// Default password for all users (students, faculty, HOD, coordinator, etc.)
const DEFAULT_USER_PASSWORD = '1122';
const { sendAdmissionApprovalEmail, sendUserCreationEmail } = require('../utils/email');

// Admin dashboard
router.get('/dashboard', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const students = await User.countDocuments({ role: 'student' });
    const faculties = await User.countDocuments({ role: 'faculty' }).populate('course');
    const courses = await Course.countDocuments({ isActive: true });
    const pendingAdmissions = await User.countDocuments({ role: 'student', admissionStatus: 'pending' });
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      students,
      faculties,
      courses,
      pendingAdmissions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.session.error_msg = 'Error loading dashboard';
    res.redirect('/');
  }
});

// Course Management
router.get('/courses', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });
    // Fetch all faculty members for HOD/Coordinator assignment
    const faculties = await User.find({ role: 'faculty' }).populate('course').populate('section');
    res.render('admin/courses', { title: 'Courses', courses, faculties });
  } catch (error) {
    console.error('Courses error:', error);
    req.session.error_msg = 'Error loading courses';
    res.redirect('/admin/dashboard');
  }
});

router.post('/courses', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const { name, code, description, duration } = req.body;
    const course = new Course({ name, code, description, duration: parseInt(duration) || 3 });
    await course.save();
    req.session.success_msg = 'Course added successfully';
    res.redirect('/admin/courses');
  } catch (error) {
    console.error('Add course error:', error);
    req.session.error_msg = 'Error adding course';
    res.redirect('/admin/courses');
  }
});

// Assign HOD to Course
router.post('/courses/:id/assign-hod', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const { hodId } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      req.session.error_msg = 'Course not found';
      return res.redirect('/admin/courses');
    }

    if (hodId) {
      const hod = await User.findById(hodId);
      if (!hod || hod.role !== 'faculty') {
        req.session.error_msg = 'Invalid faculty member selected';
        return res.redirect('/admin/courses');
      }
      // Update faculty position to HOD if not already
      if (hod.position !== 'hod') {
        hod.position = 'hod';
        await hod.save();
      }
      course.hod = hodId;
    } else {
      course.hod = null;
    }

    await course.save();
    req.session.success_msg = 'HOD assigned successfully';
    res.redirect('/admin/courses');
  } catch (error) {
    console.error('Assign HOD error:', error);
    req.session.error_msg = 'Error assigning HOD';
    res.redirect('/admin/courses');
  }
});

// Assign Coordinator to Course
router.post('/courses/:id/assign-coordinator', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      req.session.error_msg = 'Course not found';
      return res.redirect('/admin/courses');
    }

    if (coordinatorId) {
      const coordinator = await User.findById(coordinatorId);
      if (!coordinator || coordinator.role !== 'faculty') {
        req.session.error_msg = 'Invalid faculty member selected';
        return res.redirect('/admin/courses');
      }
      // Update faculty position to Coordinator if not already
      if (coordinator.position !== 'coordinator') {
        coordinator.position = 'coordinator';
        await coordinator.save();
      }
      course.coordinator = coordinatorId;
    } else {
      course.coordinator = null;
    }

    await course.save();
    req.session.success_msg = 'Coordinator assigned successfully';
    res.redirect('/admin/courses');
  } catch (error) {
    console.error('Assign Coordinator error:', error);
    req.session.error_msg = 'Error assigning Coordinator';
    res.redirect('/admin/courses');
  }
});

// Faculty Management
router.get('/faculty', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const faculties = await User.find({ role: 'faculty' }).populate('assignedCourses');
    const courses = await Course.find({ isActive: true });
    res.render('admin/faculty', { title: 'Faculty', faculties, courses });
  } catch (error) {
    console.error('Faculty error:', error);
    req.session.error_msg = 'Error loading faculty';
    res.redirect('/admin/dashboard');
  }
});

// router.post('/faculty', isAuthenticated, hasRole('admin'), async (req, res) => {
//   try {
//     const { name, email, position, courses } = req.body;
//     const password = DEFAULT_USER_PASSWORD; // Default password for all non-student users
//     const facultyId = generateFacultyId();

//     console.log('👤 Creating faculty user:', email);
//     console.log('🔑 Password set to:', password);
//     console.log('🔑 Course set to:', courses);

//   //   const user = new User({
//   //     name,
//   //     email,
//   //     password: "1122",
//   //     role: 'faculty', // Role is always 'faculty' for all faculty members (HOD, Coordinator, etc.)
//   //     position: position || 'faculty', // Position can be 'faculty', 'hod', 'coordinator', etc.
//   //     facultyId,
//   //     assignedCourses: courses
//   //   });

//   //   await user.save();
    
//   //   // Verify the user was created correctly
//   //   const savedUser = await User.findById(user._id);
//   //   console.log('✅ User saved successfully!');
//   //   console.log('   - Role:', savedUser.role);
//   //   console.log('   - Position:', savedUser.position);
//   //   console.log('   - Password:', "1122");
//   //   console.log('📧 Sending email to:', email);

//   //   // Email will be redirected to developer's email during development
//   //   const emailResult = await sendUserCreationEmail(email, '1122', name, position || 'faculty');
//   //   if (emailResult.success) {
//   //     req.session.success_msg = 'Faculty added successfully. Credentials sent via email.';
//   //   } else {
//   //     req.session.success_msg = `Faculty added successfully. Password: ${password}. Email not sent: ${emailResult.error}`;
//   //     console.log('⚠️  Email not sent for faculty:', email, 'Password:', password);
//   //   }
//   //   res.redirect('/admin/faculty');
//   } catch (error) {
//     console.error('Add faculty error:', error);
//     req.session.error_msg = 'Error adding faculty';
//     res.redirect('/admin/faculty');
//   }
// });




router.post('/faculty', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const { name, email, position } = req.body;
    let { courses } = req.body;

    const password = DEFAULT_USER_PASSWORD;
    const facultyId = generateFacultyId();

    // // 🧹 Always convert courses into array
    // if (!courses) {
    //   courses = [];
    // } else if (!Array.isArray(courses)) {
    //   courses = [courses];
    // }

    console.log('👤 Creating faculty user:', email);
    console.log('📚 Assigned Courses:', courses);

    const user = new User({
      name,
      email,
      password,
      role: 'faculty',
      position: position || 'faculty',
      facultyId,
      course: courses
    });

    await user.save();

    console.log('✅ Faculty saved successfully');

    req.session.success_msg = 'Faculty added successfully';
    res.redirect('/admin/faculty');

  } catch (error) {
    console.error('Add faculty error:', error);
    req.session.error_msg = 'Error adding faculty';
    res.redirect('/admin/faculty');
  }
});






// Update faculty position
router.post('/faculty/:id/position', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const { position, courseId } = req.body;
    const faculty = await User.findById(req.params.id);
    
    if (!faculty) {
      req.session.error_msg = 'Faculty not found';
      return res.redirect('/admin/faculty');
    }

    faculty.position = position;
    
    // Assign HOD or Coordinator to course
    if (position === 'hod' && courseId) {
      await Course.findByIdAndUpdate(courseId, { hod: faculty._id });
    } else if (position === 'coordinator' && courseId) {
      await Course.findByIdAndUpdate(courseId, { coordinator: faculty._id });
    }

    await faculty.save();
    req.session.success_msg = 'Faculty position updated successfully';
    res.redirect('/admin/faculty');
  } catch (error) {
    console.error('Update position error:', error);
    req.session.error_msg = 'Error updating position';
    res.redirect('/admin/faculty');
  }
});

// Student Admissions
router.get('/admissions', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const pending = await User.find({ role: 'student', admissionStatus: 'pending' }).populate('course');
    const approved = await User.find({ role: 'student', admissionStatus: 'approved' }).populate('course').limit(10).sort({ createdAt: -1 });
    res.render('admin/admissions', { title: 'Admissions', pending, approved });
  } catch (error) {
    console.error('Admissions error:', error);
    req.session.error_msg = 'Error loading admissions';
    res.redirect('/admin/dashboard');
  }
});

router.post('/admissions/:id/approve', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      req.session.error_msg = 'Student not found';
      return res.redirect('/admin/admissions');
    }

    const password = DEFAULT_USER_PASSWORD; // Default password for all users including students
    
    console.log('📧 Approving student:', student.email);
    console.log('🔑 Setting password to:', password);
    
    // Update student with new password using direct update to ensure it's changed
    student.admissionStatus = 'approved';
    
    if (!student.studentId) {
      const course = await Course.findById(student.course);
      student.studentId = generateStudentId(course.code, student.year || 1);
    }

    // Force password update - set it directly and mark as modified
    student.password = password;
    student.markModified('password');
    
    // Save the student - password will be hashed by pre-save hook
    await student.save();
    
    // Verify the password was set correctly by checking if login would work
    const testMatch = await student.comparePassword(password);
    console.log('🔍 Password verification test:', testMatch ? '✅ PASSED' : '❌ FAILED');
    
    console.log('✅ Student saved successfully. Password:', password);
    console.log('📧 Sending email to:', student.email);
    
    // Send email with the plain password (before hashing)
    const emailResult = await sendAdmissionApprovalEmail(student.email, password, student.name);
    
    console.log('📧 Email result:', emailResult.success ? 'Sent' : 'Failed - ' + emailResult.error);
    if (emailResult.success) {
      req.session.success_msg = 'Student approved successfully. Credentials sent via email.';
    } else {
      req.session.success_msg = `Student approved successfully. Email: ${student.email}, Password: ${password}. Email not sent: ${emailResult.error}`;
      console.log('⚠️  Email not sent for student:', student.email, 'Password:', password);
    }
    res.redirect('/admin/admissions');
  } catch (error) {
    console.error('Approve error:', error);
    req.session.error_msg = 'Error approving student';
    res.redirect('/admin/admissions');
  }
});

router.post('/admissions/:id/reject', isAuthenticated, hasRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { admissionStatus: 'rejected' });
    req.session.success_msg = 'Student admission rejected';
    res.redirect('/admin/admissions');
  } catch (error) {
    console.error('Reject error:', error);
    req.session.error_msg = 'Error rejecting student';
    res.redirect('/admin/admissions');
  }
});

module.exports = router;

