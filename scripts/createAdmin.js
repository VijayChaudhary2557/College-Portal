const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com', role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email: admin@gmail.com');
      console.log('Password: 1122 (if not changed)');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: '1122', // Change this password after first login
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@college.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();

