const mongoose = require('mongoose');

const customTourSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    preferredDate: Date,
    flexibleDates: Boolean,
    participants: { type: Number, required: true },
    budget: Number,
    budgetCurrency: { type: String, default: 'EUR' },
    requirements: { type: String, required: true },
    tags: [String],
    status: {
      type: String,
      enum: ['pending', 'quoted', 'accepted', 'rejected', 'booked'],
      default: 'pending',
    },
    quotePrice: Number,
    quoteMessage: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomTourRequest', customTourSchema);
