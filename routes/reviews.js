const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');

router.post('/:username/reviews', async (req, res) => {
  const username = String(req.params.username || '').toLowerCase();
  const name = String(req.body.name || '').trim();
  const message = String(req.body.message || '').trim();
  const rating = Number(req.body.rating);
  const redirectTo = `/${encodeURIComponent(username)}`;

  if (!name || name.length > 80 || !message || message.length > 1200 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.redirect(`${redirectTo}?review=invalid#reviews`);
  }

  try {
    const subject = await User.findOne({ username });
    if (!subject) return res.status(404).render('404', { title: 'User Not Found' });
    await Review.create({ subject: subject._id, name, message, rating });
    res.redirect(`${redirectTo}?review=submitted#reviews`);
  } catch (error) {
    console.error('Review submission error:', error);
    res.redirect(`${redirectTo}?review=error#reviews`);
  }
});

module.exports = router;
