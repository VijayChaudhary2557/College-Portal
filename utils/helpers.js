const crypto = require('crypto');

// Generate random password
exports.generatePassword = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // let password = '';
  // for (let i = 0; i < length; i++) {
  //   password += chars.charAt(Math.floor(Math.random() * chars.length));
  // }
  return "1122";
};

// Generate student ID
exports.generateStudentId = (courseCode, year) => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${courseCode}${year}${random}`;
};

// Generate faculty ID
exports.generateFacultyId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FAC${random}`;
};

// Format date
exports.formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Reset daily lecture count
exports.resetDailyLectures = async (User) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await User.updateMany(
    { 
      role: 'faculty',
      $or: [
        { lastResetDate: { $lt: today } },
        { lastResetDate: { $exists: false } }
      ]
    },
    { 
      $set: { 
        currentLecturesToday: 0,
        lastResetDate: today
      }
    }
  );
};

