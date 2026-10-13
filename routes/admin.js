const express = require('express');
const router = express.Router();
const User = require('../models/User');
const POW = require('../models/POW');
const Review = require('../models/Review');

router.get('/', async (req, res) => {
  try {
    const [totalUsers, totalPOWs, pendingReviews, approvedReviews] = await Promise.all([
      User.countDocuments(), POW.countDocuments(),
      Review.find({ status: 'pending' }).populate('subject', 'username profile.fullName').sort({ createdAt: 1 }),
      Review.countDocuments({ status: 'approved' })
    ]);
    res.render('admin/index', {
      title: 'Admin', totalUsers, totalPOWs, pendingReviews, approvedReviews,
      notice: req.query.notice || ''
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
