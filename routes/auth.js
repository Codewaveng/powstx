const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Register', error: null });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    // Validation
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
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.render('auth/register', { 
        title: 'Register', 
        error: 'Username or email already exists' 
      });
    }
    
    // Create user
    const user = new User({ username, email, password });
    await user.save();
    
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.render('auth/register', { 
      title: 'Register', 
      error: 'Registration failed. Please try again.' 
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
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.render('auth/login', { 
      title: 'Login', 
      error: 'Login failed. Please try again.' 
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
