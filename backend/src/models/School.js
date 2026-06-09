const mongoose = require('mongoose');
const { i18nSchemaFields } = require('../utils/i18nContent');
const { normalizeSchoolCity } = require('../utils/schoolCity');

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    city: {
      type: String,
      enum: ['sliema', 'st_julians', 'valletta', 'gzira', 'msida', 'swieqi', 'san_gwann', 'st_pauls', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    descriptionEn: String,
    descriptionI18n: i18nSchemaFields,
    logo: String,
    images: [String],
    videoUrl: String,
    website: String,
    accreditations: [String],
    courseTypes: [{ type: String, enum: ['general', 'intensive', 'business', 'exam', 'junior', 'work_study'] }],
    minAge: { type: Number, default: 16 },
    maxAge: Number,
    priceFrom: { type: Number, required: true },
    priceTable: [
      {
        course: String,
        weeks: Number,
        price: Number,
        currency: { type: String, default: 'EUR' },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    commissionRate: { type: Number, default: 10 },
  },
  { timestamps: true }
);

schoolSchema.pre('validate', function normalizeCity() {
  if (this.city != null) this.city = normalizeSchoolCity(this.city);
});

module.exports = mongoose.model('School', schoolSchema);
