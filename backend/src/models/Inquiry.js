const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    message: { type: String, required: true },
    courseInterest: String,
    weeks: Number,
    status: { type: String, enum: ['open', 'replied', 'closed'], default: 'open' },
    offerPrice: Number,
    adminReply: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
