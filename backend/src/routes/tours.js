const express = require('express');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const CustomTourRequest = require('../models/CustomTourRequest');
const DiscountCode = require('../models/DiscountCode');
const Review = require('../models/Review');
const CustomTourMessage = require('../models/CustomTourMessage');
const { auth, adminOnly, optionalAuth } = require('../middleware/auth');
const {
  notifyCustomTourMessage,
  notifyCustomTourRequestCreated,
} = require('../services/notifications');
const { resolveLang, localizeDoc, localizeDocs } = require('../utils/i18nContent');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  const {
    category,
    audience,
    season,
    minPrice,
    maxPrice,
    studentOnly,
    search,
    featured,
    page = 1,
    limit = 50,
  } = req.query;

  const filter = { active: true };
  if (category) filter.category = category;
  if (audience) filter.audience = audience;
  if (season) filter.season = season;
  if (studentOnly === 'true') filter.studentOnly = true;
  if (featured === 'true') filter.featured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) filter.title = new RegExp(search, 'i');

  const lang = resolveLang(req);
  const skip = (Number(page) - 1) * Number(limit);
  const [tours, total] = await Promise.all([
    Tour.find(filter).sort({ featured: -1, createdAt: -1, rating: -1 }).skip(skip).limit(Number(limit)),
    Tour.countDocuments(filter),
  ]);

  res.json({
    tours: localizeDocs(tours, lang, ['title', 'description']),
    total,
    page: Number(page),
  });
});

router.get('/discount-codes', async (_req, res) => {
  const codes = await DiscountCode.find({ active: true }).select('-usedCount');
  res.json({ codes });
});

router.post('/validate-discount', async (req, res) => {
  const { code, tourId, participants = 1 } = req.body;
  if (!code) return res.status(400).json({ message: 'Kod gerekli' });
  const discount = await DiscountCode.findOne({ code: code.toUpperCase(), active: true });
  if (!discount) return res.status(404).json({ valid: false, message: 'Geçersiz kod' });
  if (discount.validUntil && discount.validUntil < new Date()) {
    return res.json({ valid: false, message: 'Kodun süresi dolmuş' });
  }
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    return res.json({ valid: false, message: 'Kullanım limiti dolmuş' });
  }
  let tour = null;
  let estimatedPrice = 0;
  if (tourId) {
    tour = await Tour.findById(tourId);
    if (tour) estimatedPrice = tour.price * participants;
  }
  if (discount.minPurchase && estimatedPrice < discount.minPurchase) {
    return res.json({ valid: false, message: `Minimum €${discount.minPurchase} gerekli` });
  }
  if (discount.tourCategories?.length && tour && !discount.tourCategories.includes(tour.category)) {
    return res.json({ valid: false, message: 'Bu tur için geçerli değil' });
  }
  let savings = 0;
  if (discount.percent) savings = Math.round((estimatedPrice * discount.percent) / 100);
  if (discount.fixedAmount) savings = discount.fixedAmount;
  res.json({
    valid: true,
    code: discount.code,
    savings,
    estimatedAfter: Math.max(0, estimatedPrice - savings),
    message: discount.percent ? `%${discount.percent} indirim` : `€${savings} indirim`,
  });
});

router.get('/activities/top50', async (req, res) => {
  const lang = resolveLang(req);
  const tours = await Tour.find({ active: true }).sort({ rating: -1, reviewCount: -1 }).limit(50);
  res.json({ activities: localizeDocs(tours, lang, ['title', 'description']) });
});

router.get('/seasonal/:season', async (req, res) => {
  const lang = resolveLang(req);
  const tours = await Tour.find({ active: true, season: { $in: [req.params.season, 'all'] } }).limit(20);
  res.json({
    tours: localizeDocs(tours, lang, ['title', 'description']),
    season: req.params.season,
  });
});

router.get('/requests/mine', auth, async (req, res) => {
  const requests = await Booking.find({ user: req.user._id })
    .populate('tour', 'title price duration')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

router.get('/requests/:requestId', auth, async (req, res) => {
  const request = await Booking.findOne({ _id: req.params.requestId, user: req.user._id })
    .populate('tour', 'title price duration location');
  if (!request) return res.status(404).json({ message: 'Talep bulunamadı' });
  res.json({ request });
});

router.get('/:id', async (req, res) => {
  const lang = resolveLang(req);
  const tour = await Tour.findById(req.params.id);
  if (!tour) return res.status(404).json({ message: 'Tur bulunamadı' });
  const reviews = await Review.find({ targetType: 'tour', targetId: tour._id })
    .populate('user', 'name avatar')
    .limit(20);
  res.json({ tour: localizeDoc(tour, lang, ['title', 'description']), reviews });
});

async function createTourRequest(req, res) {
  const tour = await Tour.findById(req.params.id);
  if (!tour) return res.status(404).json({ message: 'Tur bulunamadı' });

  let spotsLeft = null;
  if (req.body.groupDateId && tour.availableDates?.length) {
    const slot = tour.availableDates.find(
      (d) => d._id?.toString() === req.body.groupDateId || d.date?.toISOString?.() === req.body.groupDateId
    );
    if (slot && slot.spotsLeft <= 0) {
      return res.status(400).json({ message: 'Bu tarihte kontenjan dolu' });
    }
    if (slot) {
      slot.spotsLeft = Math.max(0, (slot.spotsLeft || 0) - (req.body.participants || 1));
      spotsLeft = slot.spotsLeft;
      await tour.save();
    }
  }

  const estimatedPrice = tour.price * (req.body.participants || 1);

  const request = await Booking.create({
    user: req.user._id,
    tour: tour._id,
    preferredDate: req.body.preferredDate || req.body.date,
    participants: req.body.participants || 1,
    estimatedPrice,
    discountCodeNote: req.body.discountCode,
    status: 'pending',
    contactPhone: req.body.contactPhone,
    message: req.body.message,
    groupDateId: req.body.groupDateId,
  });

  res.status(201).json({ request, spotsLeft, message: 'Talebiniz alındı. Ekibimiz size dönüş yapacak.' });
}

router.post('/:id/request', auth, createTourRequest);
router.post('/:id/book', auth, createTourRequest);

router.post('/custom-request', auth, async (req, res) => {
  const request = await CustomTourRequest.create({
    user: req.user._id,
    preferredDate: req.body.preferredDate,
    flexibleDates: req.body.flexibleDates,
    participants: req.body.participants,
    budget: req.body.budget,
    requirements: req.body.requirements,
    tags: req.body.tags || [],
  });
  await notifyCustomTourRequestCreated(request, req.user);
  res.status(201).json({ request });
});

router.get('/custom-requests/mine', auth, async (req, res) => {
  const requests = await CustomTourRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ requests });
});

router.get('/custom-requests/:id', auth, async (req, res) => {
  const request = await CustomTourRequest.findOne({ _id: req.params.id, user: req.user._id });
  if (!request) return res.status(404).json({ message: 'Talep bulunamadı' });
  res.json({ request });
});

router.get('/custom-requests/:id/messages', auth, async (req, res) => {
  const request = await CustomTourRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Bulunamadı' });
  if (!request.user.equals(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yetkisiz' });
  }
  const messages = await CustomTourMessage.find({ request: req.params.id })
    .populate('sender', 'name role')
    .sort({ createdAt: 1 });
  res.json({ messages, request });
});

router.post('/custom-requests/:id/messages', auth, async (req, res) => {
  const request = await CustomTourRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Bulunamadı' });
  if (!request.user.equals(req.user._id)) return res.status(403).json({ message: 'Yetkisiz' });
  const message = await CustomTourMessage.create({
    request: request._id,
    sender: req.user._id,
    content: req.body.content,
    isAdmin: false,
  });
  await message.populate('sender', 'name role');
  const { emitCustomTourMessage } = require('../socket/io');
  emitCustomTourMessage(request._id.toString(), message);
  await notifyCustomTourMessage({ request, message, isAdmin: false });
  res.status(201).json({ message });
});

router.post('/', auth, adminOnly, async (req, res) => {
  const tour = await Tour.create(req.body);
  res.status(201).json({ tour });
});

router.patch('/:id', auth, adminOnly, async (req, res) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ tour });
});

module.exports = router;
