const express = require('express');
const School = require('../models/School');
const Review = require('../models/Review');
const Inquiry = require('../models/Inquiry');
const Application = require('../models/Application');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const { resolveLang, localizeDoc, localizeDocs } = require('../utils/i18nContent');
const { prepareSchoolBody } = require('../utils/schoolCity');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  const {
    city,
    courseType,
    minPrice,
    maxPrice,
    minAge,
    accreditation,
    search,
    featured,
    sort = 'rating',
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { active: true };
  if (city) filter.city = city;
  if (courseType) filter.courseTypes = courseType;
  if (minPrice || maxPrice) {
    filter.priceFrom = {};
    if (minPrice) filter.priceFrom.$gte = Number(minPrice);
    if (maxPrice) filter.priceFrom.$lte = Number(maxPrice);
  }
  if (minAge) filter.minAge = { $lte: Number(minAge) };
  if (accreditation) filter.accreditations = accreditation;
  if (featured === 'true') filter.featured = true;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
    ];
  }

  const sortMap = { rating: { rating: -1 }, price: { priceFrom: 1 }, price_desc: { priceFrom: -1 } };
  const skip = (Number(page) - 1) * Number(limit);

  const lang = resolveLang(req);
  const [schools, total] = await Promise.all([
    School.find(filter).sort(sortMap[sort] || sortMap.rating).skip(skip).limit(Number(limit)),
    School.countDocuments(filter),
  ]);

  res.json({
    schools: localizeDocs(schools, lang, ['description']),
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

router.get('/meta/filters', async (_req, res) => {
  const schools = await School.find({ active: true }).select('accreditations city courseTypes');
  const accreditations = [...new Set(schools.flatMap((s) => s.accreditations || []))].filter(Boolean).sort();
  const cities = [...new Set(schools.map((s) => s.city))].sort();
  const courseTypes = [...new Set(schools.flatMap((s) => s.courseTypes || []))].sort();
  res.json({ accreditations, cities, courseTypes });
});

router.get('/compare', async (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (ids.length < 2 || ids.length > 4) {
    return res.status(400).json({ message: '2-4 okul seçin' });
  }
  const lang = resolveLang(req);
  const schools = await School.find({ _id: { $in: ids }, active: true });
  res.json({ schools: localizeDocs(schools, lang, ['description']) });
});

router.get('/:id', async (req, res) => {
  const lang = resolveLang(req);
  const school = await School.findById(req.params.id);
  if (!school) return res.status(404).json({ message: 'Okul bulunamadı' });
  const reviews = await Review.find({ targetType: 'school', targetId: school._id })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ school: localizeDoc(school, lang, ['description']), reviews });
});

router.post('/:id/inquiry', auth, async (req, res) => {
  const inquiry = await Inquiry.create({
    user: req.user._id,
    school: req.params.id,
    message: req.body.message,
    courseInterest: req.body.courseInterest,
    weeks: req.body.weeks,
  });
  res.status(201).json({ inquiry });
});

router.post('/:id/apply', auth, async (req, res) => {
  const application = await Application.create({
    user: req.user._id,
    school: req.params.id,
    course: req.body.course,
    weeks: req.body.weeks,
    startDate: req.body.startDate,
    status: 'submitted',
  });
  res.status(201).json({ application });
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const school = await School.create(prepareSchoolBody(req.body));
    res.status(201).json({ school });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Okul kaydedilemedi' });
  }
});

router.patch('/:id', auth, adminOnly, async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, prepareSchoolBody(req.body), {
      new: true,
      runValidators: true,
    });
    if (!school) return res.status(404).json({ message: 'Okul bulunamadı' });
    res.json({ school });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Okul güncellenemedi' });
  }
});

module.exports = router;
