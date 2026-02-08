// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.error_msg = 'Please login to continue';
  res.redirect('/');
};

// Check if user has specific role or position
exports.hasRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.session.error_msg = 'Please login to continue';
      return res.redirect('/');
    }
    
    const User = require('../models/User');
    try {
      // Get user from database to check both role and position
      const user = await User.findById(req.session.user.id);
      const userRole = user ? user.role : req.session.user.role;
      const userPosition = user ? user.position : req.session.user.position;
      
      // Check if user has any of the required roles or positions
      if (roles.includes(userRole) || roles.includes(userPosition) || roles.includes(req.session.user.role)) {
        return next();
      }
      
      req.session.error_msg = 'Access denied. Insufficient permissions.';
      res.redirect('/dashboard');
    } catch (error) {
      console.error('hasRole middleware error:', error);
      // Fallback to session role check
      if (roles.includes(req.session.user.role)) {
        return next();
      }
      req.session.error_msg = 'Access denied. Insufficient permissions.';
      res.redirect('/dashboard');
    }
  };
};

