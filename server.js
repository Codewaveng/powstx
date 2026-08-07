require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Trust Render/Vercel/etc reverse proxy so secure cookies & IPs work correctly
app.set('trust proxy', 1);

// Start connecting to MongoDB immediately so the connection is ready early
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB initial connect error:', err.message));
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

// Session store
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
    secure: false,   // false = sent on both HTTP and HTTPS (works behind all proxies)
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Ensure DB is connected before every request (handles cold starts)
app.use(async (req, res, next) => {
  if (!process.env.MONGODB_URI) {
    return res.status(500).send('MONGODB_URI environment variable is not set.');
  }
  try {
    await mongoose.connection.asPromise();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(500).send('Database connection error. Please try again.');
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
