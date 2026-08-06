require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Cache DB connection across serverless invocations
let dbConnected = false;
async function connectDB() {
  if (dbConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  dbConnected = true;
  console.log('MongoDB connected');
}
connectDB().catch(err => console.error('MongoDB error:', err));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// On Vercel, user-uploaded files go to /tmp — serve them at /uploads
if (process.env.VERCEL) {
  app.use('/uploads', express.static('/tmp/uploads'));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'powtfolio-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.VERCEL ? true : false
  }
}));

// Auth middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/pow', require('./routes/pow'));
app.use('/', require('./routes/profile'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`POWtfolio running on http://localhost:${PORT}`);
});

module.exports = app;
