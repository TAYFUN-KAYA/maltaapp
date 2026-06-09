const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const CustomTourMessage = require('../models/CustomTourMessage');
const CustomTourRequest = require('../models/CustomTourRequest');
const User = require('../models/User');
const { notifyCustomTourMessage } = require('../services/notifications');
const { isRoomMember } = require('../utils/roomMembers');

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Auth required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    if (socket.userRole === 'admin') {
      socket.join('admins');
      socket.join(`admin:${socket.userId}`);
    }

    socket.on('join_room', async (roomId) => {
      if (!roomId) return;
      const member = await isRoomMember(roomId, socket.userId);
      if (!member) return;
      socket.join(`room:${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('room_message', async ({ roomId, content }) => {
      if (!roomId || !content?.trim()) return;
      const member = await isRoomMember(roomId, socket.userId);
      if (!member) return;

      const message = await Message.create({
        sender: socket.userId,
        room: roomId,
        content: content.trim(),
        type: 'text',
      });
      await message.populate('sender', 'name avatar');
      io.to(`room:${roomId}`).emit('new_message', message);
    });

    socket.on('dm', async ({ receiverId, content }) => {
      const message = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content,
        type: 'text',
      });
      await message.populate('sender', 'name avatar');
      io.to(`user:${receiverId}`).emit('new_dm', message);
      socket.emit('new_dm', message);
    });

    socket.on('join_user', () => {
      socket.join(`user:${socket.userId}`);
    });

    socket.on('join_admins', () => {
      if (socket.userRole === 'admin') socket.join('admins');
    });

    socket.on('join_custom_tour', async (requestId) => {
      const request = await CustomTourRequest.findById(requestId);
      if (!request) return;
      const isOwner = request.user.toString() === socket.userId;
      const isAdmin = socket.userRole === 'admin';
      if (!isOwner && !isAdmin) return;
      socket.join(`custom_tour:${requestId}`);
    });

    socket.on('custom_tour_message', async ({ requestId, content }) => {
      if (!content?.trim() || !requestId) return;
      const request = await CustomTourRequest.findById(requestId).populate('user', 'pushToken name');
      if (!request) return;
      const isAdmin = socket.userRole === 'admin';
      const isOwner = request.user._id?.toString() === socket.userId || request.user.toString?.() === socket.userId;
      if (!isOwner && !isAdmin) return;

      const message = await CustomTourMessage.create({
        request: requestId,
        sender: socket.userId,
        content: content.trim(),
        isAdmin,
      });
      await message.populate('sender', 'name role');
      io.to(`custom_tour:${requestId}`).emit('custom_tour_new_message', message);
      await notifyCustomTourMessage({ request, message, isAdmin });
    });
  });
};

module.exports = setupSocket;
