const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
    preferredDate: { type: Date, required: true },
    participants: { type: Number, default: 1 },
    estimatedPrice: Number,
    discountCodeNote: String,
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'quoted', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    contactPhone: String,
    message: String,
    adminReply: String,
    quotePrice: Number,
    groupDateId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
