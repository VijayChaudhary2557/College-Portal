const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college-portal';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️  Please make sure MongoDB is running!');
    console.log('💡 To start MongoDB, run: net start MongoDB (as Administrator)');
    console.log('💡 Or manually: mongod --dbpath "C:\\data\\db"');
    console.log('⚠️  Server will continue but database features will not work until MongoDB is started.');
    
    // Don't throw error, let server continue running
    // The connection will retry automatically when MongoDB starts
    return null;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('⚠️  Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;

connectDB();