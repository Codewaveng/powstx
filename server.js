require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Cache DB connection across serverless invocations
let dbConnected = false;
async function connectDB() {
  if (dbConnected) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  dbConnected = true;
  console.log('MongoDB connected');
}

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

// Build session store — only use MongoStore when MONGODB_URI is available
const sessionStore = process.env.MONGODB_URI
  ? MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60,
      autoRemove: 'interval',
      autoRemoveInterval: 60
    })
  : undefined;

app.use(session({
  secret: process.env.SESSION_SECRET || 'powtfolio-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: !!process.env.VERCEL,
    sameSite: 'lax'
  }
}));

// Ensure DB is connected before every request (handles cold starts on Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(500).send('Database connection error. Please check environment variables.');
  }
});

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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Something went wrong. Please try again.');
});

// Only bind to a port when running locally (not on Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`POWtfolio running on http://localhost:${PORT}`);
  });
}

module.exports = app;
