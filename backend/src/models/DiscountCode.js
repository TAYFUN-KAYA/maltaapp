const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    percent: Number,
    fixedAmount: Number,
    minPurchase: Number,
    validUntil: Date,
    tourCategories: [String],
    forTurkish: { type: Boolean, default: false },
    earlyBird: { type: Boolean, default: false },
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DiscountCode', discountSchema);
