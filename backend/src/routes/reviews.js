const express = require('express');
const Review = require('../models/Review');
const School = require('../models/School');
const Tour = require('../models/Tour');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { targetType, targetId, rating, title, comment } = req.body;
  const review = await Review.create({
    user: req.user._id,
    targetType,
    targetId,
    rating,
    title,
    comment,
  });

  const Model = targetType === 'school' ? School : Tour;
  const items = await Review.find({ targetType, targetId });
  const avg = items.reduce((s, r) => s + r.rating, 0) / items.length;
  await Model.findByIdAndUpdate(targetId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: items.length,
  });

  res.status(201).json({ review });
});

module.exports = router;
