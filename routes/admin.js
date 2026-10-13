const express = require('express');
const router = express.Router();
const User = require('../models/User');
const POW = require('../models/POW');
const Review = require('../models/Review');

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = q ? new RegExp(escaped, 'i') : null;
    const [totalUsers, totalPOWs, pendingReviews, approvedReviews] = await Promise.all([
      User.countDocuments(), POW.countDocuments(),
      Review.find({ status: 'pending' }).populate('subject', 'username profile.fullName').sort({ createdAt: 1 }),
      Review.countDocuments({ status: 'approved' })
    ]);
    const matchingUsers = pattern ? await User.find({
      $or: [{ username: pattern }, { email: pattern }, { 'profile.fullName': pattern }]
    }).select('username email profile.fullName createdAt').sort({ createdAt: -1 }).limit(100) : null;
    const ownerIds = pattern ? matchingUsers.map(user => user._id) : null;
    const powFilter = pattern
      ? { $or: [{ title: pattern }, { description: pattern }, { skills: pattern }, { user: { $in: ownerIds } }] }
      : {};
    const [users, pows] = await Promise.all([
      matchingUsers || User.find({}).select('username email profile.fullName createdAt').sort({ createdAt: -1 }).limit(100),
      POW.find(powFilter).populate('user', 'username profile.fullName').sort({ createdAt: -1 }).limit(100)
    ]);
    res.render('admin/index', {
      title: 'Admin', totalUsers, totalPOWs, pendingReviews, approvedReviews,
      notice: req.query.notice || '', q, users, pows
    });
  } catch (error) {
    console.error('Admin page error:', error);
    res.status(500).send('Unable to load admin dashboard.');
  }
});

router.post('/reviews/:id/:action', async (req, res) => {
  if (!['approve', 'reject'].includes(req.params.action)) return res.sendStatus(400);
  try {
    const status = req.params.action === 'approve' ? 'approved' : 'rejected';
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' }, { $set: { status } }, { new: true }
    );
    if (!review) return res.redirect('/admin?notice=missing');
    if (status === 'approved') {
      await User.findByIdAndUpdate(review.subject, { $inc: { 'reputation.score': review.rating } });
    }
    res.redirect(`/admin?notice=${status}`);
  } catch (error) {
    console.error('Review moderation error:', error);
    res.redirect('/admin?notice=error');
  }
});

module.exports = router;
