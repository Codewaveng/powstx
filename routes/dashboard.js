const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const POW = require('../models/POW');
const Badge = require('../models/Badge');
const { fetchWalletReputation } = require('../utils/zeroauth');
const { applyPortfolioDefaults } = require('../utils/portfolioDefaults');

const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'public', 'uploads');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Use a JPG, PNG, WEBP, or GIF image.'));
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
    applyPortfolioDefaults(user);
    if ((user.profile.bio || '').startsWith('I’m building in public.')) {
      user.profile.bio = 'Building my path in Web3 through community, growth, and thoughtful conversations. Interested in community management, growth marketing, and contributor opportunities. Open to internships and collaborations.';
      if (user.skillCategory === 'other') user.skillCategory = 'community';
    }
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
router.post('/profile', requireAuth, avatarUpload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      fullName, bio, location, website,
      github, twitter, linkedin, instagram, facebook, youtube,
      tiktok, discord, telegram, behance, dribbble, farcaster,
      skillCategory, skills, accentColor, theme, accentHex, removeCoverImage,
      linkTitle, linkUrl, linkIcon,
      daoAddress
    } = req.body;

    const user = await User.findById(req.session.user.id);
    applyPortfolioDefaults(user);

    user.profile.fullName  = fullName  || '';
    user.starterProfile = true;
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
    const allowedThemes = ['studio', 'editorial', 'ocean', 'garden', 'midnight', 'canvas'];
    user.profile.theme = allowedThemes.includes(theme) ? theme : 'studio';
    user.profile.accentHex = /^#[0-9a-fA-F]{6}$/.test(accentHex || '') ? accentHex : '#3978d4';

    // Build custom links from parallel arrays
    const titles = linkTitle ? (Array.isArray(linkTitle) ? linkTitle : [linkTitle]) : [];
    const urls   = linkUrl   ? (Array.isArray(linkUrl)   ? linkUrl   : [linkUrl])   : [];
    const icons  = linkIcon  ? (Array.isArray(linkIcon)  ? linkIcon  : [linkIcon])  : [];

    user.customLinks = titles
      .map((t, i) => ({ title: t.trim(), url: (urls[i] || '').trim(), icon: (icons[i] || 'link').trim() }))
      .filter(l => l.title && l.url);

    // Avatar upload
    const avatar = req.files?.avatar?.[0];
    const coverImage = req.files?.coverImage?.[0];
    if (avatar) {
      user.profile.avatar = `data:${avatar.mimetype};base64,${avatar.buffer.toString('base64')}`;
    }
    if (coverImage) user.profile.coverImage = `data:${coverImage.mimetype};base64,${coverImage.buffer.toString('base64')}`;
    else if (removeCoverImage === 'on') user.profile.coverImage = '';

    // Only update address | score/badges are set by /fetch-dao
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
