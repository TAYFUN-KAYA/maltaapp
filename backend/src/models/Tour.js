const mongoose = require('mongoose');
const { i18nSchemaFields } = require('../utils/i18nContent');

const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleI18n: i18nSchemaFields,
    slug: String,
    category: {
      type: String,
      enum: [
        'boat',
        'jeep',
        'history',
        'diving',
        'water_sports',
        'sunset',
        'private_charter',
        'food_wine',
        'day_trip',
        'student_party',
        'language_exchange',
        'culture',
      ],
      required: true,
    },
    description: { type: String, required: true },
    descriptionEn: String,
    descriptionI18n: i18nSchemaFields,
    images: [String],
    videoUrl: String,
    duration: String,
    durationHours: Number,
    price: { type: Number, required: true },
    originalPrice: Number,
    currency: { type: String, default: 'EUR' },
    maxParticipants: Number,
    minParticipants: { type: Number, default: 1 },
    includes: [String],
    excludes: [String],
    meetingPoint: String,
    tags: [String],
    audience: [{ type: String, enum: ['family', 'couple', 'solo', 'friends', 'students'] }],
    season: [{ type: String, enum: ['summer', 'winter', 'spring', 'autumn', 'all'] }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    studentOnly: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    availableDates: [{ date: Date, spotsLeft: Number }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tour', tourSchema);
