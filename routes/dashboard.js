const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const POW = require('../models/POW');
const Badge = require('../models/Badge');
const { fetchWalletReputation } = require('../utils/zeroauth');

const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'public', 'uploads');

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const fs = require('fs');
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `avatar-${req.session.user.id}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed for avatars'));
  }
});

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}

// Dashboard home
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    const pows = await POW.find({ user: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    const badges = await Badge.find({ user: req.session.user.id });

    const stats = {
      totalPOWs:    await POW.countDocuments({ user: req.session.user.id }),
      verifiedPOWs: await POW.countDocuments({
        user: req.session.user.id,
        'verification.status': { $ne: 'self-reported' }
      }),
      totalBadges: badges.length,
      reputation:  user.reputation.score
    };

    res.render('dashboard/index', { title: 'Dashboard', user, pows, badges, stats });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Profile settings page
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('dashboard/profile', { title: 'Profile Settings', user, success: null, error: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Fetch ZeroAuth DAO reputation (AJAX)
router.get('/fetch-dao', requireAuth, async (req, res) => {
  const { address } = req.query;
  if (!address || !address.trim()) {
    return res.json({ error: 'Stacks wallet address is required.' });
  }
  try {
    const data = await fetchWalletReputation(address.trim());

    // Cache the result on the user document
    await User.findByIdAndUpdate(req.session.user.id, {
      'zeroAuthDAO.address':     data.address,
      'zeroAuthDAO.score':       data.score,
      'zeroAuthDAO.badges':      data.badges,
      'zeroAuthDAO.nftCount':    data.nftCount,
      'zeroAuthDAO.displayName': data.displayName,
      'zeroAuthDAO.verified':    data.verified,
      'zeroAuthDAO.lastFetched': new Date(),
      'zeroAuthDAO.bnsName':     data.bnsName     || '',
      'zeroAuthDAO.bounties':    data.bounties     || 0,
      'zeroAuthDAO.submissions': data.submissions  || 0,
      'zeroAuthDAO.profileCompleteness': data.profileCompleteness || 0
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('ZeroAuth fetch error:', err.message);
    res.json({ error: err.message || 'Could not fetch reputation.' });
  }
});

// Update profile
router.post('/profile', requireAuth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const {
      fullName, bio, location, website,
      github, twitter, linkedin, instagram, facebook, youtube,
      tiktok, discord, telegram, behance, dribbble, farcaster,
      skillCategory, skills, accentColor,
      linkTitle, linkUrl, linkIcon,
      daoAddress
    } = req.body;

    const user = await User.findById(req.session.user.id);

    user.profile.fullName  = fullName  || '';
    user.profile.bio       = bio       || '';
    user.profile.location  = location  || '';
    user.profile.website   = website   || '';
    user.profile.github    = github    || '';
    user.profile.twitter   = twitter   || '';
    user.profile.linkedin  = linkedin  || '';
    user.profile.instagram = instagram || '';
    user.profile.facebook  = facebook  || '';
    user.profile.youtube   = youtube   || '';
    user.profile.tiktok    = tiktok    || '';
    user.profile.discord   = discord   || '';
    user.profile.telegram  = telegram  || '';
    user.profile.behance   = behance   || '';
    user.profile.dribbble  = dribbble  || '';
    user.profile.farcaster = farcaster || '';

    user.skillCategory = skillCategory || 'other';
    user.skills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    user.accentColor = accentColor || 'purple';

    // Build custom links from parallel arrays
    const titles = linkTitle ? (Array.isArray(linkTitle) ? linkTitle : [linkTitle]) : [];
    const urls   = linkUrl   ? (Array.isArray(linkUrl)   ? linkUrl   : [linkUrl])   : [];
    const icons  = linkIcon  ? (Array.isArray(linkIcon)  ? linkIcon  : [linkIcon])  : [];

    user.customLinks = titles
      .map((t, i) => ({ title: t.trim(), url: (urls[i] || '').trim(), icon: (icons[i] || 'link').trim() }))
      .filter(l => l.title && l.url);

    // Avatar upload
    if (req.file) {
      user.profile.avatar = `/uploads/${req.file.filename}`;
    }

    // Only update address — score/badges are set by /fetch-dao
    if (daoAddress !== undefined) {
      user.zeroAuthDAO.address = daoAddress || '';
    }

    await user.save();

    res.render('dashboard/profile', {
      title: 'Profile Settings',
      user,
      success: 'Profile updated successfully!',
      error: null
    });
  } catch (error) {
    console.error(error);
    const user = await User.findById(req.session.user.id);
    res.render('dashboard/profile', {
      title: 'Profile Settings',
      user,
      success: null,
      error: 'Failed to update profile. Please try again.'
    });
  }
});

module.exports = router;
