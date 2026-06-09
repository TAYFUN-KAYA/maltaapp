const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: String,
    description: String,
    type: {
      type: String,
      enum: ['country', 'topic', 'language_exchange', 'event'],
      default: 'topic',
    },
    icon: String,
    memberCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityRoom', roomSchema);
