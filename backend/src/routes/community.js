const express = require('express');
const CommunityRoom = require('../models/CommunityRoom');
const RoomMember = require('../models/RoomMember');
const Message = require('../models/Message');
const Post = require('../models/Post');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const { syncRoomMemberCount, isRoomMember } = require('../utils/roomMembers');
const { emitRoomMessage } = require('../socket/io');
const { serializeEvent, serializeEvents } = require('../utils/eventImages');

const router = express.Router();

router.get('/support', async (_req, res) => {
  const AppConfig = require('../models/AppConfig');
  const config = await AppConfig.findOne({ key: 'main' });
  let room = null;
  if (config?.supportRoomId) {
    room = await CommunityRoom.findById(config.supportRoomId);
  }
  if (!room) {
    room = await CommunityRoom.findOne({ slug: 'turkce-destek' }) || await CommunityRoom.findOne({ isPublic: true });
  }
  res.json({ room, supportPhone: config?.supportPhone });
});

router.get('/events', async (req, res) => {
  const filter = { active: true, date: { $gte: new Date() } };
  if (req.query.type) filter.type = req.query.type;
  const events = await Event.find(filter)
    .populate('createdBy', 'name avatar')
    .sort({ date: 1 })
    .limit(50);
  res.json({ events: serializeEvents(events) });
});

router.get('/events/:id', async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, active: true }).populate(
    'createdBy',
    'name avatar'
  );
  if (!event) return res.status(404).json({ message: 'Etkinlik bulunamadı' });
  res.json({ event: serializeEvent(event) });
});

router.post('/events', auth, async (req, res) => {
  const event = await Event.create({
    ...req.body,
    createdBy: req.user._id,
    attendees: [req.user._id],
  });
  await event.populate('createdBy', 'name avatar');
  res.status(201).json({ event });
});

router.post('/events/:id/join', auth, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Etkinlik bulunamadı' });
  if (!event.attendees.some((id) => id.equals(req.user._id))) {
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Kontenjan dolu' });
    }
    event.attendees.push(req.user._id);
    await event.save();
  }
  res.json({ event: serializeEvent(event) });
});

router.get('/users', auth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id }, role: 'user' })
    .select('name avatar country city userType')
    .limit(50);
  res.json({ users });
});

router.get('/rooms', async (_req, res) => {
  const rooms = await CommunityRoom.find({ isPublic: true }).sort({ memberCount: -1 });
  res.json({ rooms });
});

router.get('/rooms/:id', async (req, res) => {
  const room = await CommunityRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  res.json({ room });
});

router.get('/rooms/:id/status', auth, async (req, res) => {
  const room = await CommunityRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  const joined = !!(await isRoomMember(room._id, req.user._id));
  res.json({ room, joined, memberCount: room.memberCount });
});

router.post('/rooms/:id/join', auth, async (req, res) => {
  const room = await CommunityRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  await RoomMember.findOneAndUpdate(
    { room: room._id, user: req.user._id },
    { room: room._id, user: req.user._id },
    { upsert: true, new: true }
  );
  const memberCount = await syncRoomMemberCount(room._id);
  res.json({ joined: true, memberCount });
});

router.post('/rooms/:id/leave', auth, async (req, res) => {
  const room = await CommunityRoom.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Oda bulunamadı' });
  await RoomMember.deleteOne({ room: room._id, user: req.user._id });
  const memberCount = await syncRoomMemberCount(room._id);
  res.json({ joined: false, memberCount });
});

router.get('/rooms/:id/messages', auth, async (req, res) => {
  const joined = await isRoomMember(req.params.id, req.user._id);
  if (!joined) return res.status(403).json({ message: 'Önce odaya katılın' });
  const messages = await Message.find({ room: req.params.id })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ messages: messages.reverse() });
});

router.post('/rooms/:id/messages', auth, async (req, res) => {
  const joined = await isRoomMember(req.params.id, req.user._id);
  if (!joined) return res.status(403).json({ message: 'Önce odaya katılın' });
  if (!req.body.content?.trim()) return res.status(400).json({ message: 'Mesaj boş olamaz' });

  const message = await Message.create({
    sender: req.user._id,
    room: req.params.id,
    content: req.body.content.trim(),
    type: 'text',
  });
  await message.populate('sender', 'name avatar');
  emitRoomMessage(req.params.id, message);
  res.status(201).json({ message });
});

router.get('/feed', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'name avatar userType')
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit) || 30);
  res.json({ posts });
});

router.post('/feed', auth, async (req, res) => {
  const post = await Post.create({
    user: req.user._id,
    content: req.body.content,
    images: req.body.images || [],
    tags: req.body.tags || [],
  });
  await post.populate('user', 'name avatar');
  res.status(201).json({ post });
});

router.post('/feed/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const idx = post.likes.indexOf(req.user._id);
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(req.user._id);
  await post.save();
  res.json({ likes: post.likes.length });
});

router.get('/dm/:userId', auth, async (req, res) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: req.params.userId },
      { sender: req.params.userId, receiver: req.user._id },
    ],
  })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 })
    .limit(200);
  res.json({ messages });
});

router.post('/dm/:userId', auth, async (req, res) => {
  const message = await Message.create({
    sender: req.user._id,
    receiver: req.params.userId,
    content: req.body.content,
    type: 'text',
  });
  await message.populate('sender', 'name avatar');
  res.status(201).json({ message });
});

router.post('/rooms', auth, adminOnly, async (req, res) => {
  const room = await CommunityRoom.create(req.body);
  res.status(201).json({ room });
});

module.exports = router;
