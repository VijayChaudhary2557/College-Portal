const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', { title: 'Login' });
});

// Login process
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      req.session.error_msg = 'Please fill all fields';
      return res.redirect('/auth/login');
    }

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      req.session.error_msg = 'Database connection failed. Please make sure MongoDB is running.';
      return res.redirect('/auth/login');
    }

    // Login logic:
    // - HOD, Coordinator, Class Advisor → MUST login with their position (hod, coordinator, etc.)
    // - Faculty → MUST login with role 'faculty' (position must be 'faculty')
    // - Others (Admin, Student, Placement Manager) → check by role
    let user;
    let students;
    
    if (role === 'hod' || role === 'coordinator' || role === 'class-advisor') {
      // Check by position for HOD, Coordinator, Class Advisor
      // They MUST login with their specific role (hod/coordinator/etc.), NOT as 'faculty'
      console.log('🔍 [Login] Checking HOD/Coordinator/Advisor by position:', role);
      user = await User.findOne({ 
        email, 
        role: 'faculty', // In database, role is always 'faculty'
        position: role,  // Position is 'hod', 'coordinator', 'class-advisor'
        isActive: true
      }).populate('course');


      
      if (!user) {
        console.log('❌ [Login] No user found with position:', role);
      } else {
        students = await User.find({ course: user.course.id, role: 'student'})
        console.log('✅ [Login] Found user with position:', user.position);
      }
    } else if (role === 'faculty') {
      // For normal faculty ONLY - check by role='faculty' AND position='faculty'
      // HOD/Coordinator/etc. should NOT be able to login with role='faculty'
      console.log('🔍 [Login] Checking Faculty - must have position="faculty"');
      user = await User.findOne({ 
        email,
        role: 'faculty',
        position: 'class-advisor', // ONLY normal faculty has position='faculty'
        isActive: true 
    });
      
      if (!user) {
        console.log('❌ [Login] No normal faculty found. User might be HOD/Coordinator - use their specific role to login.');
      } else {
        console.log('✅ [Login] Found normal faculty');
      }
    } else {
      // For Admin, Student, Placement Manager - check by role directly
      console.log('🔍 [Login] Checking by role:', role);
      user = await User.findOne({ email, role, isActive: true });

      if(role == 'placement-manager'){
        user = await User.findOne({ email, position: 'placement-manager', isActive: true });  
      } else if(user.role == 'student' && user.admissionStatus == 'pending') {
        console.log('❌ Login failed: Student admission not approved -', email);
        user = null; // Treat as not found
        req.session.error_msg = 'Your admission is not approved yet.';
        return res.redirect('/auth/login');
      }
    }
    
    if (!user) {
      console.log('❌ Login failed: User not found -', email, role);
      
      // Provide helpful error messages
      if (role === 'hod' || role === 'coordinator' || role === 'class-advisor') {
        req.session.error_msg = `Invalid credentials. Please use role "${role}" (not "faculty"). Check your email, password, and role selection.`;
      } else if (role === 'faculty') {
        req.session.error_msg = 'Invalid credentials. If you are HOD/Coordinator, please use your specific role to login.';
      } else {
        req.session.error_msg = 'Invalid email, password, or role. Please check your credentials.';
      }
      return res.redirect('/auth/login');
    }

    console.log('🔍 Login attempt - Email:', email, 'Role:', role, 'Password entered:', password);
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Login failed: Password mismatch for', email);
      req.session.error_msg = 'Invalid email, password, or role. Please check your credentials.';
      return res.redirect('/auth/login');
    }
    
    console.log('✅ Login successful:', email);

    // Store user in session
    // For HOD, Coordinator, etc. - use their position as role for routing
    let sessionRole = (user.role == 'faculty' && user.position !== 'faculty') ? user.position : user.role;

    if(role == 'hod'){
      sessionRole = user.position;
    }

    if(role == 'student')
      sessionRole = 'student';

    if(role == 'faculty')
      sessionRole = 'faculty';

    if(role == 'coordinator')
      sessionRole = user.position;


    if(role == 'placement-manager')
      sessionRole = 'placement-manager';


    console.log('🔍 Determined session role:', sessionRole);

    console.log('🔍 Setting session role as:', sessionRole);
    
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: sessionRole, // Use position for HOD, Coordinator, etc.
      position: user.position,
      students: students,
      course: user.course
    };
    
    console.log('✅ Session User', user.role);

    req.session.success_msg = 'Login successful';
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'MongooseError' || error.message.includes('buffering')) {
      req.session.error_msg = 'Database connection failed. Please make sure MongoDB is running and restart the server.';
    } else {
      req.session.error_msg = 'Login failed. Please try again.';
    }
    res.redirect('/auth/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;

