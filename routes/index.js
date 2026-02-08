const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

// Home page
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('index', { title: 'Home' });
});

// Dashboard - redirect based on role and position
router.get('/dashboard', isAuthenticated, async (req, res) => {
  const User = require('../models/User');
  try {
    const user = await User.findById(req.session.user.id);
    const userRole = req.session.user.role;
    const userPosition = user ? user.position : null;
    
    // Check based on position first (for faculty members)
    if (userPosition === 'hod') {
      return res.redirect('/hod/dashboard');
    } else if (userPosition === 'coordinator') {
      return res.redirect('/coordinator/dashboard');
    } else if (userRole === 'faculty' && userPosition === 'class-advisor') {
      return res.redirect('/faculty/dashboard');
    } else if (userPosition === 'class-advisor') {
      return res.redirect('/class-advisor/dashboard');
    } else if (userPosition === 'placement-manager' || userRole === 'placement-manager') {
      return res.redirect('/placement/dashboard');
    }
    
    // Check based on role
    switch(userRole) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'student':
        return res.redirect('/student/dashboard');
      case 'faculty':
        return res.redirect('/faculty/dashboard');
      default:
        res.redirect('/');
    }
  } catch (error) {
    console.error('Dashboard routing error:', error);
    res.redirect('/');
  }
});

module.exports = router;

