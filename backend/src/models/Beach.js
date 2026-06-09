const mongoose = require('mongoose');
const { i18nSchemaFields } = require('../utils/i18nContent');

const beachSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: String,
    island: { type: String, enum: ['malta', 'gozo', 'comino'], default: 'malta' },
    description: String,
    descriptionI18n: i18nSchemaFields,
    images: [String],
    coordinates: { lat: Number, lng: Number },
    facilities: [String],
    crowdLevel: { type: String, enum: ['low', 'medium', 'high', 'very_high'], default: 'medium' },
    crowdPrediction: String,
    bestFor: [String],
    hasBlueFlag: Boolean,
    featured: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Beach', beachSchema);
