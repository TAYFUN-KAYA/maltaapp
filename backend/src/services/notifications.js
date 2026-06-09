const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIo } = require('../socket/io');
const { sendExpoPush } = require('./push');

function toId(value) {
  if (!value) return null;
  return String(value._id || value);
}

async function createAndPush(userId, { title, body, type, data }) {
  const payload = {
    ...data,
    requestId: data?.requestId != null ? String(data.requestId) : undefined,
  };
  const notification = await Notification.create({
    user: userId,
    title,
    body,
    type,
    data: payload,
    read: false,
  });
  const user = await User.findById(userId).select('pushToken');
  if (user?.pushToken) {
    await sendExpoPush(user.pushToken, { title, body, data: { type, ...payload } });
  }
  const io = getIo();
  if (io) {
    io.to(`user:${userId}`).emit('user_notification', { notification });
  }
  return notification;
}

async function notifyUser(user, { title, body, type, data }) {
  if (!user) return null;
  const id = toId(user);
  return createAndPush(id, { title, body, type, data });
}

async function notifyAdmins({ title, body, type, data }) {
  const admins = await User.find({ role: 'admin' }).select('_id pushToken');
  const io = getIo();
  const payload = {
    ...data,
    requestId: data?.requestId != null ? String(data.requestId) : undefined,
  };
  const results = [];
  for (const admin of admins) {
    const notification = await Notification.create({
      user: admin._id,
      title,
      body,
      type,
      data: payload,
      read: false,
    });
    results.push(notification);
    if (admin.pushToken) {
      await sendExpoPush(admin.pushToken, { title, body, data: { type, ...payload } });
    }
    if (io) {
      io.to(`user:${admin._id}`).emit('admin_notification', { notification });
    }
  }
  if (io) {
    io.to('admins').emit('admin_notification', { title, body, type, data: payload });
  }
  return results;
}

async function notifyCustomTourMessage({ request, message, isAdmin }) {
  const requestId = toId(request);
  const preview = (message.content || '').slice(0, 160);
  const senderName = message.sender?.name || (isAdmin ? 'MaltaStart' : 'Kullanıcı');

  if (isAdmin) {
    const owner = request.user?._id ? request.user : await User.findById(request.user);
    if (owner) {
      await notifyUser(owner, {
        title: 'Özel tur mesajı',
        body: preview || 'Yeni mesajınız var',
        type: 'custom_tour',
        data: { requestId },
      });
    }
  } else {
    await notifyAdmins({
      title: 'Özel tur sohbeti',
      body: `${senderName}: ${preview}`,
      type: 'custom_tour',
      data: { requestId },
    });
  }
}

async function notifyCustomTourRequestCreated(request, user) {
  const requestId = toId(request);
  const name = user?.name || 'Bir kullanıcı';
  await notifyAdmins({
    title: 'Yeni özel tur talebi',
    body: `${name} yeni bir özel tur talebi oluşturdu.`,
    type: 'custom_tour',
    data: { requestId },
  });
}

module.exports = {
  notifyUser,
  notifyAdmins,
  notifyCustomTourMessage,
  notifyCustomTourRequestCreated,
  createAndPush,
};
