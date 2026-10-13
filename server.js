require('dotenv').config();
const dns = require('dns');
// Atlas SRV records require DNS SRV lookups. Some local resolvers time out on
// those records; use configurable public resolvers as the local fallback.
if (process.env.MONGODB_DNS_SERVERS) {
  dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(server => server.trim()).filter(Boolean));
} else if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Trust Render/Vercel/etc reverse proxy so secure cookies & IPs work correctly
app.set('trust proxy', 1);

// Share a single connection attempt across startup and incoming requests.
let connectionAttempt = null;
function connectDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!process.env.MONGODB_URI) return Promise.reject(new Error('MONGODB_URI environment variable is not set.'));
  if (!connectionAttempt) {
    connectionAttempt = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 })
      .then(() => {
        console.log('MongoDB connected');
        return mongoose.connection;
      })
      .finally(() => { connectionAttempt = null; });
  }
  return connectionAttempt;
}
connectDatabase().catch(err => console.error('MongoDB initial connect error:', err.message));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// On Vercel, user-uploaded files go to /tmp; serve them at /uploads
if (process.env.VERCEL) {
  app.use('/uploads', express.static('/tmp/uploads'));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session store
// Local development can keep sessions in memory while MongoDB is offline.
// This avoids connect-mongo starting a second DNS/SRV connection that may
// reject outside Express when Atlas cannot be reached.
const sessionStore = process.env.MONGODB_URI && process.env.NODE_ENV === 'production'
  ? MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60,
      autoRemove: 'interval',
      autoRemoveInterval: 60
    })
  : undefined;

function databaseIssue(error) {
  const message = String(error?.message || '').toLowerCase();
  if (error?.code === 'ETIMEOUT' || message.includes('querysrv')) {
    return 'Your network could not resolve the MongoDB Atlas address. Check your DNS or network connection, then restart the app.';
  }
  if (message.includes('whitelist') || message.includes('not authorized to access') || message.includes('ip address')) {
    return 'MongoDB Atlas is blocking this computer’s IP address. In Atlas, open Security → Network Access and add your current IP address.';
  }
  if (message.includes('authentication failed') || message.includes('bad auth')) {
    return 'MongoDB rejected the database username or password. Check the credentials in your MONGODB_URI.';
  }
  return 'The app could not reach MongoDB. Check that the Atlas cluster is running and your MONGODB_URI is correct.';
}

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
  // Keep the landing page and sign-in screens available while Atlas is
  // unreachable, so the interface can still be viewed during local work.
  if (req.method === 'GET' && ['/', '/demo', '/auth/login', '/auth/register'].includes(req.path)) {
    return next();
  }
  if (!process.env.MONGODB_URI) {
    return res.status(503).render('database-error', {
      title: 'Database unavailable',
      user: req.session.user || null,
      issue: 'MONGODB_URI is not set. Add the connection string to your local .env file and restart the app.'
    });
  }
  try {
    await connectDatabase();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).render('database-error', {
      title: 'Database unavailable',
      user: req.session.user || null,
      issue: databaseIssue(err)
    });
  }
});

// Auth middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', require('./routes/demo'));
app.use('/', require('./routes/demo'));
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/pow', require('./routes/pow'));
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/reviews'));
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
