const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

// Database connection
const connectDB = require('./config/db');
connectDB().catch(err => {
  // Error already handled in db.js, server continues
  console.log('Server starting without database connection...');
});

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
let sessionStore;
try {
  sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college-portal',
    ttl: 24 * 60 * 60, // 24 hours
  });
} catch (err) {
  console.log('⚠️  Using memory store for sessions (MongoDB not available)');
  sessionStore = null;
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.session.success_msg;
  res.locals.error_msg = req.session.error_msg;
  res.locals.user = req.session.user;
  delete req.session.success_msg;
  delete req.session.error_msg;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/student', require('./routes/student'));
app.use('/faculty', require('./routes/faculty'));
app.use('/hod', require('./routes/hod'));
app.use('/coordinator', require('./routes/coordinator'));
app.use('/class-advisor', require('./routes/classAdvisor'));
app.use('/placement', require('./routes/placement'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

