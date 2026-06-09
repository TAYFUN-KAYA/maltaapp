const express = require('express');
const User = require('../models/User');
const School = require('../models/School');
const Tour = require('../models/Tour');
const Beach = require('../models/Beach');
const GuideArticle = require('../models/GuideArticle');
const Booking = require('../models/Booking');
const Application = require('../models/Application');
const Inquiry = require('../models/Inquiry');
const CustomTourRequest = require('../models/CustomTourRequest');
const CustomTourMessage = require('../models/CustomTourMessage');
const Event = require('../models/Event');
const DiscountCode = require('../models/DiscountCode');
const DailyInsight = require('../models/DailyInsight');
const CommunityRoom = require('../models/CommunityRoom');
const RoomMember = require('../models/RoomMember');
const Message = require('../models/Message');
const AppConfig = require('../models/AppConfig');
const LanguageTestQuestion = require('../models/LanguageTestQuestion');
const Notification = require('../models/Notification');
const { auth, adminOnly } = require('../middleware/auth');
const { notifyUser, notifyCustomTourMessage } = require('../services/notifications');
const { prepareI18nBody } = require('../utils/i18nContent');
const { prepareEmergencyBody } = require('../utils/emergencyConfig');
const { prepareSchoolBody } = require('../utils/schoolCity');
const { parseInsightDate } = require('../utils/insightDates');
const { syncRoomMemberCount } = require('../utils/roomMembers');
const { getIo } = require('../socket/io');

const router = express.Router();
router.use(auth, adminOnly);

router.get('/dashboard', async (_req, res) => {
  const [
    users,
    schools,
    tours,
    tourRequests,
    applications,
    inquiries,
    customRequests,
    pendingRequests,
    totalCommission,
  ] = await Promise.all([
    User.countDocuments(),
    School.countDocuments({ active: true }),
    Tour.countDocuments({ active: true }),
    Booking.countDocuments(),
    Application.countDocuments(),
    Inquiry.countDocuments({ status: 'open' }),
    CustomTourRequest.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'pending' }),
    Application.aggregate([
      { $match: { commissionAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
    ]),
  ]);

  res.json({
    stats: {
      users,
      schools,
      tours,
      tourRequests,
      bookings: tourRequests,
      applications,
      inquiries,
      customRequests,
      pendingBookings: pendingRequests,
      pendingRequests,
      totalCommission: totalCommission[0]?.total || 0,
    },
  });
});

router.get('/commissions', async (_req, res) => {
  const applications = await Application.find({ commissionAmount: { $gt: 0 } })
    .populate('user', 'name email')
    .populate('school', 'name commissionRate')
    .sort({ updatedAt: -1 })
    .limit(100);
  const summary = await Application.aggregate([
    { $match: { commissionAmount: { $gt: 0 } } },
    { $group: { _id: '$status', total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } },
  ]);
  res.json({ applications, summary });
});

// ——— Tur talepleri ———
router.get('/bookings', async (_req, res) => {
  const bookings = await Booking.find()
    .populate('user', 'name email phone pushToken')
    .populate('tour', 'title price duration')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ bookings });
});

router.get('/tour-requests', async (_req, res) => {
  const requests = await Booking.find()
    .populate('user', 'name email phone')
    .populate('tour', 'title price')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

router.patch('/bookings/:id', async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('user', 'pushToken name')
    .populate('tour', 'title');

  if (booking?.user && (req.body.status === 'quoted' || req.body.quotePrice)) {
    await notifyUser(booking.user, {
      title: 'Tur talebiniz için teklif',
      body: req.body.adminReply || `Teklif: €${req.body.quotePrice || booking.quotePrice}`,
      type: 'booking',
      data: { bookingId: booking._id },
    });
  }
  if (booking?.user && req.body.status === 'confirmed') {
    await notifyUser(booking.user, {
      title: 'Tur talebiniz onaylandı',
      body: booking.adminReply || `${booking.tour?.title} talebiniz onaylandı.`,
      type: 'booking',
      data: { bookingId: booking._id, addToCalendar: true, tourTitle: booking.tour?.title, preferredDate: booking.preferredDate },
    });
  }
  if (booking?.user && req.body.status === 'cancelled') {
    await notifyUser(booking.user, {
      title: 'Tur talebi reddedildi',
      body: req.body.adminReply || 'Talebiniz maalesef onaylanmadı.',
      type: 'booking',
      data: { bookingId: booking._id },
    });
  }

  res.json({ booking });
});

// ——— Başvurular & sorular ———
router.get('/applications', async (_req, res) => {
  const applications = await Application.find()
    .populate('user', 'name email')
    .populate('school', 'name commissionRate')
    .sort({ createdAt: -1 });
  res.json({ applications });
});

router.patch('/applications/:id', async (req, res) => {
  const body = { ...req.body };
  if (req.body.status === 'enrolled' && req.body.offerPrice) {
    const app = await Application.findById(req.params.id).populate('school');
    if (app?.school?.commissionRate) {
      body.commissionAmount = Math.round((req.body.offerPrice * app.school.commissionRate) / 100);
    }
  }
  const application = await Application.findByIdAndUpdate(req.params.id, body, { new: true })
    .populate('user', 'pushToken name');
  if (application?.user && req.body.status === 'offer_sent') {
    await notifyUser(application.user, {
      title: 'Okul başvurunuz için teklif',
      body: `Teklif: €${req.body.offerPrice || application.offerPrice}`,
      type: 'inquiry',
      data: { applicationId: application._id },
    });
  }
  res.json({ application });
});

router.get('/inquiries', async (_req, res) => {
  const inquiries = await Inquiry.find()
    .populate('user', 'name email')
    .populate('school', 'name')
    .sort({ createdAt: -1 });
  res.json({ inquiries });
});

router.patch('/inquiries/:id', async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('user', 'pushToken name');
  if (inquiry?.user && req.body.status === 'replied') {
    await notifyUser(inquiry.user, {
      title: 'Okul mesajınıza yanıt',
      body: req.body.adminReply || 'Okuldan yanıt aldınız',
      type: 'inquiry',
      data: { inquiryId: inquiry._id },
    });
  }
  res.json({ inquiry });
});

// ——— Özel tur + chat ———
router.get('/custom-tours', async (_req, res) => {
  const requests = await CustomTourRequest.find()
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

router.patch('/custom-tours/:id', async (req, res) => {
  const request = await CustomTourRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('user', 'pushToken name');
  if (request?.user && (req.body.quotePrice || req.body.status === 'quoted')) {
    await notifyUser(request.user, {
      title: 'Özel tur teklifiniz hazır',
      body: req.body.quoteMessage || `Teklif: €${req.body.quotePrice || request.quotePrice}`,
      type: 'custom_tour',
      data: { requestId: request._id },
    });
  }
  if (request?.user && req.body.status === 'accepted') {
    await notifyUser(request.user, {
      title: 'Özel tur talebiniz onaylandı',
      body: req.body.quoteMessage || 'Talebiniz onaylandı.',
      type: 'custom_tour',
      data: { requestId: request._id },
    });
  }
  if (request?.user && req.body.status === 'rejected') {
    await notifyUser(request.user, {
      title: 'Özel tur talebi reddedildi',
      body: req.body.quoteMessage || 'Talebiniz onaylanmadı.',
      type: 'custom_tour',
      data: { requestId: request._id },
    });
  }
  res.json({ request });
});

router.get('/custom-tours/:id/messages', async (req, res) => {
  const messages = await CustomTourMessage.find({ request: req.params.id })
    .populate('sender', 'name role')
    .sort({ createdAt: 1 });
  res.json({ messages });
});

router.post('/custom-tours/:id/messages', async (req, res) => {
  const request = await CustomTourRequest.findById(req.params.id).populate('user', 'pushToken name');
  if (!request) return res.status(404).json({ message: 'Talep bulunamadı' });
  const message = await CustomTourMessage.create({
    request: request._id,
    sender: req.user._id,
    content: req.body.content,
    isAdmin: true,
  });
  await message.populate('sender', 'name role');
  const { emitCustomTourMessage } = require('../socket/io');
  emitCustomTourMessage(request._id.toString(), message);
  await notifyCustomTourMessage({ request, message, isAdmin: true });
  res.status(201).json({ message });
});

router.get('/notifications/unread-count', async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ count });
});

router.patch('/notifications/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { read: true });
  res.json({ ok: true });
});

router.get('/notifications', async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(80);
  res.json({ notifications });
});

router.patch('/notifications/:id/read', async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ ok: true });
});

// ——— Okullar CRUD ———
router.get('/schools', async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const schools = await School.find(filter).sort({ name: 1 });
  res.json({ schools });
});

router.post('/schools', async (req, res) => {
  try {
    const school = await School.create(prepareI18nBody(prepareSchoolBody(req.body), ['description']));
    res.status(201).json({ school });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Okul kaydedilemedi' });
  }
});

router.patch('/schools/:id', async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      prepareI18nBody(prepareSchoolBody(req.body), ['description']),
      { new: true, runValidators: true }
    );
    if (!school) return res.status(404).json({ message: 'Okul bulunamadı' });
    res.json({ school });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Okul güncellenemedi' });
  }
});

router.delete('/schools/:id', async (req, res) => {
  await School.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ ok: true });
});

// ——— Turlar CRUD ———
router.get('/tours', async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const tours = await Tour.find(filter).sort({ title: 1 });
  res.json({ tours });
});

router.post('/tours', async (req, res) => {
  try {
    const body = prepareI18nBody(req.body, ['title', 'description']);
    if (body.active === undefined || body.active === null) body.active = true;
    const tour = await Tour.create(body);
    res.status(201).json({ tour });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Tur kaydedilemedi' });
  }
});

router.patch('/tours/:id', async (req, res) => {
  try {
    const body = prepareI18nBody(req.body, ['title', 'description']);
    const tour = await Tour.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!tour) return res.status(404).json({ message: 'Tur bulunamadı' });
    res.json({ tour });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Tur güncellenemedi' });
  }
});

router.delete('/tours/:id', async (req, res) => {
  await Tour.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ ok: true });
});

// ——— Plajlar ———
router.get('/beaches', async (_req, res) => {
  const beaches = await Beach.find().sort({ name: 1 });
  res.json({ beaches });
});

router.post('/beaches', async (req, res) => {
  const beach = await Beach.create(prepareI18nBody(req.body, ['description']));
  res.status(201).json({ beach });
});

router.patch('/beaches/:id', async (req, res) => {
  const beach = await Beach.findByIdAndUpdate(req.params.id, prepareI18nBody(req.body, ['description']), {
    new: true,
  });
  res.json({ beach });
});

router.delete('/beaches/:id', async (req, res) => {
  await Beach.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ——— Rehber makaleleri ———
router.get('/articles', async (_req, res) => {
  const articles = await GuideArticle.find().sort({ order: 1, title: 1 });
  res.json({ articles });
});

router.post('/articles', async (req, res) => {
  const article = await GuideArticle.create(prepareI18nBody(req.body, ['title', 'content']));
  res.status(201).json({ article });
});

router.patch('/articles/:id', async (req, res) => {
  const article = await GuideArticle.findByIdAndUpdate(
    req.params.id,
    prepareI18nBody(req.body, ['title', 'content']),
    { new: true }
  );
  res.json({ article });
});

router.delete('/articles/:id', async (req, res) => {
  await GuideArticle.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ——— Etkinlikler ———
router.get('/events', async (_req, res) => {
  const events = await Event.find().populate('createdBy', 'name').sort({ date: -1 });
  res.json({ events });
});

router.post('/events', async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ event });
});

router.patch('/events/:id', async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ event });
});

router.delete('/events/:id', async (req, res) => {
  await Event.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ ok: true });
});

// ——— İndirim kodları ———
router.get('/discount-codes', async (_req, res) => {
  const codes = await DiscountCode.find().sort({ code: 1 });
  res.json({ codes });
});

router.post('/discount-codes', async (req, res) => {
  const code = await DiscountCode.create(req.body);
  res.status(201).json({ code });
});

router.patch('/discount-codes/:id', async (req, res) => {
  const code = await DiscountCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ code });
});

router.delete('/discount-codes/:id', async (req, res) => {
  await DiscountCode.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ——— Günlük kartlar ———
router.get('/insights', async (_req, res) => {
  const insights = await DailyInsight.find().sort({ date: -1 }).limit(50);
  res.json({ insights });
});

router.post('/insights', async (req, res) => {
  const body = prepareI18nBody(req.body, ['title', 'description']);
  body.date = parseInsightDate(req.body.date);
  if (!body.userTypes?.length) body.userTypes = ['all'];
  const insight = await DailyInsight.create(body);
  res.status(201).json({ insight });
});

router.patch('/insights/:id', async (req, res) => {
  const body = prepareI18nBody(req.body, ['title', 'description']);
  if (req.body.date) body.date = parseInsightDate(req.body.date);
  if (body.userTypes && !body.userTypes.length) body.userTypes = ['all'];
  const insight = await DailyInsight.findByIdAndUpdate(req.params.id, body, { new: true });
  res.json({ insight });
});

router.delete('/insights/:id', async (req, res) => {
  await DailyInsight.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ——— Topluluk odaları ———
router.get('/rooms', async (_req, res) => {
  const rooms = await CommunityRoom.find().sort({ name: 1 });
  res.json({ rooms });
});

router.post('/rooms', async (req, res) => {
  const { memberCount: _mc, ...data } = req.body;
  const room = await CommunityRoom.create({ ...data, memberCount: 0 });
  res.status(201).json({ room });
});

router.patch('/rooms/:id', async (req, res) => {
  const { memberCount: _mc, ...data } = req.body;
  const room = await CommunityRoom.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  room.memberCount = await syncRoomMemberCount(room._id);
  res.json({ room });
});

router.delete('/rooms/:id', async (req, res) => {
  const room = await CommunityRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  await RoomMember.deleteMany({ room: room._id });
  await Message.deleteMany({ room: room._id });
  await room.deleteOne();
  res.json({ ok: true });
});

router.get('/rooms/:id/members', async (req, res) => {
  const room = await CommunityRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  const members = await RoomMember.find({ room: room._id })
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({
    members: members.map((m) => ({
      _id: m._id,
      userId: m.user?._id,
      name: m.user?.name,
      email: m.user?.email,
      phone: m.user?.phone,
      joinedAt: m.createdAt,
    })),
    memberCount: members.length,
  });
});

router.delete('/rooms/:id/members/:userId', async (req, res) => {
  const room = await CommunityRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  await RoomMember.deleteOne({ room: room._id, user: req.params.userId });
  const memberCount = await syncRoomMemberCount(room._id);
  const io = getIo();
  if (io) {
    io.to(`user:${req.params.userId}`).emit('room_kicked', { roomId: room._id.toString() });
  }
  res.json({ ok: true, memberCount });
});

// ——— Uygulama ayarları ———
router.get('/app-config', async (_req, res) => {
  let config = await AppConfig.findOne({ key: 'main' });
  if (!config) config = await AppConfig.create({ key: 'main' });
  res.json({ config });
});

router.patch('/app-config', async (req, res) => {
  const body =
    req.body.emergencyPage || req.body.emergencyContacts || req.body.emergencyInfoSections
      ? prepareEmergencyBody(req.body)
      : req.body;
  const config = await AppConfig.findOneAndUpdate({ key: 'main' }, body, { new: true, upsert: true });
  res.json({ config });
});

// ——— Dil testi soruları ———
router.get('/language-test', async (_req, res) => {
  const questions = await LanguageTestQuestion.find().sort({ order: 1 });
  res.json({ questions });
});

router.post('/language-test', async (req, res) => {
  const q = await LanguageTestQuestion.create(req.body);
  res.status(201).json({ question: q });
});

router.patch('/language-test/:id', async (req, res) => {
  const q = await LanguageTestQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ question: q });
});

router.delete('/language-test/:id', async (req, res) => {
  await LanguageTestQuestion.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
