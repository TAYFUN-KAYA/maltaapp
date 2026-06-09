const CommunityRoom = require('../models/CommunityRoom');
const RoomMember = require('../models/RoomMember');
const { getIo } = require('../socket/io');

async function syncRoomMemberCount(roomId) {
  const count = await RoomMember.countDocuments({ room: roomId });
  await CommunityRoom.findByIdAndUpdate(roomId, { memberCount: count });
  const io = getIo();
  const roomKey = roomId.toString();
  if (io) {
    io.to(`room:${roomKey}`).emit('room_member_count', { roomId: roomKey, count });
    io.emit('room_list_update', { roomId: roomKey, count });
  }
  return count;
}

async function isRoomMember(roomId, userId) {
  return RoomMember.exists({ room: roomId, user: userId });
}

module.exports = { syncRoomMemberCount, isRoomMember };
