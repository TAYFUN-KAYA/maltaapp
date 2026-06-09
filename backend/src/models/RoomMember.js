const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityRoom', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

roomMemberSchema.index({ room: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);
