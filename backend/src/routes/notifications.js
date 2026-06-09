const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Beach = require('../models/Beach');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register-token', auth, async (req, res) => {
  req.user.pushToken = req.body.pushToken;
  if (req.body.latitude != null) {
    req.user.lastLatitude = req.body.latitude;
    req.user.lastLongitude = req.body.longitude;
  }
  await req.user.save();
  res.json({ ok: true });
});

router.get('/mine', auth, async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications });
});

router.get('/unread-count', auth, async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ count });
});

router.patch('/read-all', auth, async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { read: true });
  res.json({ ok: true });
});

router.patch('/:id/read', auth, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ ok: true });
});

router.post('/location-check', auth, async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ message: 'Konum gerekli' });
  }

  const beaches = await Beach.find({
    crowdLevel: { $in: ['high', 'very_high'] },
    'coordinates.lat': { $exists: true },
  });

  const alerts = [];
  const toRad = (d) => (d * Math.PI) / 180;
  const distKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  for (const beach of beaches) {
    if (!beach.coordinates?.lat) continue;
    const km = distKm(latitude, longitude, beach.coordinates.lat, beach.coordinates.lng);
    if (km < 3) {
      alerts.push({
        beachId: beach._id,
        beachName: beach.name,
        crowdLevel: beach.crowdLevel,
        distanceKm: Math.round(km * 10) / 10,
        message: `${beach.name} yakınında kalabalık olabilir`,
      });
    }
  }

  req.user.lastLatitude = latitude;
  req.user.lastLongitude = longitude;
  await req.user.save();

  res.json({ alerts });
});

module.exports = router;
