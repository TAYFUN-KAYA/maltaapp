const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    course: String,
    weeks: Number,
    startDate: Date,
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewing', 'offer_sent', 'accepted', 'rejected', 'enrolled'],
      default: 'draft',
    },
    documents: [{ name: String, url: String, uploadedAt: Date }],
    adminNotes: String,
    offerPrice: Number,
    offerCurrency: { type: String, default: 'EUR' },
    commissionAmount: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
