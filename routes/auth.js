const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { applyPortfolioDefaults } = require('../utils/portfolioDefaults');

function explainAuthError(error, action) {
  if (error?.code === 11000) return 'That username or email is already in use.';
  const message = String(error?.message || '').toLowerCase();
  if (error?.name === 'MongooseServerSelectionError' || message.includes('querysrv') || error?.code === 'ETIMEOUT') {
    return 'The database is unavailable right now. Check the MongoDB connection and try again.';
  }
  if (error?.name === 'ValidationError') return 'Please check your username and account details, then try again.';
  return `${action} failed. Please try again.`;
}

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Register', error: null });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Password must be at least 6 characters'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username }]
    });

    if (existingUser) {
      return res.render('auth/register', {
        title: 'Register',
        error: 'Username or email already exists'
      });
    }

    const user = new User({
      username,
      email: email.toLowerCase().trim(),
      password
    });
    applyPortfolioDefaults(user);
    user.profile.bio = 'Building my path in Web3 through community, growth, and thoughtful conversations. Interested in community management, growth marketing, and contributor opportunities. Open to internships and collaborations.';
    user.skillCategory = 'community';
    user.starterProfile = true;
    await user.save();

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('auth/register', { title: 'Register', error: 'Registration failed. Please try again.' });
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error(error);
    res.render('auth/register', {
      title: 'Register',
      error: explainAuthError(error, 'Registration')
    });
  }
});

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login', error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('auth/login', { title: 'Login', error: 'Login failed. Please try again.' });
      }
      res.redirect('/dashboard');
    });
  } catch (error) {
    console.error(error);
    res.render('auth/login', {
      title: 'Login',
      error: explainAuthError(error, 'Login')
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
