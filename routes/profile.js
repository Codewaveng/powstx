const express = require('express');
const router = express.Router();
const User = require('../models/User');
const POW = require('../models/POW');
const Badge = require('../models/Badge');
const Review = require('../models/Review');
const { applyPortfolioDefaults } = require('../utils/portfolioDefaults');

const skillCategoryLabels = {
  webdev:      'Web Developer',
  mobiledev:   'Mobile Developer',
  design:      'Designer',
  marketing:   'Marketer',
  content:     'Content Creator',
  video:       'Video Creator',
  photography: 'Photographer',
  music:       'Musician',
  writing:     'Writer',
  data:        'Data Scientist',
  devops:      'DevOps Engineer',
  web3:        'Web3 / Blockchain',
  community:   'Community Manager',
  research:    'Researcher',
  other:       'Creator'
};

const powTypeLabels = {
  code:        { label: 'Code',        icon: 'fa-code' },
  design:      { label: 'Design',      icon: 'fa-palette' },
  marketing:   { label: 'Marketing',   icon: 'fa-bullhorn' },
  content:     { label: 'Content',     icon: 'fa-pen-nib' },
  video:       { label: 'Video',       icon: 'fa-video' },
  photography: { label: 'Photography', icon: 'fa-camera' },
  music:       { label: 'Music',       icon: 'fa-music' },
  research:    { label: 'Research',    icon: 'fa-flask' },
  dao:         { label: 'DAO',         icon: 'fa-users' },
  community:   { label: 'Community',   icon: 'fa-comments' },
  project:     { label: 'Project',     icon: 'fa-project-diagram' },
  writing:     { label: 'Writing',     icon: 'fa-file-alt' },
  other:       { label: 'Other',       icon: 'fa-briefcase' },
  github:      { label: 'Code',        icon: 'fa-code' },
  article:     { label: 'Writing',     icon: 'fa-file-alt' }
};

// Public profile page
router.get('/:username', async (req, res) => {
  // Skip known routes
  const skip = ['auth', 'dashboard', 'pow', 'api'];
  if (skip.includes(req.params.username)) return;

  try {
    const profileUser = await User.findOne({ username: req.params.username });

    if (!profileUser) {
      return res.status(404).render('404', { title: 'User Not Found' });
    }

    applyPortfolioDefaults(profileUser);
    if ((profileUser.profile.bio || '').startsWith('I’m building in public.')) {
      profileUser.profile.bio = 'Building my path in Web3 through community, growth, and thoughtful conversations. Interested in community management, growth marketing, and contributor opportunities. Open to internships and collaborations.';
      if (profileUser.skillCategory === 'other') profileUser.skillCategory = 'community';
    }

    const pows = await POW.find({ user: profileUser._id, isPublic: true }).sort({ startDate: -1 });
    const badges = await Badge.find({ user: profileUser._id });
    const reviews = await Review.find({ subject: profileUser._id, status: 'approved' }).sort({ createdAt: -1 });
    const ratingAverage = reviews.length
      ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
      : 0;

    const stats = {
      totalPOWs:    pows.length,
      verifiedPOWs: pows.filter(p => p.verification.status !== 'self-reported').length,
      totalBadges:  badges.length,
      reputation:   profileUser.reputation.score,
      reviewCount: reviews.length,
      ratingAverage
    };

    // Increment profile views (fire and forget)
    User.findByIdAndUpdate(profileUser._id, { $inc: { profileViews: 1 } }).exec();

    const isOwner = req.session.user && req.session.user.id === profileUser._id.toString();

    res.render('profile/portfolio', {
      title: `${profileUser.profile.fullName || profileUser.username} | POWtfolio`,
      profileUser,
      pows,
      badges,
      reviews,
      stats,
      reviewToast: ({ submitted: { msg: 'Thanks! Your review was sent for approval.', type: 'success' }, invalid: { msg: 'Please check your name, rating, and review.', type: 'error' }, unavailable: { msg: 'Reviews can only be submitted for an active creator profile.', type: 'error' }, error: { msg: 'We could not submit your review. Please try again.', type: 'error' } })[req.query.review] || null,
      isOwner,
      skillCategoryLabels,
      powTypeLabels
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
