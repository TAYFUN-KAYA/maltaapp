const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    location: String,
    type: {
      type: String,
      enum: ['language_exchange', 'party', 'meetup', 'cultural'],
      default: 'meetup',
    },
    image: String,
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityRoom' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    maxAttendees: Number,
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
